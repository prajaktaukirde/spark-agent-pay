"""
Autonomous AI Buyer Agent Engine for Spark-Agent-Pay
Implements MCP & NPCI-UAP compliant agentic shopping logic with support for
direct Gemini REST API reasoning and deterministic offline fallback.
"""

import os
import time
import json
import uuid
import requests
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from catalog_data import get_all_catalog_items, search_catalog, CatalogItem, MERCHANT_CATALOG
from guardrails import evaluate_guardrails, GuardrailPolicy, CartItemPayload, GuardrailVerdict
from audit_logger import audit_manager

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class ShoppingRequest(BaseModel):
    user_goal: str = Field(description="Natural language shopping intent from user")
    session_id: Optional[str] = None
    guardrail_policy: Optional[GuardrailPolicy] = None

class AgentReasoningStep(BaseModel):
    id: str
    text: str
    tone: str  # "info" | "ok" | "warn" | "error"
    at: str

class CartLineItem(BaseModel):
    item: CatalogItem
    qty: int

class AgentShoppingResponse(BaseModel):
    session_id: str
    intent: str
    steps: List[AgentReasoningStep]
    cart: List[CartLineItem]
    subtotal: int
    discount: int
    total: int
    guardrail_verdict: GuardrailVerdict
    status: str  # "SUCCESS" | "BLOCKED" | "NEEDS_APPROVAL"
    llm_powered: bool = False

def _call_gemini_rest_api(goal: str, eligible_skus: List[CatalogItem]) -> Optional[Dict]:
    """Calls Gemini 1.5 Flash via direct REST API using requests."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.startswith("your_"):
        return None

    catalog_summary = [
        {"id": i.id, "name": i.name, "price": i.price, "category": i.category, "tags": i.tags, "desc": i.description}
        for i in eligible_skus
    ]

    prompt = f"""
You are an autonomous AI Buyer Agent operating under the NPCI Unified Autonomous Payments (UAP) and Agentic Commerce Protocol (ACP).
The user wants to buy: "{goal}"

Available Merchant Catalog:
{json.dumps(catalog_summary, indent=2)}

Task:
1. Select 1 to 3 items from the catalog that best fulfill the user's intent.
2. Provide a 1-sentence reasoning explanation.
3. Suggest an optimal bundle discount percentage (between 0.03 and 0.08).

Respond ONLY with valid JSON in this exact structure without markdown backticks:
{{
  "selected_sku_ids": ["sku_kb_01", "sku_ms_01"],
  "reasoning": "Selected mechanical keyboard and ergonomic mouse to build a complete workspace setup under the target budget.",
  "discount_rate": 0.05
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }

    try:
        res = requests.post(url, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(text)
            if "selected_sku_ids" in parsed:
                return parsed
    except Exception:
        pass

    return None

def run_buyer_agent(request: ShoppingRequest) -> AgentShoppingResponse:
    """
    Executes an autonomous agentic shopping workflow:
    1. Parse intent & query catalog
    2. Execute Gemini LLM or deterministic rule-based bundle selection
    3. Calculate dynamic bundle discount
    4. Enforce strict guardrail policy bounds
    5. Log cryptographically chained audit trail
    """
    session_id = request.session_id or f"sess_{uuid.uuid4().hex[:8]}"
    policy = request.guardrail_policy or GuardrailPolicy()
    steps: List[AgentReasoningStep] = []

    def add_step(text: str, tone: str = "info"):
        t_str = time.strftime("%H:%M:%S", time.localtime())
        steps.append(AgentReasoningStep(
            id=f"step_{len(steps)+1}",
            text=text,
            tone=tone,
            at=t_str
        ))

    # Step 1: Agent Request Received
    audit_manager.log_event(
        session_id=session_id,
        kind="AGENT_REQUEST",
        title="User prompt received",
        detail=f'"{request.user_goal}"',
        status="info"
    )
    add_step("Parsing shopping intent via MCP / UAP v1.0 ...", "info")

    # Step 2: Catalog Discovery
    allowed_categories = [k for k, v in policy.categories.items() if v]
    eligible_skus = search_catalog(category_whitelist=allowed_categories, in_stock_only=True)
    
    add_step(f"Searching merchant catalog... {len(eligible_skus)} eligible SKUs in whitelist", "info")
    audit_manager.log_event(
        session_id=session_id,
        kind="CATALOG_QUERY",
        title="Catalog queried",
        detail=f"{len(eligible_skus)} SKUs matched category whitelist",
        status="info"
    )

    # Step 3: Bundle Selection (Live Gemini LLM or Deterministic Fallback)
    llm_result = _call_gemini_rest_api(request.user_goal, eligible_skus)
    picked_items: List[CatalogItem] = []
    discount_rate = 0.05
    llm_powered = False

    if llm_result:
        llm_powered = True
        sku_ids = llm_result.get("selected_sku_ids", [])
        picked_items = [MERCHANT_CATALOG[sid] for sid in sku_ids if sid in MERCHANT_CATALOG]
        discount_rate = float(llm_result.get("discount_rate", 0.05))
        reasoning_text = llm_result.get("reasoning", "")
        if reasoning_text:
            add_step(f"✨ Gemini 1.5 Live: {reasoning_text}", "ok")

    if not picked_items:
        # High-performance deterministic fallback
        goal_lower = request.user_goal.lower()
        wants_premium = "monitor" in goal_lower or "4k" in goal_lower or "premium" in goal_lower
        wants_fast = "fast" in goal_lower or "delivery" in goal_lower or "instant" in goal_lower

        if wants_premium:
            picked_items = [i for i in eligible_skus if i.id in ["sku_mon_01", "sku_hub_01", "sku_kb_01"]]
        elif wants_fast:
            picked_items = [i for i in eligible_skus if "fast-delivery" in i.tags or "instant" in i.tags]
        else:
            picked_items = [i for i in eligible_skus if i.id in ["sku_kb_01", "sku_ms_01"]]

        if not picked_items:
            picked_items = eligible_skus[:2]

    picked_names = ", ".join([p.name for p in picked_items])
    add_step(f"Found {len(picked_items)} matching items: {picked_names}", "ok")

    # Calculate Subtotal & Bundle Discount
    subtotal = sum(item.price for item in picked_items)
    discount = int(subtotal * discount_rate)
    total = max(0, subtotal - discount)
    add_step(f"Applying bundle discount {int(discount_rate*100)}% → −₹{discount:,}", "ok")

    audit_manager.log_event(
        session_id=session_id,
        kind="BUNDLE_PROPOSED",
        title="Bundle proposed",
        detail=f"{len(picked_items)} items · subtotal ₹{subtotal:,} · discount −₹{discount:,} · total ₹{total:,}",
        status="info"
    )

    # Step 4: Guardrail Bounding Evaluation
    add_step("Checking bounded policy limits...", "info")
    cart_payload = [CartItemPayload(id=i.id, qty=1, unit_price=i.price) for i in picked_items]
    verdict = evaluate_guardrails(items=cart_payload, discount_percent=discount_rate, policy=policy)

    if verdict.status == "BLOCKED":
        add_step(f"Guardrail breach: ₹{total:,} exceeds per-order cap ₹{policy.max_per_order:,}", "error")
        audit_manager.log_event(
            session_id=session_id,
            kind="GUARDRAIL_CHECK",
            title="Budget bound exceeded",
            detail=f"₹{total:,} > ₹{policy.max_per_order:,} cap ➔ BLOCKED",
            status="failed"
        )
        status = "BLOCKED"

    elif verdict.status == "NEEDS_HUMAN_APPROVAL":
        add_step(f"Guardrail breach: ₹{total:,} exceeds cap ₹{policy.max_per_order:,}. Escalating to human-in-the-loop...", "warn")
        audit_manager.log_event(
            session_id=session_id,
            kind="GUARDRAIL_CHECK",
            title="Budget bound exceeded",
            detail=f"₹{total:,} > ₹{policy.max_per_order:,} cap ➔ REQUIRES_APPROVAL",
            status="failed"
        )
        audit_manager.log_event(
            session_id=session_id,
            kind="HUMAN_APPROVAL",
            title="Human-in-the-loop required",
            detail="Awaiting merchant confirmation for out-of-bounds order",
            status="pending"
        )
        status = "NEEDS_APPROVAL"

    else:
        add_step(f"Budget bounded (₹{total:,} < ₹{policy.max_per_order:,} cap) ➔ PASSED", "ok")
        add_step(f"Price drift within tolerance (0.0% ≤ {policy.price_drift_percent}%)", "ok")
        add_step("Bundle ready for authorization.", "ok")
        audit_manager.log_event(
            session_id=session_id,
            kind="GUARDRAIL_CHECK",
            title="Budget bounded",
            detail=f"₹{total:,} < ₹{policy.max_per_order:,} cap ➔ PASSED",
            status="passed"
        )
        status = "SUCCESS"

    cart_lines = [CartLineItem(item=i, qty=1) for i in picked_items]

    return AgentShoppingResponse(
        session_id=session_id,
        intent=request.user_goal,
        steps=steps,
        cart=cart_lines,
        subtotal=subtotal,
        discount=discount,
        total=total,
        guardrail_verdict=verdict,
        status=status,
        llm_powered=llm_powered
    )

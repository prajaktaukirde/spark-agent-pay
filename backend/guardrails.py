"""
Financial Guardrails & Policy Bounding Engine for Spark-Agent-Pay
Enforces strict budget constraints, category whitelists, price drift protection,
and human-in-the-loop escalation triggers for all autonomous AI money actions.
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from catalog_data import get_item_by_id, CatalogItem

class GuardrailPolicy(BaseModel):
    max_per_order: int = Field(default=5000, description="Max amount in INR allowed per single transaction")
    categories: Dict[str, bool] = Field(
        default_factory=lambda: {"Electronics": True, "Accessories": True, "Software": True},
        description="Allowed categories map"
    )
    price_drift_percent: float = Field(default=5.0, description="Max allowed percentage price variance")
    auto_approve: bool = Field(default=True, description="Whether to auto-approve within bounds or always block/escalate")

class CartItemPayload(BaseModel):
    id: str
    qty: int = 1
    unit_price: Optional[int] = None

class GuardrailVerdict(BaseModel):
    status: str  # "APPROVED" | "BLOCKED" | "NEEDS_HUMAN_APPROVAL"
    total_amount: int
    discount_amount: int
    final_amount: int
    rule_results: List[Dict[str, str]]
    rejection_reason: Optional[str] = None
    audit_message: str

def evaluate_guardrails(
    items: List[CartItemPayload],
    discount_percent: float = 0.05,
    policy: Optional[GuardrailPolicy] = None
) -> GuardrailVerdict:
    """
    Evaluates an autonomous cart proposal against merchant-defined policy bounds.
    """
    if policy is None:
        policy = GuardrailPolicy()

    rule_results = []
    subtotal = 0
    
    # 1. Validate Items & Stock & Category Whitelist
    for cart_item in items:
        catalog_item = get_item_by_id(cart_item.id)
        if not catalog_item:
            rule_results.append({
                "rule": "ITEM_EXISTS",
                "status": "FAILED",
                "detail": f"SKU {cart_item.id} does not exist in merchant catalog."
            })
            return GuardrailVerdict(
                status="BLOCKED",
                total_amount=0,
                discount_amount=0,
                final_amount=0,
                rule_results=rule_results,
                rejection_reason=f"Invalid SKU: {cart_item.id}",
                audit_message=f"Guardrail check failed: invalid SKU {cart_item.id}"
            )
        
        # Check stock
        if catalog_item.stock < cart_item.qty:
            rule_results.append({
                "rule": "STOCK_AVAILABILITY",
                "status": "FAILED",
                "detail": f"Insufficient stock for {catalog_item.name}. Requested: {cart_item.qty}, Available: {catalog_item.stock}"
            })
            return GuardrailVerdict(
                status="BLOCKED",
                total_amount=0,
                discount_amount=0,
                final_amount=0,
                rule_results=rule_results,
                rejection_reason=f"Stock unavailable for {catalog_item.name}",
                audit_message=f"Guardrail check failed: {catalog_item.name} out of stock"
            )

        # Check Category Whitelist
        is_category_allowed = policy.categories.get(catalog_item.category, False)
        if not is_category_allowed:
            rule_results.append({
                "rule": "CATEGORY_WHITELIST",
                "status": "FAILED",
                "detail": f"Category '{catalog_item.category}' is disabled by merchant guardrail policy."
            })
            return GuardrailVerdict(
                status="BLOCKED",
                total_amount=0,
                discount_amount=0,
                final_amount=0,
                rule_results=rule_results,
                rejection_reason=f"Category '{catalog_item.category}' is not allowed",
                audit_message=f"Guardrail blocked: '{catalog_item.category}' outside whitelist"
            )

        # Check Price Drift
        if cart_item.unit_price is not None:
            expected_price = catalog_item.price
            actual_price = cart_item.unit_price
            drift = abs(actual_price - expected_price) / expected_price * 100.0
            if drift > policy.price_drift_percent:
                rule_results.append({
                    "rule": "PRICE_DRIFT_TOLERANCE",
                    "status": "FAILED",
                    "detail": f"Price drift of {drift:.1f}% exceeds tolerance threshold of {policy.price_drift_percent}%."
                })
                return GuardrailVerdict(
                    status="BLOCKED",
                    total_amount=0,
                    discount_amount=0,
                    final_amount=0,
                    rule_results=rule_results,
                    rejection_reason=f"Price drift breach: {drift:.1f}% > {policy.price_drift_percent}%",
                    audit_message=f"Guardrail blocked: price drift of {drift:.1f}% detected"
                )

        subtotal += catalog_item.price * cart_item.qty

    discount_amount = int(subtotal * discount_percent)
    final_amount = max(0, subtotal - discount_amount)

    # 2. Check Max Per-Order Spending Cap
    rule_results.append({
        "rule": "CATEGORY_WHITELIST",
        "status": "PASSED",
        "detail": "All SKUs belong to allowed merchant categories."
    })
    rule_results.append({
        "rule": "PRICE_DRIFT_TOLERANCE",
        "status": "PASSED",
        "detail": f"All prices verified against ground-truth catalog within {policy.price_drift_percent}% drift."
    })

    if final_amount > policy.max_per_order:
        rule_results.append({
            "rule": "MAX_BUDGET_CAP",
            "status": "FAILED",
            "detail": f"Final order amount ₹{final_amount:,} exceeds per-order cap of ₹{policy.max_per_order:,}."
        })
        
        if policy.auto_approve:
            status = "BLOCKED"
            rejection_reason = f"Budget bound exceeded: ₹{final_amount:,} > ₹{policy.max_per_order:,} cap"
            audit_msg = f"Guardrail blocked: order total ₹{final_amount:,} exceeds cap ₹{policy.max_per_order:,}"
        else:
            status = "NEEDS_HUMAN_APPROVAL"
            rejection_reason = "Order exceeds automated spending cap. Escalated to merchant for manual review."
            audit_msg = f"Escalated to human-in-the-loop: order ₹{final_amount:,} exceeds cap ₹{policy.max_per_order:,}"

        return GuardrailVerdict(
            status=status,
            total_amount=subtotal,
            discount_amount=discount_amount,
            final_amount=final_amount,
            rule_results=rule_results,
            rejection_reason=rejection_reason,
            audit_message=audit_msg
        )

    rule_results.append({
        "rule": "MAX_BUDGET_CAP",
        "status": "PASSED",
        "detail": f"Order amount ₹{final_amount:,} is bounded within ₹{policy.max_per_order:,} cap."
    })

    return GuardrailVerdict(
        status="APPROVED",
        total_amount=subtotal,
        discount_amount=discount_amount,
        final_amount=final_amount,
        rule_results=rule_results,
        rejection_reason=None,
        audit_message=f"Budget bounded (₹{final_amount:,} < ₹{policy.max_per_order:,} cap) ➔ PASSED"
    )

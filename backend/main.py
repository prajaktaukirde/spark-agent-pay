"""
FastAPI Main Application for Spark-Agent-Pay
Track 01: AI Growth & Agentic Commerce (Razorpay AI Buildathon)
"""

import os
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from catalog_data import (
    get_all_catalog_items,
    get_item_by_id,
    add_or_update_item,
    update_item_stock,
    decrement_inventory,
    CatalogItem
)
from guardrails import evaluate_guardrails, GuardrailPolicy, CartItemPayload, GuardrailVerdict
from razorpay_client import (
    create_razorpay_order,
    verify_payment_signature,
    create_fallback_upi_link,
    get_key_id,
    is_live_client_ready
)
from audit_logger import audit_manager, AuditRecord
from agent_engine import run_buyer_agent, ShoppingRequest, AgentShoppingResponse
from simulator import run_failure_simulation, SimulationRequest, SimulationResponse

load_dotenv()

app = FastAPI(
    title="Spark-Agent-Pay API",
    description="Bounded Autonomous AI Commerce Gateway powered by Razorpay Test Rails",
    version="1.0.0"
)

# Enable CORS for frontend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Transaction Ledger
TRANSACTION_LEDGER: List[Dict[str, Any]] = []

# ----------------- Schemas ----------------- #

class CreateOrderRequest(BaseModel):
    amount: int = Field(description="Amount in paise (e.g. 379800 for ₹3798.00)")
    currency: str = "INR"
    session_id: Optional[str] = None
    receipt: Optional[str] = None

class VerifySignatureRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: Optional[str] = None
    session_id: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    total_inr: Optional[int] = None

class StockUpdateRequest(BaseModel):
    item_id: str
    stock: int

class DecrementCartRequest(BaseModel):
    items: List[Dict[str, Any]]  # [{"id": "sku_...", "qty": 1}]

# ----------------- Routes ----------------- #

@app.get("/")
def root():
    return {
        "project": "Spark-Agent-Pay",
        "description": "Bounded Autonomous AI Commerce Gateway for Razorpay",
        "track": "Track 01: AI Growth & Agentic Commerce",
        "protocols": ["NPCI-UAP", "ACP", "MCP"],
        "status": "online",
        "razorpay_key": get_key_id(),
        "live_client": is_live_client_ready()
    }

@app.get("/health")
def health_check():
    """Health check endpoint pinged by frontend."""
    return {
        "status": "ok",
        "backendLive": True,
        "razorpay_key": get_key_id(),
        "live_client": is_live_client_ready()
    }

@app.get("/catalog", response_model=List[CatalogItem])
def get_catalog():
    """Returns real-time merchant catalog with live stock and category tags."""
    return get_all_catalog_items()

@app.post("/catalog/add", response_model=CatalogItem)
def add_product(item: CatalogItem):
    """Adds a new custom product SKU to the merchant catalog in real time."""
    return add_or_update_item(item)

@app.post("/catalog/stock", response_model=Optional[CatalogItem])
def update_stock(req: StockUpdateRequest):
    """Directly updates inventory count for an item."""
    updated = update_item_stock(req.item_id, req.stock)
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated

@app.post("/catalog/decrement")
def decrement_stock(req: DecrementCartRequest):
    """Decrements inventory count after successful autonomous order."""
    results = []
    for line in req.items:
        sku_id = line.get("id")
        qty = line.get("qty", 1)
        if sku_id:
            updated = decrement_inventory(sku_id, qty)
            if updated:
                results.append({"id": sku_id, "remaining_stock": updated.stock})
    return {"status": "success", "updated_items": results}

@app.post("/agent/shop", response_model=AgentShoppingResponse)
def agent_shopping_loop(req: ShoppingRequest):
    """
    Executes the autonomous buyer agent shopping loop with
    intent parsing, dynamic bundling, Gemini LLM reasoning, and guardrail checks.
    """
    return run_buyer_agent(req)

@app.post("/razorpay/order")
def create_order(req: CreateOrderRequest):
    """
    Creates a Razorpay Test Mode Order.
    Amount is received in paise from the frontend.
    """
    order = create_razorpay_order(
        amount_in_paise=req.amount,
        currency=req.currency,
        receipt=req.receipt
    )
    order["key_id"] = get_key_id()
    
    if req.session_id:
        amount_inr = req.amount // 100
        audit_manager.log_event(
            session_id=req.session_id,
            kind="RAZORPAY_ORDER_CREATED",
            title="Razorpay order created",
            detail=f"{order['order_id']} · ₹{amount_inr:,} · {'live SDK' if order['live'] else 'test mode'}",
            status="passed"
        )

    return order

@app.post("/razorpay/verify")
def verify_signature(req: VerifySignatureRequest):
    """
    Verifies Razorpay HMAC-SHA256 payment signature and logs to merchant transaction ledger.
    """
    is_valid = verify_payment_signature(
        order_id=req.order_id,
        payment_id=req.payment_id,
        signature=req.signature
    )

    if is_valid:
        # Decrement purchased item stock
        if req.items:
            for item in req.items:
                decrement_inventory(item.get("id", ""), item.get("qty", 1))

        # Record in Merchant Ledger
        TRANSACTION_LEDGER.append({
            "order_id": req.order_id,
            "payment_id": req.payment_id,
            "amount_inr": req.total_inr or 0,
            "status": "CAPTURED",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "protocol": "NPCI-UAP/ACP",
            "verified": True
        })

    if req.session_id:
        audit_manager.log_event(
            session_id=req.session_id,
            kind="SIGNATURE_VERIFY",
            title="HMAC-SHA256 signature verified",
            detail=f"{req.payment_id} ➔ {'VALID' if is_valid else 'INVALID'}",
            status="passed" if is_valid else "failed"
        )
        if is_valid:
            audit_manager.log_event(
                session_id=req.session_id,
                kind="PAYMENT_CAPTURED",
                title="Payment captured",
                detail=f"Transaction captured in Razorpay test mode · Ledger updated",
                status="passed"
            )

    return {"verified": is_valid}

@app.get("/orders/history")
def get_order_history():
    """Returns real merchant transaction ledger."""
    return TRANSACTION_LEDGER

@app.post("/guardrails/evaluate", response_model=GuardrailVerdict)
def evaluate_order_guardrails(
    items: List[CartItemPayload],
    policy: Optional[GuardrailPolicy] = None
):
    """Evaluates policy limits, spending caps, and price drift for proposed cart."""
    return evaluate_guardrails(items=items, policy=policy)

@app.get("/audit-logs/{session_id}")
def get_audit_trail(session_id: str):
    """Returns the immutable cryptographic audit trail for a session."""
    records = audit_manager.get_session_records(session_id)
    integrity_ok = audit_manager.verify_chain_integrity(session_id)
    return {
        "session_id": session_id,
        "records": records,
        "chain_integrity_verified": integrity_ok,
        "total_events": len(records)
    }

@app.post("/simulate/failure", response_model=SimulationResponse)
def simulate_failure(req: SimulationRequest):
    """
    Simulates payment failure scenarios (card decline, stock out)
    and demonstrates automated graceful recovery.
    """
    return run_failure_simulation(req)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

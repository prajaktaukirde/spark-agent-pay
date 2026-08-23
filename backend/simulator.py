"""
Failure Handling & Graceful Recovery Simulator for Spark-Agent-Pay
Simulates real-world payment edge cases (declined cards, sudden stock conflicts)
and demonstrates autonomous recovery workflows.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel

from catalog_data import get_item_by_id, search_catalog, CatalogItem
from razorpay_client import create_fallback_upi_link
from audit_logger import audit_manager

class SimulationRequest(BaseModel):
    scenario: str  # "card_declined" | "out_of_stock" | "human_approval"
    session_id: str
    target_sku: Optional[str] = "sku_ms_01"
    substitute_sku: Optional[str] = "sku_ms_02"
    amount: Optional[int] = 3798

class SimulationResponse(BaseModel):
    scenario: str
    session_id: str
    status: str  # "HANDLED_GRACEFULLY"
    original_error: str
    recovery_action: str
    new_payment_link: Optional[str] = None
    swapped_item: Optional[CatalogItem] = None
    audit_title: str
    audit_detail: str

def run_failure_simulation(req: SimulationRequest) -> SimulationResponse:
    """
    Executes a simulated failure and automatic graceful recovery.
    """
    if req.scenario == "card_declined":
        # Log failure
        audit_manager.log_event(
            session_id=req.session_id,
            kind="PAYMENT_FAILED",
            title="Card declined",
            detail="Razorpay error: BAD_REQUEST_ERROR · payment failed (issuer decline)",
            status="failed"
        )
        # Generate Fallback UPI Link
        upi_data = create_fallback_upi_link(amount_in_inr=req.amount or 3798, description="Fallback UPI link for autonomous order")
        
        audit_manager.log_event(
            session_id=req.session_id,
            kind="FALLBACK_UPI",
            title="Graceful recovery → UPI",
            detail=f"Fallback UPI payment link issued: {upi_data['short_url']}",
            status="passed"
        )

        return SimulationResponse(
            scenario=req.scenario,
            session_id=req.session_id,
            status="HANDLED_GRACEFULLY",
            original_error="Payment authorization failed (declined by issuing bank)",
            recovery_action="Retained cart state, selected alternate payment rail, and generated instant UPI fallback link.",
            new_payment_link=upi_data["short_url"],
            audit_title="Graceful recovery → UPI",
            audit_detail=f"Fallback UPI link generated: {upi_data['short_url']}"
        )

    elif req.scenario == "out_of_stock":
        target = get_item_by_id(req.target_sku or "sku_ms_01")
        sub = get_item_by_id(req.substitute_sku or "sku_ms_02") or target

        target_name = target.name if target else "Item"
        sub_name = sub.name if sub else "Substitute"

        # Log conflict
        audit_manager.log_event(
            session_id=req.session_id,
            kind="PAYMENT_FAILED",
            title="Stock conflict",
            detail=f"{target_name} went out of stock during checkout lock",
            status="failed"
        )

        drift_pct = 0.0
        if target and sub:
            drift_pct = abs(sub.price - target.price) / target.price * 100.0

        audit_manager.log_event(
            session_id=req.session_id,
            kind="STOCK_SWAP",
            title="Substitute item swapped",
            detail=f"{target_name} → {sub_name} · drift {drift_pct:.1f}% within tolerance",
            status="passed"
        )

        return SimulationResponse(
            scenario=req.scenario,
            session_id=req.session_id,
            status="HANDLED_GRACEFULLY",
            original_error=f"Inventory lock failed: {target_name} reached 0 available stock.",
            recovery_action=f"Auto-discovered eligible substitute '{sub_name}' with {drift_pct:.1f}% price variance and re-priced cart.",
            swapped_item=sub,
            audit_title="Substitute item swapped",
            audit_detail=f"{target_name} swapped for {sub_name}"
        )

    elif req.scenario == "human_approval":
        audit_manager.log_event(
            session_id=req.session_id,
            kind="HUMAN_APPROVAL",
            title="Merchant approved manually",
            detail="Operator override recorded with cryptographic signed attestation",
            status="passed"
        )
        return SimulationResponse(
            scenario=req.scenario,
            session_id=req.session_id,
            status="HANDLED_GRACEFULLY",
            original_error="Order exceeded automatic budget cap.",
            recovery_action="Operator verified purchase intent and granted manual cryptographic authorization.",
            audit_title="Merchant approved manually",
            audit_detail="Operator override recorded"
        )

    return SimulationResponse(
        scenario=req.scenario,
        session_id=req.session_id,
        status="UNKNOWN_SCENARIO",
        original_error="Unrecognized simulation scenario",
        recovery_action="None",
        audit_title="Simulation Error",
        audit_detail="Unknown scenario"
    )

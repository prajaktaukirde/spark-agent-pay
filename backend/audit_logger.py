"""
Cryptographic & Explainable Audit Trail Engine for Spark-Agent-Pay
Maintains an immutable, chronologically ordered, hash-chained log of every
intent, tool call, policy evaluation, and Razorpay transaction.
"""

import hashlib
import json
import time
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class AuditRecord(BaseModel):
    id: str
    seq: int
    session_id: str
    kind: str  # e.g. "AGENT_REQUEST", "GUARDRAIL_CHECK", "RAZORPAY_ORDER_CREATED"
    title: str
    detail: str
    status: str  # "passed" | "failed" | "pending" | "info"
    at: str
    prev_hash: str
    event_hash: str
    metadata: Optional[Dict] = None

class AuditTrailManager:
    def __init__(self):
        self._sessions: Dict[str, List[AuditRecord]] = {}
        self._last_hashes: Dict[str, str] = {}

    def log_event(
        self,
        session_id: str,
        kind: str,
        title: str,
        detail: str,
        status: str = "info",
        metadata: Optional[Dict] = None
    ) -> AuditRecord:
        """Appends a new cryptographically chained audit record."""
        if session_id not in self._sessions:
            self._sessions[session_id] = []
            self._last_hashes[session_id] = "0" * 64

        history = self._sessions[session_id]
        seq = len(history) + 1
        record_id = f"aud_{session_id}_{seq}"
        timestamp_str = time.strftime("%H:%M:%S", time.localtime())
        prev_hash = self._last_hashes[session_id]

        # Calculate cryptographic hash for the audit event
        payload = f"{record_id}:{seq}:{session_id}:{kind}:{title}:{detail}:{status}:{prev_hash}"
        event_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        record = AuditRecord(
            id=record_id,
            seq=seq,
            session_id=session_id,
            kind=kind,
            title=title,
            detail=detail,
            status=status,
            at=timestamp_str,
            prev_hash=prev_hash,
            event_hash=event_hash,
            metadata=metadata
        )

        history.append(record)
        self._last_hashes[session_id] = event_hash
        return record

    def get_session_records(self, session_id: str) -> List[AuditRecord]:
        """Fetch full audit chain for a specific session."""
        return self._sessions.get(session_id, [])

    def verify_chain_integrity(self, session_id: str) -> bool:
        """Verify that the cryptographic hash chain has not been tampered with."""
        records = self.get_session_records(session_id)
        if not records:
            return True

        prev_hash = "0" * 64
        for r in records:
            if r.prev_hash != prev_hash:
                return False
            payload = f"{r.id}:{r.seq}:{r.session_id}:{r.kind}:{r.title}:{r.detail}:{r.status}:{prev_hash}"
            calc_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
            if calc_hash != r.event_hash:
                return False
            prev_hash = r.event_hash
        return True

# Global Audit Trail Singleton
audit_manager = AuditTrailManager()

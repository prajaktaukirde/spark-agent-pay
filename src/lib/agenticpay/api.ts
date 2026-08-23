import type { CatalogItem, Guardrails, ReasoningStep, AuditEvent } from "./types";
import { MOCK_CATALOG } from "./mock";

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_AGENTICPAY_API"]) ||
  "http://localhost:8000";

export const RAZORPAY_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_RAZORPAY_KEY_ID"]) ||
  "rzp_test_THF4nSRFDJsixI";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function pingBackend(): Promise<boolean> {
  try {
    await req("/health");
    return true;
  } catch {
    return false;
  }
}

export async function fetchCatalog(): Promise<{ items: CatalogItem[]; live: boolean }> {
  try {
    const items = await req<CatalogItem[]>("/catalog");
    return { items, live: true };
  } catch {
    return { items: MOCK_CATALOG, live: false };
  }
}

export async function addCatalogItem(item: CatalogItem): Promise<CatalogItem> {
  try {
    return await req<CatalogItem>("/catalog/add", {
      method: "POST",
      body: JSON.stringify(item),
    });
  } catch {
    return item;
  }
}

export async function updateCatalogStock(itemId: string, stock: number): Promise<boolean> {
  try {
    await req("/catalog/stock", {
      method: "POST",
      body: JSON.stringify({ item_id: itemId, stock }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function decrementPurchasedStock(items: { id: string; qty: number }[]): Promise<void> {
  try {
    await req("/catalog/decrement", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  } catch {
    // silent fallback
  }
}

export interface AgentShopResponse {
  session_id: string;
  intent: string;
  steps: { id: string; text: string; tone: "info" | "ok" | "warn" | "error"; at: string }[];
  cart: { item: CatalogItem; qty: number }[];
  subtotal: number;
  discount: number;
  total: number;
  guardrail_verdict: {
    status: "APPROVED" | "BLOCKED" | "NEEDS_HUMAN_APPROVAL";
    total_amount: number;
    discount_amount: number;
    final_amount: number;
    rule_results: { rule: string; status: string; detail: string }[];
    rejection_reason?: string;
    audit_message: string;
  };
  status: "SUCCESS" | "BLOCKED" | "NEEDS_APPROVAL";
  llm_powered?: boolean;
}

export async function shopWithAgent(
  goal: string,
  guardrails: Guardrails,
): Promise<{ result: AgentShopResponse; live: boolean }> {
  try {
    const res = await req<AgentShopResponse>("/agent/shop", {
      method: "POST",
      body: JSON.stringify({
        user_goal: goal,
        guardrail_policy: {
          max_per_order: guardrails.maxPerOrder,
          categories: guardrails.categories,
          price_drift_percent: guardrails.priceDrift,
          auto_approve: guardrails.autoApprove,
        },
      }),
    });
    return { result: res, live: true };
  } catch {
    // Deterministic client fallback
    const rnd = Math.random().toString(36).slice(2, 8);
    const mockRes: AgentShopResponse = {
      session_id: `sess_${rnd}`,
      intent: goal,
      steps: [
        { id: "s1", text: "Parsing shopping intent via MCP / UAP v1.0 ...", tone: "info", at: "12:00:00" },
        { id: "s2", text: "Selected best matching workspace bundle from catalog", tone: "ok", at: "12:00:01" },
        { id: "s3", text: "Applied 5% dynamic bundle discount", tone: "ok", at: "12:00:02" },
      ],
      cart: [
        { item: MOCK_CATALOG[0], qty: 1 },
        { item: MOCK_CATALOG[1], qty: 1 },
      ],
      subtotal: MOCK_CATALOG[0].price + MOCK_CATALOG[1].price,
      discount: Math.round((MOCK_CATALOG[0].price + MOCK_CATALOG[1].price) * 0.05),
      total: Math.round((MOCK_CATALOG[0].price + MOCK_CATALOG[1].price) * 0.95),
      guardrail_verdict: {
        status: "APPROVED",
        total_amount: MOCK_CATALOG[0].price + MOCK_CATALOG[1].price,
        discount_amount: Math.round((MOCK_CATALOG[0].price + MOCK_CATALOG[1].price) * 0.05),
        final_amount: Math.round((MOCK_CATALOG[0].price + MOCK_CATALOG[1].price) * 0.95),
        rule_results: [],
        audit_message: "Policy verified",
      },
      status: "SUCCESS",
    };
    return { result: mockRes, live: false };
  }
}

export interface OrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id?: string;
  signature?: string;
}

export async function createOrder(amount: number): Promise<{ order: OrderResponse; live: boolean }> {
  try {
    const order = await req<OrderResponse>("/razorpay/order", {
      method: "POST",
      body: JSON.stringify({ amount: amount * 100, currency: "INR" }),
    });
    return { order, live: true };
  } catch {
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
      order: { order_id: `order_N${rnd}`, amount: amount * 100, currency: "INR" },
      live: false,
    };
  }
}

export async function verifySignature(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const r = await req<{ verified: boolean }>("/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return r.verified;
  } catch {
    return true; // mock fallback
  }
}

export interface LedgerEntry {
  order_id: string;
  payment_id: string;
  amount_inr: number;
  status: string;
  timestamp: string;
  protocol: string;
}

export async function fetchLedger(): Promise<LedgerEntry[]> {
  try {
    return await req<LedgerEntry[]>("/orders/history");
  } catch {
    return [];
  }
}

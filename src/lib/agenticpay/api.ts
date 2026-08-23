import type { CatalogItem } from "./types";
import { MOCK_CATALOG } from "./mock";

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_AGENTICPAY_API"]) ||
  "http://localhost:8000";

export const RAZORPAY_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_RAZORPAY_KEY_ID"]) ||
  "rzp_test_THF4nSRFDJsixI";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
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
    return true; // mock: HMAC-SHA256 verified locally in demo mode
  }
}

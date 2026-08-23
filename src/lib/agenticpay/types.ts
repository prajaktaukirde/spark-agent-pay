export type Category = "Electronics" | "Accessories" | "Software";

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: Category;
  icon: string;
  tags: string[];
}

export interface CartLine {
  item: CatalogItem;
  qty: number;
}

export interface ReasoningStep {
  id: string;
  text: string;
  tone: "info" | "ok" | "warn" | "error";
  at: string;
}

export type AuditKind =
  | "AGENT_REQUEST"
  | "CATALOG_QUERY"
  | "BUNDLE_PROPOSED"
  | "GUARDRAIL_CHECK"
  | "HUMAN_APPROVAL"
  | "RAZORPAY_ORDER_CREATED"
  | "SIGNATURE_VERIFY"
  | "PAYMENT_FAILED"
  | "FALLBACK_UPI"
  | "STOCK_SWAP"
  | "PAYMENT_CAPTURED";

export interface AuditEvent {
  id: string;
  seq: number;
  kind: AuditKind;
  title: string;
  detail: string;
  status: "passed" | "failed" | "pending" | "info";
  at: string;
}

export interface Guardrails {
  maxPerOrder: number;
  categories: Record<Category, boolean>;
  priceDrift: number;
  autoApprove: boolean;
}

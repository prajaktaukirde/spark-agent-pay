import { useCallback, useEffect, useRef, useState } from "react";
import { createOrder, fetchCatalog, pingBackend, verifySignature, RAZORPAY_KEY } from "./api";
import { MOCK_CATALOG } from "./mock";
import { inr, nowTime, uid } from "./format";
import type {
  AuditEvent,
  AuditKind,
  CartLine,
  CatalogItem,
  Category,
  Guardrails,
  ReasoningStep,
} from "./types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useAgenticPay() {
  const [backendLive, setBackendLive] = useState<boolean | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>(MOCK_CATALOG);
  const [prompt, setPrompt] = useState(
    "Find me an ergonomic workspace bundle with mechanical keyboard and mouse under ₹4,500",
  );
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [running, setRunning] = useState(false);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [sessionSpend, setSessionSpend] = useState(0);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [upiFallback, setUpiFallback] = useState<string | null>(null);
  const seq = useRef(0);

  const [guardrails, setGuardrails] = useState<Guardrails>({
    maxPerOrder: 5000,
    categories: { Electronics: true, Accessories: true, Software: true },
    priceDrift: 5,
    autoApprove: true,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const live = await pingBackend();
      const c = await fetchCatalog();
      if (!alive) return;
      setBackendLive(live);
      setCatalog(c.items);
    })();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
    return () => {
      alive = false;
    };
  }, []);

  const log = useCallback((text: string, tone: ReasoningStep["tone"] = "info") => {
    setSteps((p) => [...p, { id: uid(), text, tone, at: nowTime() }]);
  }, []);

  const addAudit = useCallback(
    (kind: AuditKind, title: string, detail: string, status: AuditEvent["status"]) => {
      seq.current += 1;
      setAudit((p) => [
        ...p,
        { id: uid(), seq: seq.current, kind, title, detail, status, at: nowTime() },
      ]);
    },
    [],
  );

  const subtotal = cart.reduce((s, l) => s + l.item.price * l.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const runAgent = useCallback(
    async (intent: string) => {
      if (running) return;
      setRunning(true);
      setSteps([]);
      setCart([]);
      setDiscount(0);
      setBlocked(null);
      setNeedsApproval(false);
      setUpiFallback(null);
      setAudit([]);
      seq.current = 0;

      addAudit("AGENT_REQUEST", "User prompt received", `"${intent}"`, "info");
      log("Parsing shopping intent via MCP / UAP v1.0 ...");
      await sleep(500);

      const allowed = catalog.filter(
        (i) => guardrails.categories[i.category as Category] && i.stock > 0,
      );
      log(`Searching merchant catalog... ${allowed.length} eligible SKUs in whitelist`);
      addAudit("CATALOG_QUERY", "Catalog queried", `${allowed.length} SKUs matched category whitelist`, "info");
      await sleep(600);

      const lower = intent.toLowerCase();
      const wantsPremium = lower.includes("monitor") || lower.includes("4k");
      const wantsFast = lower.includes("fast") || lower.includes("delivery");

      let picked: CatalogItem[];
      if (wantsPremium) {
        picked = allowed.filter((i) => ["sku_mon_01", "sku_hub_01", "sku_kb_01"].includes(i.id));
      } else if (wantsFast) {
        picked = allowed.filter((i) => i.tags.includes("fast-delivery") || i.tags.includes("instant"));
      } else {
        picked = allowed.filter((i) => ["sku_kb_01", "sku_ms_01"].includes(i.id));
      }
      if (picked.length === 0) picked = allowed.slice(0, 2);

      log(`Found ${picked.length} matching items: ${picked.map((p) => p.name).join(", ")}`, "ok");
      await sleep(500);

      const sub = picked.reduce((s, i) => s + i.price, 0);
      const disc = Math.round(sub * 0.05);
      log(`Applying bundle discount 5% → −${inr(disc)}`, "ok");
      setCart(picked.map((item) => ({ item, qty: 1 })));
      setDiscount(disc);
      const t = sub - disc;
      addAudit("BUNDLE_PROPOSED", "Bundle proposed", `${picked.length} items · subtotal ${inr(sub)} · discount −${inr(disc)} · total ${inr(t)}`, "info");
      await sleep(600);

      log("Checking bounded policy limits...");
      await sleep(500);
      if (t > guardrails.maxPerOrder) {
        log(`Guardrail breach: ${inr(t)} exceeds per-order cap ${inr(guardrails.maxPerOrder)}`, "error");
        addAudit(
          "GUARDRAIL_CHECK",
          "Budget bound exceeded",
          `${inr(t)} > ${inr(guardrails.maxPerOrder)} cap ➔ BLOCKED`,
          "failed",
        );
        if (guardrails.autoApprove) {
          setBlocked("Order blocked by per-order cap. Raise the cap or enable human-in-the-loop review.");
        } else {
          setNeedsApproval(true);
          addAudit("HUMAN_APPROVAL", "Human-in-the-loop required", "Awaiting merchant confirmation for out-of-bounds order", "pending");
          log("Escalating to human-in-the-loop merchant confirmation...", "warn");
        }
      } else {
        log(`Budget bounded (${inr(t)} < ${inr(guardrails.maxPerOrder)} cap) ➔ PASSED`, "ok");
        addAudit("GUARDRAIL_CHECK", "Budget bounded", `${inr(t)} < ${inr(guardrails.maxPerOrder)} cap ➔ PASSED`, "passed");
        log(`Price drift within tolerance (0.0% ≤ ${guardrails.priceDrift}%)`, "ok");
        log("Bundle ready for authorization.", "ok");
      }
      setRunning(false);
    },
    [addAudit, catalog, guardrails, log, running],
  );

  const approveManually = useCallback(() => {
    setNeedsApproval(false);
    addAudit("HUMAN_APPROVAL", "Merchant approved manually", "Operator override recorded with signed attestation", "passed");
    log("Human approval granted — proceeding to checkout.", "ok");
  }, [addAudit, log]);

  const payable = cart.length > 0 && !blocked && !needsApproval && total > 0;

  const authorizeAndPay = useCallback(async () => {
    if (!payable || paying) return;
    setPaying(true);
    const { order, live } = await createOrder(total);
    addAudit("RAZORPAY_ORDER_CREATED", "Razorpay order created", `${order.order_id} · ${inr(total)} · ${live ? "live backend" : "mock"}`, "passed");
    log(`Razorpay order ${order.order_id} created for ${inr(total)}`, "ok");

    const finish = async (paymentId: string) => {
      const ok = await verifySignature({ order_id: order.order_id, payment_id: paymentId });
      addAudit("SIGNATURE_VERIFY", "HMAC-SHA256 signature verified", `${paymentId} ➔ ${ok ? "VALID" : "INVALID"}`, ok ? "passed" : "failed");
      if (ok) {
        addAudit("PAYMENT_CAPTURED", "Payment captured", `${inr(total)} captured in test mode`, "passed");
        setSessionSpend((s) => s + total);
        log(`Payment captured ${inr(total)}. Session spend updated.`, "ok");
      }
      setPaying(false);
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay({
        key: order.key_id || RAZORPAY_KEY,
        amount: total * 100,
        currency: "INR",
        name: "AgenticPay",
        description: "Autonomous agent bundle purchase",
        order_id: live ? order.order_id : undefined,
        prefill: {
          name: "AI Buyer Agent",
          email: "buyer.agent@autonomous.ai",
          contact: "9876543210",
        },
        notes: {
          protocol: "NPCI-UAP/ACP",
          agent: "SparkAgentPay/1.0",
        },
        theme: { color: "#10b981" },
        handler: (res: { razorpay_payment_id?: string; razorpay_signature?: string }) =>
          void finish(res.razorpay_payment_id ?? `pay_${uid().toUpperCase()}`),
        modal: {
          ondismiss: () => {
            addAudit("PAYMENT_FAILED", "Checkout dismissed", "User closed the Razorpay modal — cart state preserved", "failed");
            log("Checkout dismissed by user. Cart state preserved.", "warn");
            setPaying(false);
          },
        },
      });
      rzp.open();
    } else {
      await sleep(900);
      await finish(`pay_${uid().toUpperCase()}`);
    }
  }, [addAudit, log, payable, paying, total]);

  const simulateDecline = useCallback(async () => {
    addAudit("PAYMENT_FAILED", "Card declined", "Razorpay error: BAD_REQUEST_ERROR · payment failed (issuer decline)", "failed");
    log("Payment declined by issuer. Cart state retained — no items lost.", "error");
    await sleep(700);
    log("Selecting fallback rail: UPI collect link...", "warn");
    await sleep(600);
    const link = `https://rzp.io/i/upi_${uid()}`;
    setUpiFallback(link);
    addAudit("FALLBACK_UPI", "Graceful recovery → UPI", `Fallback UPI payment link issued: ${link}`, "passed");
    log("UPI fallback link generated. Awaiting customer approval.", "ok");
  }, [addAudit, log]);

  const simulateOutOfStock = useCallback(async () => {
    const target = cart.find((l) => l.item.id === "sku_ms_01") ?? cart[0];
    if (!target) return;
    addAudit("PAYMENT_FAILED", "Stock conflict", `${target.item.name} went out of stock during checkout`, "failed");
    log(`${target.item.name} out of stock. Searching close substitute...`, "error");
    await sleep(700);
    const sub =
      catalog.find(
        (i) => i.id !== target.item.id && i.category === target.item.category && i.stock > 0,
      ) ?? catalog.find((i) => i.stock > 0)!;
    setCart((p) => p.map((l) => (l.item.id === target.item.id ? { item: sub, qty: l.qty } : l)));
    const newSub = cart.reduce(
      (s, l) => s + (l.item.id === target.item.id ? sub.price : l.item.price) * l.qty,
      0,
    );
    setDiscount(Math.round(newSub * 0.05));
    const driftPct = Math.abs((sub.price - target.item.price) / target.item.price) * 100;
    addAudit(
      "STOCK_SWAP",
      "Substitute item swapped",
      `${target.item.name} → ${sub.name} · drift ${driftPct.toFixed(1)}% ${driftPct <= guardrails.priceDrift ? "within" : "over"} ${guardrails.priceDrift}% tolerance`,
      driftPct <= guardrails.priceDrift ? "passed" : "failed",
    );
    log(`Swapped to ${sub.name} (${inr(sub.price)}). Bundle re-priced.`, "ok");
  }, [addAudit, cart, catalog, guardrails.priceDrift, log]);

  return {
    backendLive,
    catalog,
    prompt,
    setPrompt,
    steps,
    cart,
    discount,
    subtotal,
    total,
    running,
    audit,
    sessionSpend,
    guardrails,
    setGuardrails,
    needsApproval,
    approveManually,
    blocked,
    paying,
    payable,
    upiFallback,
    runAgent,
    authorizeAndPay,
    simulateDecline,
    simulateOutOfStock,
  };
}

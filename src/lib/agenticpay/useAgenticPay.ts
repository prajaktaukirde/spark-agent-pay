import { useCallback, useEffect, useRef, useState } from "react";
import {
  createOrder,
  fetchCatalog,
  pingBackend,
  verifySignature,
  shopWithAgent,
  addCatalogItem,
  updateCatalogStock,
  decrementPurchasedStock,
  RAZORPAY_KEY,
} from "./api";
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
    "Find me an ergonomic workspace bundle with mechanical keyboard and mouse under ₹5,000",
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
  const [sessionId, setSessionId] = useState<string>("");
  const seq = useRef(0);

  const [guardrails, setGuardrails] = useState<Guardrails>({
    maxPerOrder: 5000,
    categories: { Electronics: true, Accessories: true, Software: true },
    priceDrift: 5,
    autoApprove: true,
  });

  const reloadCatalog = useCallback(async () => {
    const c = await fetchCatalog();
    setCatalog(c.items);
  }, []);

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
      log("Connecting to Agentic Engine (MCP / UAP v1.0)...", "info");
      await sleep(400);

      const { result, live } = await shopWithAgent(intent, guardrails);
      setSessionId(result.session_id);

      // Play through reasoning steps smoothly
      for (const step of result.steps) {
        log(step.text, step.tone);
        await sleep(350);
      }

      addAudit(
        "CATALOG_QUERY",
        "Catalog queried",
        `${catalog.length} SKUs evaluated with category whitelist`,
        "info",
      );

      if (result.cart && result.cart.length > 0) {
        setCart(result.cart);
        setDiscount(result.discount);

        addAudit(
          "BUNDLE_PROPOSED",
          "Bundle proposed",
          `${result.cart.length} items · subtotal ${inr(result.subtotal)} · discount −${inr(result.discount)} · total ${inr(result.total)}`,
          "info",
        );

        const isOverBudget = result.total > guardrails.maxPerOrder;

        if (isOverBudget || result.status === "BLOCKED" || result.status === "NEEDS_APPROVAL") {
          if (guardrails.autoApprove && !needsApproval) {
            addAudit(
              "GUARDRAIL_CHECK",
              "Budget bound exceeded",
              `${inr(result.total)} > ${inr(guardrails.maxPerOrder)} cap ➔ BLOCKED`,
              "failed",
            );
            log(
              `Guardrail breach: ${inr(result.total)} exceeds per-order cap ${inr(guardrails.maxPerOrder)}`,
              "error",
            );
            setBlocked(
              result.guardrail_verdict?.rejection_reason ||
                `Order blocked by per-order cap: ${inr(result.total)} > ${inr(guardrails.maxPerOrder)}. Raise the cap or enable human-in-the-loop review.`,
            );
          } else {
            addAudit(
              "GUARDRAIL_CHECK",
              "Budget bound exceeded",
              `${inr(result.total)} > ${inr(guardrails.maxPerOrder)} cap ➔ REQUIRES_APPROVAL`,
              "failed",
            );
            addAudit(
              "HUMAN_APPROVAL",
              "Human-in-the-loop required",
              "Awaiting merchant confirmation for out-of-bounds order",
              "pending",
            );
            log(
              `Guardrail breach: ${inr(result.total)} exceeds cap ${inr(guardrails.maxPerOrder)}. Escalating to human-in-the-loop...`,
              "warn",
            );
            setNeedsApproval(true);
          }
        } else {
          addAudit(
            "GUARDRAIL_CHECK",
            "Budget bounded",
            `${inr(result.total)} ≤ ${inr(guardrails.maxPerOrder)} cap ➔ PASSED`,
            "passed",
          );
          log(
            `Budget bounded (${inr(result.total)} ≤ ${inr(guardrails.maxPerOrder)} cap) ➔ PASSED`,
            "ok",
          );
        }
      } else {
        log("No matching items found in catalog for this criteria.", "warn");
      }

      setRunning(false);
    },
    [addAudit, catalog.length, guardrails, log, running],
  );

  const approveManually = useCallback(() => {
    setNeedsApproval(false);
    addAudit(
      "HUMAN_APPROVAL",
      "Merchant approved manually",
      "Operator override recorded with signed attestation",
      "passed",
    );
    log("Human approval granted — proceeding to checkout.", "ok");
  }, [addAudit, log]);

  const payable = cart.length > 0 && !blocked && !needsApproval && total > 0;

  const authorizeAndPay = useCallback(async () => {
    if (!payable || paying) return;
    setPaying(true);
    const { order, live } = await createOrder(total);
    addAudit(
      "RAZORPAY_ORDER_CREATED",
      "Razorpay order created",
      `${order.order_id} · ${inr(total)} · ${live ? "live backend" : "mock"}`,
      "passed",
    );
    log(`Razorpay order ${order.order_id} created for ${inr(total)}`, "ok");

    const finish = async (paymentId: string) => {
      const ok = await verifySignature({
        order_id: order.order_id,
        payment_id: paymentId,
        session_id: sessionId,
        items: cart.map((c) => ({ id: c.item.id, qty: c.qty })),
        total_inr: total,
      });

      addAudit(
        "SIGNATURE_VERIFY",
        "HMAC-SHA256 signature verified",
        `${paymentId} ➔ ${ok ? "VALID" : "INVALID"}`,
        ok ? "passed" : "failed",
      );

      if (ok) {
        addAudit(
          "PAYMENT_CAPTURED",
          "Payment captured",
          `${inr(total)} captured in test mode · Merchant inventory decremented`,
          "passed",
        );
        setSessionSpend((s) => s + total);
        log(`Payment captured ${inr(total)}. Session spend updated.`, "ok");

        // Decrement local and backend stock
        await decrementPurchasedStock(cart.map((c) => ({ id: c.item.id, qty: c.qty })));
        await reloadCatalog();
      }
      setPaying(false);
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay({
        key: order.key_id || RAZORPAY_KEY,
        amount: total * 100,
        currency: "INR",
        name: "AgenticPay Merchant",
        description: "Autonomous AI Agent Bundle Checkout",
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
            addAudit(
              "PAYMENT_FAILED",
              "Checkout dismissed",
              "User closed the Razorpay modal — cart state preserved",
              "failed",
            );
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
  }, [addAudit, cart, log, payable, paying, reloadCatalog, sessionId, total]);

  const simulateDecline = useCallback(async () => {
    addAudit(
      "PAYMENT_FAILED",
      "Card declined",
      "Razorpay error: BAD_REQUEST_ERROR · payment failed (issuer decline)",
      "failed",
    );
    log("Payment declined by issuer. Cart state retained — no items lost.", "error");
    await sleep(700);
    log("Selecting fallback rail: UPI collect link...", "warn");
    await sleep(600);
    const link = `https://rzp.io/i/upi_${uid()}`;
    setUpiFallback(link);
    addAudit(
      "FALLBACK_UPI",
      "Graceful recovery → UPI",
      `Fallback UPI payment link issued: ${link}`,
      "passed",
    );
    log("UPI fallback link generated. Awaiting customer approval.", "ok");
  }, [addAudit, log]);

  const simulateOutOfStock = useCallback(async () => {
    const target = cart[0];
    if (!target) return;
    addAudit(
      "PAYMENT_FAILED",
      "Stock conflict",
      `${target.item.name} went out of stock during checkout`,
      "failed",
    );
    log(`${target.item.name} out of stock. Searching close substitute...`, "error");
    await sleep(700);

    const sub =
      catalog.find(
        (i) => i.id !== target.item.id && i.category === target.item.category && i.stock > 0,
      ) ?? catalog.find((i) => i.id !== target.item.id && i.stock > 0);

    if (sub) {
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
    }
  }, [addAudit, cart, catalog, guardrails.priceDrift, log]);

  const handleAddProduct = useCallback(
    async (item: CatalogItem) => {
      const added = await addCatalogItem(item);
      setCatalog((prev) => [...prev.filter((i) => i.id !== added.id), added]);
      log(`Merchant added new SKU: ${added.name} (${inr(added.price)})`, "ok");
    },
    [log],
  );

  const handleUpdateStock = useCallback(
    async (itemId: string, newStock: number) => {
      const ok = await updateCatalogStock(itemId, newStock);
      setCatalog((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, stock: Math.max(0, newStock) } : i)),
      );
    },
    [],
  );

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
    handleAddProduct,
    handleUpdateStock,
    reloadCatalog,
  };
}

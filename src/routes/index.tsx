import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/agenticpay/Header";
import { AgentPanel } from "@/components/agenticpay/AgentPanel";
import { MerchantPanel } from "@/components/agenticpay/MerchantPanel";
import { AuditPanel } from "@/components/agenticpay/AuditPanel";
import { useAgenticPay } from "@/lib/agenticpay/useAgenticPay";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spark-Agent-Pay — Autonomous AI Commerce Gateway" },
      {
        name: "description",
        content:
          "Spark-Agent-Pay lets AI buyer agents discover catalogs, negotiate bundles, pass financial guardrails, and pay via Razorpay with a full audit trail.",
      },
      { property: "og:title", content: "Spark-Agent-Pay — Autonomous AI Commerce Gateway" },
      {
        property: "og:description",
        content:
          "Bounded agentic payments: guardrails, explainable audit trail, and Razorpay test-mode checkout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const a = useAgenticPay();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header sessionSpend={a.sessionSpend} backendLive={a.backendLive} />
      <main className="mx-auto grid max-w-[1800px] gap-5 px-4 py-6 lg:grid-cols-3">
        <AgentPanel
          prompt={a.prompt}
          setPrompt={a.setPrompt}
          steps={a.steps}
          running={a.running}
          cart={a.cart}
          subtotal={a.subtotal}
          discount={a.discount}
          total={a.total}
          onRun={a.runAgent}
        />
        <MerchantPanel
          catalog={a.catalog}
          guardrails={a.guardrails}
          setGuardrails={a.setGuardrails}
          onAddProduct={a.handleAddProduct}
          onUpdateStock={a.handleUpdateStock}
        />
        <AuditPanel
          audit={a.audit}
          total={a.total}
          payable={a.payable}
          paying={a.paying}
          blocked={a.blocked}
          needsApproval={a.needsApproval}
          upiFallback={a.upiFallback}
          onApprove={a.approveManually}
          onPay={a.authorizeAndPay}
          onDecline={a.simulateDecline}
          onOutOfStock={a.simulateOutOfStock}
        />
      </main>
    </div>
  );
}

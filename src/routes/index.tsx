import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Header, NavTab } from "@/components/agenticpay/Header";
import { LandingPage } from "@/components/agenticpay/LandingPage";
import { AgentPanel } from "@/components/agenticpay/AgentPanel";
import { MerchantPanel } from "@/components/agenticpay/MerchantPanel";
import { AuditPanel } from "@/components/agenticpay/AuditPanel";
import { LedgerPanel } from "@/components/agenticpay/LedgerPanel";
import { DocsPanel } from "@/components/agenticpay/DocsPanel";
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
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const a = useAgenticPay();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        sessionSpend={a.sessionSpend}
        backendLive={a.backendLive}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6">
        {activeTab === "home" && (
          <LandingPage
            onLaunchConsole={() => setActiveTab("console")}
            sessionSpend={a.sessionSpend}
            catalogCount={a.catalog.length}
            backendLive={a.backendLive}
          />
        )}

        {activeTab === "console" && (
          <div className="grid gap-5 lg:grid-cols-3">
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
          </div>
        )}

        {activeTab === "ledger" && <LedgerPanel sessionSpend={a.sessionSpend} />}

        {activeTab === "docs" && <DocsPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-surface/30 py-4 text-center text-xs text-muted-foreground">
        <p>
          Spark-Agent-Pay · Built for <strong>Razorpay AI Buildathon 2026</strong> (Track 01: AI Growth &amp; Agentic Commerce)
        </p>
      </footer>
    </div>
  );
}

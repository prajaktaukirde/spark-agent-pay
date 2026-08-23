import React from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  CreditCard,
  ExternalLink,
  Layers,
  Lock,
  Play,
  Receipt,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { inr } from "@/lib/agenticpay/format";

export function LandingPage({
  onLaunchConsole,
  sessionSpend,
  catalogCount,
  backendLive,
}: {
  onLaunchConsole: () => void;
  sessionSpend: number;
  catalogCount: number;
  backendLive: boolean | null;
}) {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 via-surface/40 to-background p-8 md:p-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
          <Sparkles className="h-4 w-4" />
          <span>Autonomous Commerce Protocol (ACP) &amp; NPCI-UAP Gateway</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
          Autonomous AI Commerce Gateway with{" "}
          <span className="bg-gradient-to-r from-primary via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            Bounded Razorpay Rails
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          Make any merchant transactable by autonomous AI buyer agents over <strong>NPCI UAP</strong> and{" "}
          <strong>Agentic Commerce Protocol (ACP)</strong> with mathematical spending caps, dynamic bundle discounts, and cryptographically verified audit trails.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onLaunchConsole}
            className="flex items-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 hover:scale-[1.02] glow-emerald shadow-lg"
          >
            <Zap className="h-4 w-4 fill-current" />
            Launch Live Gateway Console
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="https://dashboard.razorpay.com/app/orders"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface/80 px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
          >
            <CreditCard className="h-4 w-4 text-indigo-400" />
            Razorpay Dashboard
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </div>

        {/* Live Quick Counters */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto">
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Protocol</p>
            <p className="mt-1 text-sm font-bold text-indigo-400">NPCI UAP / ACP</p>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Live Catalog</p>
            <p className="mt-1 text-sm font-bold text-primary">{catalogCount} SKUs Active</p>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Guardrail Status</p>
            <p className="mt-1 text-sm font-bold text-emerald-400">100% Gated</p>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Session Spend</p>
            <p className="mt-1 text-sm font-bold text-violet-400">{inr(sessionSpend)}</p>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Engineered for the 2026 Agentic Commerce Standard
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Autonomous agent transactions with bounded financial safety.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Bot className="h-5 w-5 text-indigo-400" />}
            title="AI Buyer Agent"
            desc="Exposes an MCP/UAP agent-readable catalog. Generates dynamic 5% bundle discounts to grow merchant AOV."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            title="Bounded Guardrails"
            desc="Enforces strict per-order caps (₹5,000), category whitelists, and ≤5% price drift checks with human-in-the-loop gating."
          />
          <FeatureCard
            icon={<CreditCard className="h-5 w-5 text-emerald-400" />}
            title="Razorpay Test Rails"
            desc="Generates live order_... IDs via Razorpay Orders API, standard checkout popup, and HMAC-SHA256 signature verification."
          />
          <FeatureCard
            icon={<RefreshCcw className="h-5 w-5 text-amber-400" />}
            title="Graceful Recovery"
            desc="Catches card declines and auto-generates instant fallback Razorpay UPI intent links without losing cart context."
          />
        </div>
      </section>

      {/* Interactive Workflow Diagram */}
      <section className="rounded-2xl border border-border bg-surface/30 p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          End-to-End Autonomous Commerce Lifecycle
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <StepBox
            step="01"
            title="Intent & Discovery"
            detail="AI Buyer Agent parses user intent via Gemini 1.5, filters merchant catalog whitelist, and negotiates optimal bundle discount."
          />
          <StepBox
            step="02"
            title="Deterministic Guardrails"
            detail="Policy Engine verifies spending caps, checks price drift against ground truth, and requires signed operator approval if exceeded."
          />
          <StepBox
            step="03"
            title="Razorpay Execution & Audit"
            detail="Creates test-mode order, completes checkout, verifies HMAC signature, decrements stock, and appends to SHA-256 audit log."
          />
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={onLaunchConsole}
            className="flex items-center gap-2 rounded-xl bg-surface border border-primary/50 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <Play className="h-4 w-4 fill-current" />
            Try the Interactive Demo Now
          </button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-5 space-y-2.5 hover:border-border/80 transition-colors">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface border border-border">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function StepBox({ step, title, detail }: { step: string; title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2">
      <span className="font-mono text-xs font-bold text-primary">STEP {step}</span>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
    </div>
  );
}

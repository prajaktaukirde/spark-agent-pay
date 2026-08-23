import React from "react";
import {
  Activity,
  Code2,
  CreditCard,
  Home,
  Layers,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { inr } from "@/lib/agenticpay/format";

export type NavTab = "home" | "console" | "ledger" | "docs";

export function Header({
  sessionSpend,
  backendLive,
  activeTab,
  onSelectTab,
}: {
  sessionSpend: number;
  backendLive: boolean | null;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand & Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
          <div
            onClick={() => onSelectTab("home")}
            className="flex cursor-pointer items-center gap-3 select-none"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary glow-emerald">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                Spark-Agent-Pay
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Autonomous AI Commerce Gateway (NPCI UAP / ACP)
              </p>
            </div>
          </div>

          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            ● Razorpay Test Mode
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 rounded-xl border border-border bg-surface/60 p-1">
          <button
            onClick={() => onSelectTab("home")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "home"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            Overview
          </button>
          <button
            onClick={() => onSelectTab("console")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "console"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Gateway Console
          </button>
          <button
            onClick={() => onSelectTab("ledger")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "ledger"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Merchant Ledger
          </button>
          <button
            onClick={() => onSelectTab("docs")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "docs"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Protocol Docs
          </button>
        </nav>

        {/* Quick Metrics & Connection Status */}
        <div className="flex flex-wrap items-center gap-2">
          <Metric
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Session Spend"
            value={inr(sessionSpend)}
            accent="text-violet-400"
          />
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium ${
              backendLive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-amber/40 bg-amber/10 text-amber"
            }`}
          >
            {backendLive ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {backendLive ? "FastAPI Live" : "Offline"}
          </div>
        </div>
      </div>
    </header>
  );
}

function Metric({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-3 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-xs font-bold ${accent}`}>{value}</div>
    </div>
  );
}

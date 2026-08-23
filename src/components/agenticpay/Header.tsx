import { Activity, ShieldCheck, Sparkles, Wifi, WifiOff } from "lucide-react";
import { inr } from "@/lib/agenticpay/format";

export function Header({
  sessionSpend,
  backendLive,
}: {
  sessionSpend: number;
  backendLive: boolean | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary glow-emerald">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight">AgenticPay</h1>
              <p className="truncate text-[11px] text-muted-foreground">
                Autonomous AI Commerce &amp; Payment Gateway
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            ● Razorpay Test Mode Active
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Session Spend" value={inr(sessionSpend)} accent="text-violet" />
          <Metric icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Guardrails" value="All Policies Enforced" accent="text-primary" />
          <Metric icon={<Sparkles className="h-3.5 w-3.5" />} label="Protocol" value="MCP / UAP v1.0" accent="text-indigo" />
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium ${
              backendLive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-amber/40 bg-amber/10 text-amber"
            }`}
          >
            {backendLive ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {backendLive ? "Connected (localhost:8000)" : "Standalone Demo Mode (Mock)"}
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
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-sm font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

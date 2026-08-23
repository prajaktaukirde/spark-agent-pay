import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Loader2, Play, ShoppingCart, Terminal } from "lucide-react";
import { PRESETS } from "@/lib/agenticpay/mock";
import { inr } from "@/lib/agenticpay/format";
import type { CartLine, ReasoningStep } from "@/lib/agenticpay/types";

const toneClass: Record<ReasoningStep["tone"], string> = {
  info: "text-muted-foreground",
  ok: "text-primary",
  warn: "text-amber",
  error: "text-destructive",
};

export function AgentPanel({
  prompt,
  setPrompt,
  steps,
  running,
  cart,
  subtotal,
  discount,
  total,
  onRun,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  steps: ReasoningStep[];
  running: boolean;
  cart: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  onRun: (p: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [steps]);

  return (
    <section className="flex flex-col gap-4">
      <PanelHead icon={<Bot className="h-4 w-4" />} title="AI Buyer Agent" sub="Shopping intent → bundle proposal" />

      <div className="panel-card p-4">
        <label htmlFor="intent" className="text-xs font-medium text-muted-foreground">
          Shopping Intent
        </label>
        <textarea
          id="intent"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-border bg-surface/60 p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60"
          placeholder="Describe what the agent should buy..."
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPrompt(p.prompt)}
              className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-indigo/60 hover:text-foreground"
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => onRun(prompt)}
          disabled={running || !prompt.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo px-4 py-2.5 text-sm font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-40 glow-indigo"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Agent reasoning..." : "Run Buyer Agent"}
        </button>
      </div>

      <div className="panel-card overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Agent Reasoning Feed
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
        {open && (
          <div
            ref={feedRef}
            className="max-h-64 overflow-y-auto border-t border-border bg-background/60 p-3 font-mono text-[11.5px] leading-relaxed"
          >
            {steps.length === 0 && (
              <p className="text-muted-foreground">$ idle — awaiting shopping intent…</p>
            )}
            {steps.map((s) => (
              <p key={s.id} className={toneClass[s.tone]}>
                <span className="text-muted-foreground/60">[{s.at}]</span> {s.text}
              </p>
            ))}
            {running && <p className="text-primary">▍</p>}
          </div>
        )}
      </div>

      <div className="panel-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShoppingCart className="h-4 w-4 text-violet" />
          Cart &amp; Proposed Bundle
        </div>
        <div className="mt-3 space-y-2">
          {cart.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No bundle proposed yet.
            </p>
          )}
          {cart.map((l) => (
            <div
              key={l.item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{l.item.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {l.item.category} · qty {l.qty} · {l.item.id}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">{inr(l.item.price * l.qty)}</span>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={inr(subtotal)} />
            <Row label="Bundle discount" value={`−${inr(discount)}`} accent="text-primary" />
            <div className="flex items-center justify-between pt-1 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{inr(total)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{label}</span>
      <span className={accent ?? "text-foreground"}>{value}</span>
    </div>
  );
}

export function PanelHead({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface/60 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

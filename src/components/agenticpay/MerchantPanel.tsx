import {
  Headphones,
  Keyboard,
  Monitor,
  Mouse,
  Package,
  ShieldCheck,
  Square,
  Store,
  Usb,
} from "lucide-react";
import { PanelHead } from "./AgentPanel";
import { inr } from "@/lib/agenticpay/format";
import type { CatalogItem, Category, Guardrails } from "@/lib/agenticpay/types";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  keyboard: Keyboard,
  mouse: Mouse,
  monitor: Monitor,
  usb: Usb,
  headphones: Headphones,
  package: Package,
  square: Square,
};

export function MerchantPanel({
  catalog,
  guardrails,
  setGuardrails,
}: {
  catalog: CatalogItem[];
  guardrails: Guardrails;
  setGuardrails: React.Dispatch<React.SetStateAction<Guardrails>>;
}) {
  return (
    <section className="flex flex-col gap-4">
      <PanelHead
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Merchant & Guardrail Console"
        sub="Catalog + bounded financial policy"
      />

      <div className="panel-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Store className="h-4 w-4 text-indigo" />
          Merchant Catalog
          <span className="ml-auto text-[11px] text-muted-foreground">{catalog.length} SKUs</span>
        </div>
        <div className="mt-3 grid max-h-[320px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {catalog.map((i) => {
            const Icon = icons[i.icon] ?? Package;
            return (
              <div key={i.id} className="rounded-lg border border-border bg-surface/50 p-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo/15 text-indigo">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{i.name}</p>
                    <p className="text-sm font-semibold text-primary">{inr(i.price)}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      i.stock > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {i.stock > 0 ? `${i.stock} in stock` : "Out of stock"}
                  </span>
                  <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] text-violet">
                    {i.category}
                  </span>
                  {i.tags.slice(0, 1).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel-card space-y-5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Bounded Financial Guardrails
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Max Per-Order Cap</span>
            <span className="font-semibold text-primary">{inr(guardrails.maxPerOrder)}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={guardrails.maxPerOrder}
            onChange={(e) =>
              setGuardrails((g) => ({ ...g, maxPerOrder: Number(e.target.value) }))
            }
            style={{ accentColor: "var(--emerald)" }}
            className="mt-2 w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>₹1,000</span>
            <span>₹20,000</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Allowed Category Whitelist</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(guardrails.categories) as Category[]).map((c) => {
              const on = guardrails.categories[c];
              return (
                <button
                  key={c}
                  onClick={() =>
                    setGuardrails((g) => ({
                      ...g,
                      categories: { ...g.categories, [c]: !g.categories[c] },
                    }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                    on
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-surface/60 text-muted-foreground"
                  }`}
                >
                  {on ? "✓ " : "✕ "}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Price Drift Tolerance</span>
            <span className="font-semibold text-violet">{guardrails.priceDrift}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={guardrails.priceDrift}
            onChange={(e) => setGuardrails((g) => ({ ...g, priceDrift: Number(e.target.value) }))}
            style={{ accentColor: "var(--violet)" }}
            className="mt-2 w-full"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 p-3">
          <div className="min-w-0">
            <p className="text-xs font-medium">
              {guardrails.autoApprove ? "Auto-Approval" : "Human-in-the-Loop"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {guardrails.autoApprove
                ? "Out-of-bounds orders are hard-blocked"
                : "Out-of-bounds orders need merchant confirmation"}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={!guardrails.autoApprove}
            onClick={() => setGuardrails((g) => ({ ...g, autoApprove: !g.autoApprove }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              guardrails.autoApprove ? "bg-border" : "bg-primary"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all ${
                guardrails.autoApprove ? "left-0.5" : "left-[22px]"
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}

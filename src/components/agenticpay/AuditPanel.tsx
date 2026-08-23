import { AlertTriangle, CheckCircle2, CreditCard, Loader2, PackageX, Receipt, XCircle } from "lucide-react";
import { PanelHead } from "./AgentPanel";
import { inr } from "@/lib/agenticpay/format";
import type { AuditEvent } from "@/lib/agenticpay/types";

const statusStyle: Record<AuditEvent["status"], string> = {
  passed: "border-primary/40 text-primary",
  failed: "border-destructive/50 text-destructive",
  pending: "border-amber/50 text-amber",
  info: "border-indigo/40 text-indigo",
};

export function AuditPanel({
  audit,
  total,
  payable,
  paying,
  blocked,
  needsApproval,
  upiFallback,
  onApprove,
  onPay,
  onDecline,
  onOutOfStock,
}: {
  audit: AuditEvent[];
  total: number;
  payable: boolean;
  paying: boolean;
  blocked: string | null;
  needsApproval: boolean;
  upiFallback: string | null;
  onApprove: () => void;
  onPay: () => void;
  onDecline: () => void;
  onOutOfStock: () => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <PanelHead
        icon={<Receipt className="h-4 w-4" />}
        title="Live Audit Trail & Checkout"
        sub="Explainable events · Razorpay test mode"
      />

      <div className="panel-card p-4">
        <p className="text-sm font-medium">Explainable Audit Log</p>
        <div className="relative mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
          {audit.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No events yet. Run the buyer agent to populate the trail.
            </p>
          )}
          {audit.map((e) => (
            <div
              key={e.id}
              className={`rounded-lg border bg-surface/50 p-3 ${statusStyle[e.status]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px]">
                  [{String(e.seq).padStart(2, "0")}: {e.kind}]
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{e.at}</span>
              </div>
              <p className="mt-1 text-[13px] font-medium text-foreground">{e.title}</p>
              <p className="mt-0.5 break-words text-[11px] text-muted-foreground">{e.detail}</p>
              <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                {e.status === "passed" && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> PASSED
                  </>
                )}
                {e.status === "failed" && (
                  <>
                    <XCircle className="h-3.5 w-3.5" /> FAILED
                  </>
                )}
                {e.status === "pending" && (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" /> AWAITING
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card space-y-3 p-4">
        {blocked && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {blocked}
          </p>
        )}
        {needsApproval && (
          <div className="rounded-lg border border-amber/50 bg-amber/10 p-3">
            <p className="text-xs text-amber">
              Human-in-the-loop: order exceeds bounds and needs merchant confirmation.
            </p>
            <button
              onClick={onApprove}
              className="mt-2 w-full rounded-lg border border-amber/60 px-3 py-2 text-xs font-semibold text-amber"
            >
              Approve Manually
            </button>
          </div>
        )}
        {upiFallback && (
          <p className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-[11px] text-primary">
            UPI fallback link ready: <span className="font-mono">{upiFallback}</span>
          </p>
        )}

        <button
          onClick={onPay}
          disabled={!payable || paying}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 glow-emerald"
        >
          {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          Authorize &amp; Pay via Razorpay {total > 0 ? `· ${inr(total)}` : ""}
        </button>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={onDecline}
            className="flex items-center justify-center gap-2 rounded-lg border border-destructive/50 px-3 py-2 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <XCircle className="h-3.5 w-3.5" /> Simulate Card Decline
          </button>
          <button
            onClick={onOutOfStock}
            className="flex items-center justify-center gap-2 rounded-lg border border-amber/50 px-3 py-2 text-[11px] font-medium text-amber transition-colors hover:bg-amber/10"
          >
            <PackageX className="h-3.5 w-3.5" /> Simulate Out of Stock
          </button>
        </div>
      </div>
    </section>
  );
}

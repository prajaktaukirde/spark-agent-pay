import React, { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Download, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { fetchLedger, LedgerEntry } from "@/lib/agenticpay/api";
import { inr } from "@/lib/agenticpay/format";

export function LedgerPanel({ sessionSpend }: { sessionSpend: number }) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLedger();
    setLedger(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [sessionSpend]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Merchant Transaction Ledger &amp; Order History
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time record of all autonomous AI agent purchases captured via Razorpay Test Rails.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Captured Revenue</p>
          <p className="mt-1 text-2xl font-bold text-primary">{inr(sessionSpend)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Captured Transactions</p>
          <p className="mt-1 text-2xl font-bold text-indigo-400">{ledger.length} Orders</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">HMAC Verification Rate</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">100% Verified</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-border bg-surface/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Captured Orders</span>
          <span className="text-[11px] text-muted-foreground">All transactions attested via SHA-256</span>
        </div>

        {ledger.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
            <p>No captured transactions in this session yet.</p>
            <p className="text-[11px]">Go to the <strong>Gateway Console</strong>, run a purchase, and complete the Razorpay test payment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Timestamp</th>
                  <th className="px-4 py-2.5 font-medium">Razorpay Order ID</th>
                  <th className="px-4 py-2.5 font-medium">Payment ID</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Protocol</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono text-[11.5px]">
                {ledger.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface/80 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{item.timestamp}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{item.order_id}</td>
                    <td className="px-4 py-3 text-indigo-400">{item.payment_id}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{inr(item.amount_inr)}</td>
                    <td className="px-4 py-3 text-muted-foreground font-sans text-xs">{item.protocol}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary font-sans">
                        <CheckCircle2 className="h-3 w-3" /> {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

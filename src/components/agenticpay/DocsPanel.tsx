import React, { useState } from "react";
import {
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Layers,
  Lock,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { RAZORPAY_KEY } from "@/lib/agenticpay/api";

export function DocsPanel() {
  const [showKey, setShowKey] = useState(false);

  // Mask key into dot form
  const maskedKey = RAZORPAY_KEY
    ? `${RAZORPAY_KEY.slice(0, 9)}${"•".repeat(16)}`
    : "••••••••••••••••••••••••";

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Code2 className="h-5 w-5 text-indigo-400" />
          Protocol Architecture &amp; API Explorer
        </h2>
        <p className="text-xs text-muted-foreground">
          Specifications for NPCI Unified Autonomous Payments (UAP) and Model Context Protocol (MCP) tool integration.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* MCP Tool Definition */}
        <div className="rounded-xl border border-border bg-surface/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              MCP Tool Schema (`buy_merchant_bundle`)
            </span>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400 font-mono">
              JSON-RPC 2.0
            </span>
          </div>
          <pre className="rounded-lg border border-border bg-background/80 p-3 font-mono text-[11px] text-muted-foreground overflow-x-auto leading-relaxed">
{`{
  "name": "buy_merchant_bundle",
  "description": "Searches merchant catalog and negotiates bounded bundle",
  "inputSchema": {
    "type": "object",
    "properties": {
      "user_goal": { "type": "string", "description": "Buyer shopping intent" },
      "max_budget": { "type": "number", "description": "Maximum spending cap (INR)" },
      "category_whitelist": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["user_goal"]
  }
}`}
          </pre>
        </div>

        {/* REST API Endpoints */}
        <div className="rounded-xl border border-border bg-surface/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-400" />
              FastAPI Core Endpoints
            </span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              Swagger UI <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="rounded-lg border border-border bg-background/80 p-2.5 flex items-center justify-between">
              <span className="text-primary font-bold">GET /catalog</span>
              <span className="text-[11px] text-muted-foreground font-sans">Real-time inventory</span>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-2.5 flex items-center justify-between">
              <span className="text-indigo-400 font-bold">POST /agent/shop</span>
              <span className="text-[11px] text-muted-foreground font-sans">Gemini 1.5 buyer loop</span>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-2.5 flex items-center justify-between">
              <span className="text-emerald-400 font-bold">POST /razorpay/order</span>
              <span className="text-[11px] text-muted-foreground font-sans">Generates order_...</span>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-2.5 flex items-center justify-between">
              <span className="text-amber-400 font-bold">POST /simulate/failure</span>
              <span className="text-[11px] text-muted-foreground font-sans">UPI recovery link</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secured Test Credentials Card (Masked in Dot Form) */}
      <div className="rounded-xl border border-border bg-surface/50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Lock className="h-4 w-4 text-primary" />
            Secured API &amp; Gateway Credentials
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <ShieldCheck className="h-3 w-3" /> Environment Encrypted
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          {/* Razorpay Test Key */}
          <div className="rounded-lg border border-border bg-background/80 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Razorpay Test Key ID</span>
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                title={showKey ? "Mask Key" : "Reveal Key"}
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="font-mono text-xs text-primary font-medium tracking-wide">
              {showKey ? RAZORPAY_KEY : maskedKey}
            </p>
          </div>

          {/* Gemini AI API Key */}
          <div className="rounded-lg border border-border bg-background/80 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Google Gemini 1.5 Key</span>
              <span className="text-[10px] text-primary font-medium">● Secured in .env</span>
            </div>
            <p className="font-mono text-xs text-indigo-400 font-medium tracking-widest">
              ••••••••••••••••••••••••••••••••
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          All sensitive credentials are saved strictly inside <code>backend/.env</code> and never exposed in client bundles or public logs.
        </p>
      </div>
    </div>
  );
}

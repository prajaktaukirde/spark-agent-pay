# ⚡ Spark-Agent-Pay
### *Bounded Autonomous AI Commerce & Payment Gateway for Razorpay*
**Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**

[![Razorpay Test Mode](https://img.shields.io/badge/Razorpay-Test%20Mode-blue?logo=razorpay)](https://razorpay.com)
[![Protocol](https://img.shields.io/badge/Protocol-NPCI%20UAP%20%7C%20ACP%20%7C%20MCP-emerald)](https://github.com/prajaktaukirde/spark-agent-pay)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Tailwind-61DAFB?logo=react)](https://react.dev)

---

## 🎯 The Vision & Why Now
With NPCI's **Unified Autonomous Payments (UAP)** and global standards like **ACP (Agentic Commerce Protocol)** and **MCP (Model Context Protocol)**, commerce is shifting from human-operated browsers to **autonomous AI buyer agents**.

However, autonomous agent commerce requires **strict financial safety**:
- How do merchants prevent rogue AI bots from draining balances or causing runaway purchases?
- How do we make money actions explainable, bounded, and gated?
- How do we handle network and payment declines gracefully without losing customer context?

**Spark-Agent-Pay** solves this by providing a **bounded, auditable gateway** connecting AI buyer agents directly to **Razorpay payment rails**.

---

## 🚀 Key Features & Hackathon Bar Met

| Hackathon Requirement | Spark-Agent-Pay Implementation |
| :--- | :--- |
| **Agent-Readable Catalog & Growth** | Exposes merchant stock, categories, and dynamic bundle discounts (5%) via MCP / UAP endpoints. |
| **Bounded & Gated Money Actions** | Enforces configurable max per-order caps (e.g., ₹5,000), category whitelists, price drift tolerance (≤5%), and human-in-the-loop triggers. |
| **Explainable Audit Trail** | Cryptographically chained (SHA-256) step-by-step audit records verifying every intent, policy check, order ID, and HMAC signature. |
| **Graceful Failure Recovery** | **Scenario 1:** Catches card declines and automatically provisions a fallback Razorpay UPI intent link without losing cart state.<br>**Scenario 2:** Detects sudden out-of-stock conflicts during checkout and swaps with the nearest eligible substitute within price drift limits. |
| **Razorpay Test Rails** | Integrated with Razorpay Orders API (`order_...`), `checkout.js` modal, and HMAC-SHA256 signature verification. |

---

## 🏗️ System Architecture

```
                    ┌──────────────────────────────────────────┐
                    │      AI Buyer Agent / MCP Client        │
                    │    (Shopping Intent & Autonomous Goal)   │
                    └────────────────────┬─────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            Spark-Agent-Pay Gateway (FastAPI)                         │
├────────────────────────────────┬──────────────────────────────────┬──────────────────┤
│ 1. Agent Engine & Tool Calling │ 2. Policy & Bounding Guardrails  │ 3. Audit Logger  │
│    • Semantic Catalog Search   │    • Max per-order spending cap  │    • Step trace  │
│    • Dynamic Bundling & Upsell │    • Price drift protection      │    • Risk score  │
│    • Intent & Cart Resolution  │    • Human-in-the-loop trigger   │    • SHA-256 log │
└────────────────────────────────┴─────────────────┬────────────────┴──────────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────┐
                    │     Razorpay Payment Gateway Rails       │
                    │  • Orders API (`order_...`)              │
                    │  • Standard Checkout (`checkout.js`)     │
                    │  • HMAC-SHA256 Signature Verification    │
                    │  • Graceful Failure & Webhook Simulator  │
                    └──────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
spark-agent-pay/
├── backend/
│   ├── main.py              # FastAPI REST & SSE endpoints
│   ├── agent_engine.py      # Autonomous AI Buyer reasoning loop
│   ├── guardrails.py        # Bounded financial policy engine
│   ├── razorpay_client.py   # Razorpay SDK, Orders & Signature verification
│   ├── audit_logger.py      # SHA-256 cryptographically chained audit log
│   ├── simulator.py         # Failure simulation & UPI recovery engine
│   ├── catalog_data.py      # Merchant catalog inventory database
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
│
├── src/
│   ├── components/agenticpay/
│   │   ├── Header.tsx       # Real-time metrics & connection badge
│   │   ├── AgentPanel.tsx   # AI Buyer simulator, prompt chips, cart
│   │   ├── MerchantPanel.tsx# Catalog viewer & guardrail policy controls
│   │   └── AuditPanel.tsx   # Live audit timeline & Razorpay checkout
│   ├── lib/agenticpay/
│   │   ├── useAgenticPay.ts # Main reactive hook & state machine
│   │   ├── api.ts           # Axios / fetch client with mock fallback
│   │   ├── mock.ts          # Standalone demo data
│   │   └── types.ts         # TypeScript data definitions
│   └── routes/              # TanStack router setup
├── package.json
└── README.md
```

---

## ⚡ Quick Start

### 1. Start the Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend runs at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 2. Start the Frontend (React + Vite)
```bash
# In the root directory
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🎥 5-Minute Pitch & Demo Script (For Submission Video)

1. **Minute 1: The Problem & Context (0:00 - 1:00)**
   - Introduce the shift toward AI buyers (NPCI UAP / ACP).
   - Highlight the main obstacle: unchecked AI agent transactions without bounds or safety.

2. **Minute 2: Autonomous Buyer & Catalog Discovery (1:00 - 2:00)**
   - Click preset *"Dev Setup under ₹5,000"*.
   - Show the agent parsing intent, querying the merchant catalog, and applying a 5% dynamic bundle discount.

3. **Minute 3: Bounded Guardrails in Action (2:00 - 3:00)**
   - Demonstrate the ₹5,000 per-order spending cap.
   - Click *"Over-Budget Test"* (4K Monitor bundle) ➔ Watch the guardrail block the transaction and escalate to **Human-in-the-Loop** merchant approval.

4. **Minute 4: Razorpay Checkout & Cryptographic Audit Trail (3:00 - 4:00)**
   - Approve the order ➔ Click **"Authorize & Pay via Razorpay"**.
   - Open the official Razorpay test popup, complete payment, and inspect the live HMAC-SHA256 signature verification in the audit trail.

5. **Minute 5: Graceful Failure & Recovery (4:00 - 5:00)**
   - Click **"Simulate Card Decline"** ➔ Show the agent catching the decline, preserving the cart, and generating an instant **fallback UPI payment link**.
   - Conclude on how Spark-Agent-Pay makes merchants safely transactable by AI.

---

## 🛡️ License
MIT License. Built for the **Razorpay AI Buildathon 2026**.

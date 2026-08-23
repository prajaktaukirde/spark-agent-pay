# Agent Specifications & Protocol Architecture

## Overview
Spark-Agent-Pay provides an autonomous AI Commerce Gateway operating over **NPCI's Unified Autonomous Payments (UAP)** and **Agentic Commerce Protocol (ACP)**.

## Core Agents

### 1. AI Buyer Agent
- **Protocol:** Model Context Protocol (MCP) & REST Tool Calling
- **Role:** Evaluates user shopping intent, filters catalog inventory based on category whitelists, and negotiates dynamic 5% bundle discounts.

### 2. Financial Bounding Engine (Guardrails)
- **Role:** Deterministically enforces spending limits (max per-order cap), checks ground-truth price drift (≤5%), and triggers Human-in-the-Loop escalation for out-of-bounds orders.

### 3. Payment Rails Gateway (Razorpay)
- **Role:** Generates Razorpay Test Mode Orders (`order_...`), verifies HMAC-SHA256 signatures, and provides fallback UPI intent links upon payment failure.

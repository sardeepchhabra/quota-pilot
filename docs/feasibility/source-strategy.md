# Source Acquisition Strategy

This document describes how QuotaPilot acquires and processes capacity data, combining **Automatic Local Discovery** (zero-configuration local extraction) and a **Manual Subscription Ledger** (local fallback).

---

## 1. The Core Strategy Flow

QuotaPilot operates locally to find active authentication signals from your local development tools. It falls back to a manual ledger if no automatic or live data source is found.

```
                  INSTALL QUOTAPILOT
                         │
               DISCOVER LOCAL TOOLS
                         │
         ┌───────────────┼───────────────┐
      Codex?          Claude?         GitHub?
         │               │               │
  Find existing    Find local CLI    Find OAuth/
   connection      session/state     saved token
         │               │               │
         └───────────────┼───────────────┘
                         │
                 Normalize Snapshots
                         │
                  Render Dashboard
                         │
                [No Live Data Source?]
                         │
           Fallback to Manual Subscription
```

---

## 2. Part A: Live Capacity (Zero-Configuration Discovery)

Instead of forcing users to manually copy and paste API keys, QuotaPilot probes known local tool paths to find active signals:

1. **Codex Local Probe**:
   * Queries `codex app-server` over local RPC.
   * Auto-detects if Codex is running, reads active quotas.
2. **Claude Code State**:
   * Probes `~/.claude-code/` or `~/.claude/config.json`.
   * Parses active rate-limit snapshots if present.
3. **GitHub Copilot Token**:
   * Probes VS Code's `state.vscdb` global storage or environment credentials.
   * Leverages saved access credentials securely.

### Discovery Correctness Rules
* **No Secret Printing**: Discovery scripts must check for *presence* and *validity* without ever outputting or printing raw tokens/keys to terminal console or application logs.
* **No Silent Estimation**: When a provider cannot provide live usage data, label it clearly as "usage unavailable" rather than making an unverified guess or reporting false zeros.

---

## 3. Part B: Manual Subscription Ledger

When live signals aren't available, QuotaPilot provides a local-first **Subscription Ledger** to track renewals and spend.

The user can define a local record containing:
* **Provider**: e.g., Claude, ChatGPT Web, Gemini Advanced
* **Plan Name**: e.g., Plus, Pro, Enterprise
* **Price**: e.g., $20.00
* **Currency**: e.g., USD, INR, EUR
* **Billing Cycle**: Monthly, Yearly
* **Renewal Date**: Next billing date
* **Status**: Active, Paused, Cancelled
* **Notes**: Custom context

This provides complete utility for tracking AI headroom even when live APIs are blocked or unavailable.

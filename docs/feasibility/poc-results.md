# POC Results Inventory

This document captures the findings and verification status of all Proof of Concepts (POCs) conducted for QuotaPilot. It acts as the technical source of truth for provider feasibility, and is preserved to guide development.

---

## 1. ChatGPT / Codex (POC #1)

* **Provider**: ChatGPT / OpenAI (Consumer Context)
* **Account Type Tested**: Personal Free / Plus (`go` plan type)
* **Authentication Method**: Local JSON-RPC via Codex `app-server`
* **Source**: `codex` application server executable running locally on user's machine
* **Data Obtained**:
  * `planType`: `go`
  * `limitId`: `codex`
  * `usedPercent`: `5%`
  * `windowDurationMins`: `43200`
  * `resetsAt`: ISO Timestamp representing the Codex window reset time
* **Data Missing**:
  * General ChatGPT Web/Plus message usage counts (non-Codex limits)
  * Subscription prices
  * Subscription renewal dates
* **Plan Dependency**: Requires Codex to be installed/running or the user to have a Codex integration.
* **Security Concerns**: Standard local port/pipe connection to `codex`. No raw credentials/tokens exposed or printed in plain text.
* **Reliability**: Extremely high for users who run Codex, as it is a direct JSON-RPC interface to the underlying app-server.
* **Production Suitability**: Highly suitable for developer-focused Codex telemetry.
* **Next Action**: Implement a `CodexDetector` and `CodexConnector` to auto-discover local instances of `codex` and parse usage. *CRITICAL RULE*: Label the metric strictly as **"Codex quota"**, not general ChatGPT quota.

---

## 2. GitHub Copilot (POC #2)

* **Provider**: GitHub Copilot
* **Account Type Tested**: Personal Account
* **Authentication Method**: Browser-based/Device Code OAuth Flow
* **Source**: GitHub REST/Billing APIs (`api.github.com`)
* **Data Obtained**:
  * OAuth Access Token (via Device Flow)
  * Current authenticated user info
  * Empty usage list (`usageItems: []`) / Organizations mapping (`organizations: []`)
* **Data Missing**:
  * Actual usage metrics for the personal account tested (personal accounts do not produce records on the queried endpoint)
* **Plan Dependency**: Free personal accounts don't yield billing endpoint data. However, other accounts (organization or paid individual) may yield actual billing record items.
* **Security Concerns**: Access tokens are retrieved via standard OAuth. They must never be written to plaintext configuration files or application logs.
* **Reliability**: API contract is stable, but usage metrics coverage is highly dependent on account type.
* **Production Suitability**: Partial. Suitable for accounts with verifiable usage data. A fallback/warning mechanism is required for accounts returning empty payloads.
* **Next Action**: Implement `GitHubPublicBillingConnector` which reports "usage unavailable" gracefully when the provider returns empty lists. We will also explore an Experimental Copilot Connector to probe richer Copilot-specific endpoints safely.

---

## 3. Claude Code (POC #3)

* **Provider**: Anthropic (Claude Code)
* **Account Type Tested**: Claude subscription/qualifying account (not active on the test machine)
* **Authentication Method**: Status line status/credentials extraction from local Claude environment config
* **Source**: Claude CLI local configuration, logs, or statusline outputs
* **Data Obtained**:
  * Target statusline JSON format with 5-hour and 7-day rate limits (`used_percentage`, `resets_at`)
* **Data Missing**:
  * Real active session data on the test machine (as the test account did not qualify for a Claude Code subscription)
* **Plan Dependency**: Requires active Claude Code CLI installation and qualifying Anthropic subscription.
* **Security Concerns**: Path is entirely local. Must strictly ensure that extracted session tokens or auth tokens are never logged or exposed.
* **Reliability**: Highly reliable as Claude Code CLI writes explicit local JSON/state files containing usage metrics.
* **Production Suitability**: Excellent for active Claude CLI users.
* **Next Action**: Build `ClaudeDetector` and `ClaudeLocalConnector` utilizing mocked fixture JSON based on documented payloads. This avoids purchasing an expensive subscription for validation.

---

## 4. Local Session Discovery (POC #4)

* **Provider**: Local Session Discovery (Meta-Provider)
* **Account Type Tested**: Current logged-in Windows OS environment
* **Authentication Method**: Local filesystem detection
* **Source**: Common configuration and database paths (`~/.config/`, `%APPDATA%`, `%LOCALAPPDATA%`)
* **Data Obtained**:
  * VS Code global state database file presence (`state.vscdb`)
  * Chrome & Edge User Data/Cookies directory presence and access times
* **Data Missing**:
  * Real-time active browser sessions token parsing (requires OS-level decrypters or specific sqlite readers)
* **Plan Dependency**: Zero configuration. Depends entirely on local application presence.
* **Security Concerns**: Reading configuration databases must be strictly read-only and local. Raw tokens are never printed or logged.
* **Reliability**: Very high for detecting presence and metadata (e.g. modification dates).
* **Production Suitability**: Excellent for zero-configuration auto-detection of existing AI tools.
* **Next Action**: Create a standalone `QuotaPilot Discovery POC` tool that maps presence (`installed`, `authenticated`, `source`, `capabilities`) for local session providers safely without reading or exposing raw credentials.

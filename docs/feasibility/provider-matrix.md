# Provider Capability & Feasibility Matrix

This matrix evaluates and documents each target AI provider's capabilities, authentication options, sources, reliability, and feasibility based on direct verification.

| Provider | Category | Preferred Source | Auth Method | Quota Live Data | Reset Window | Confidence Level | Validation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Codex** | Consumer / Local App | Codex app-server | Local IPC/JSON-RPC | Yes (Codex % Used) | Yes (`resetsAt`) | `PROVIDER_REPORTED` | **Verified** ✅ |
| **GitHub Copilot** | Developer / API | GitHub Public Billing API | Browser/Device OAuth | Dependent on account type | N/A | `PROVIDER_REPORTED` / `UNAVAILABLE` | **Partially Verified** (Usage list empty for test account) |
| **Claude Code** | Developer / CLI | Statusline / CLI Local Config | Local Session State | Yes (5h & 7d windows) | Yes (`resets_at`) | `PROVIDER_REPORTED` | **Verified via Fixtures** (Needs qualifying subscription) |
| **ChatGPT (Web)** | Consumer Web | Browser cookies / session | Local cookie storage | No (Not exposed via API) | No | `UNAVAILABLE` | **Infeasible for MVP** ❌ |
| **OpenAI API** | Developer / API | API key / Official endpoint | API Key | Yes (Remaining credits) | Yes | `PROVIDER_REPORTED` | **Planned** (Post-MVP consumer focus) |
| **Gemini API** | Developer / API | API key / Official endpoint | API Key | Yes (Request limits) | Yes | `PROVIDER_REPORTED` | **Planned** (Post-MVP consumer focus) |

## Key Findings & Guidelines

1. **Codex**
   * *Correctness Rule*: Metrics must be explicitly categorized and labeled as **"Codex quota"** (not general ChatGPT Web quota) to prevent misleading users about their ChatGPT Plus message counts.

2. **GitHub Copilot**
   * *Correctness Rule*: Accounts showing empty billing lists must gracefully report "usage unavailable" rather than zeroing out or displaying mock data. An experimental connector should be placed behind a distinct flag.

3. **Claude Code**
   * *Correctness Rule*: Because qualifying paid subscriptions are required, use static fixture testing to assure connector validity without manual live billing.

4. **ChatGPT Web**
   * *Correctness Rule*: Excluded from the MVP due to extreme session fragility, anti-scraping blocks, and lack of a structured, reliable local data stream. Focus is strictly on Codex, Claude Code, and Copilot.

# Local Data Storage Architecture

QuotaPilot is a privacy-first, local-first application. It maintains configuration, metadata, and state locally on the user's machine without any remote database or centralized cloud backend.

---

## 1. Storage Structure

Instead of utilizing an unneeded heavyweight SQLite database for the MVP, QuotaPilot stores non-sensitive configuration and metadata in versioned, human-readable JSON files in the user's application directory (e.g., `~/.quota-pilot/` or standard OS AppData paths).

```
~/.quota-pilot/
├── config.json              # App-level configuration (theme, refresh interval, etc.)
├── providers.json           # Known provider definitions (capabilities, icons, metadata)
├── accounts.json            # Connections metadata (no secret keys; links to OS Keychain)
├── subscriptions.json       # Manual subscription ledger items
└── snapshots/               # Historical and current usage snapshots
    ├── 2026-08-20.json
    └── ...
```

---

## 2. Core Domain Concept Separation

To support robust data parsing, the application separates metadata and snapshot instances clearly:

1. **Provider Definition**: Core system info for a provider (e.g., ID: `codex`, Name: `Codex`).
2. **Connection (Account)**: A specific user's authenticated instance of a provider (e.g., `github-account-1`).
3. **Usage Snapshot**: A dated collection of used, remaining, and resets-at values, with fields for `source` and `confidence` (e.g. `PROVIDER_REPORTED`).
4. **Subscription**: Billing info such as plan name, price, currency, renewal frequency, and active status.

---

## 3. Runtime Snapshot Persistence

For live providers, QuotaPilot keeps the most recently fetched usage snapshot available immediately after app startup or refresh so the dashboard remains usable even when a provider is briefly unavailable. These values are stored locally in a small JSON blob under the browser/local app storage, with the same privacy rule as other state: no raw API keys, bearer tokens, or cookie values are persisted.

```text
quotapilot.snapshot-state
└── { providerSnapshots, codexSnapshot, updatedAt }
```

This enables rapid rehydration of the summary state while still preserving the source-of-truth pattern where normal configuration remains separate from secure credential storage.

---

## 4. Credential Security & OS Storage Split

Under no circumstances should API keys, session cookies, or raw bearer tokens be placed in plaintext configuration JSON files.

### The Decoupled Model

```
   accounts.json
  ┌─────────────────────────────────────────────────────────┐
  │ "accountId": "github-1",                                │
  │ "providerId": "github",                                 │
  │ "credentialRef": "quotapilot-github-token-github-1"     │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼
                    OS Credential Store
         ┌───────────────────────────────────────┐
         │ Windows: Windows Credential Manager   │
         │ macOS: macOS Keychain                 │
         │ Linux: Secret Service API             │
         └───────────────────┬───────────────────┘
                             │
                             ▼
                    Actual Secure Token
         ┌───────────────────────────────────────┐
         │ gho_********************************* │
         └───────────────────────────────────────┘
```

---

## 5. Local Data Integrity & Correctness Rules

To guarantee robustness and avoid data corruption, QuotaPilot enforces three strict design principles:

### A. Versioned Schemas
All files store a top-level schema version parameter to support safe future migrations.
```json
{
  "schemaVersion": 1,
  "data": { ... }
}
```

### B. Atomic Writes
To prevent corrupted configuration files if the computer runs out of power or the application crashes mid-write:
1. Write to a temporary file: `config.tmp`
2. Force disk sync: `fsync`
3. Atomically rename/replace the file: `rename config.tmp -> config.json`

### C. Logging Hygiene
* **No Secrets in Logs**: Bearer tokens, passwords, cookies, and secret keys must be automatically scrubbed or masked in logs.
* **No Raw API Payload Dumps**: Raw API responses often contain sensitive user emails, account identifiers, or hidden session values. Responses must be parsed into a clean domain shape before logging, or fully scrubbed.

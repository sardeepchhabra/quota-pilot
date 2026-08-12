# QuotaPilot

> **Know your AI headroom.**

QuotaPilot is a privacy-first, local-first desktop application that
brings usage, quota, allowance, credit, and reset information from
multiple AI services into a single interface.

The goal is simple:

> **Give a developer one place to understand how much AI capacity they
> have available right now, when it will reset, and which provider is
> the best option to use.**

The application is intended to work with consumer AI subscriptions and
developer tools where possible, even when the user does **not** have a
paid API subscription.

------------------------------------------------------------------------

## 1. Why QuotaPilot Exists

Modern developers increasingly use multiple AI products at the same
time.

A typical developer may have:

-   ChatGPT / OpenAI access
-   Google Gemini / Google AI Pro
-   Claude / Claude Code
-   One or more GitHub Copilot accounts
-   Cursor or another AI coding tool
-   Other AI services in the future

Each service has its own:

-   Usage limits
-   Credit systems
-   Rate limits
-   Rolling windows
-   Daily/weekly/monthly limits
-   Model-specific limits
-   Feature-specific limits
-   Reset times
-   Account types
-   Authentication methods

The information is usually scattered across different applications,
websites, dashboards, and command-line tools.

This creates a practical problem:

> **Before starting an AI-heavy task, a developer often does not know
> which AI resource they have the most available capacity on.**

QuotaPilot aims to solve that problem.

------------------------------------------------------------------------

# 2. The Core Problem

QuotaPilot is **not primarily a token counter**.

It is a **quota and resource availability aggregator**.

The primary question the application should answer is:

> **"How much usable AI capacity do I have right now?"**

For example:

``` text
AI AVAILABILITY

ChatGPT Go
73% remaining
Resets in 2h 18m

Gemini Pro
61% remaining
Resets in 1h 07m

Claude Code
42% remaining
Resets in 3h 31m

GitHub Copilot — Personal
78% remaining

GitHub Copilot — Work
91% remaining
```

Where exact information is unavailable, the application must explicitly
communicate that.

For example:

``` text
Claude Code

Usage unavailable

Reason:
The provider does not expose this information
through a supported interface.
```

Accuracy is more important than displaying a number.

------------------------------------------------------------------------

# 3. Product Vision

The long-term vision is:

> **QuotaPilot becomes a local AI resource control panel that
> understands the user's available AI capacity across providers and
> helps them decide what to use next.**

The first version focuses on **visibility**.

Later versions may provide **recommendations**.

For example:

``` text
Recommended: Gemini

Reason:
- 82% quota remaining
- Claude is at 18%
- ChatGPT is at 24%
- Gemini resets in 3h 12m
```

This recommendation functionality is intentionally outside the first
MVP.

Reliable provider data must exist before recommendations are introduced.

------------------------------------------------------------------------

# 4. Initial Providers

The initial providers to investigate are:

1.  OpenAI / ChatGPT
2.  Google Gemini / Google AI Pro
3.  Anthropic / Claude
4.  Claude Code
5.  GitHub Copilot

Multiple accounts for the same provider must be supported.

Example:

``` text
GitHub
├── Personal
└── Work

Claude
├── Personal
└── Work
```

The architecture must never assume:

``` text
one provider = one account
```

------------------------------------------------------------------------

# 5. Important Distinction: Consumer Plans vs APIs

One of the most important architectural requirements is to distinguish
between:

-   Consumer AI subscriptions
-   Developer/API accounts
-   Organization accounts
-   Enterprise accounts
-   CLI authentication
-   Web application authentication

Having a consumer subscription does **not** automatically mean that the
provider's developer API exposes the same quota.

For example:

``` text
ChatGPT subscription
        ≠
OpenAI API account
```

Therefore, QuotaPilot must investigate each provider independently.

The application must never assume:

> "Provider has an API, therefore we can retrieve the user's consumer
> subscription quota through that API."

------------------------------------------------------------------------

# 6. What Counts as Usage?

QuotaPilot must **not** assume that usage is measured in tokens.

Different providers may expose:

-   Tokens
-   Requests
-   Messages
-   Credits
-   AI credits
-   Compute
-   Percentage utilization
-   Rolling-window utilization
-   Daily limits
-   Weekly limits
-   Monthly limits
-   Session limits
-   Model-specific limits
-   Feature-specific limits

The internal data model must therefore represent a generic quota window
rather than a generic "token balance".

Example:

``` text
Quota Window
├── Name
├── Used
├── Remaining
├── Percentage Used
├── Percentage Remaining
├── Unit
├── Start Time
├── Reset Time
├── Source
├── Confidence
└── Freshness
```

------------------------------------------------------------------------

# 7. Accuracy and Confidence

Every usage measurement must identify where it came from and how
reliable it is.

Recommended confidence levels:

``` text
EXACT
PROVIDER_REPORTED
LOCALLY_DERIVED
ESTIMATED
UNAVAILABLE
```

Examples:

### Provider API

``` text
Source:
Official Provider API

Confidence:
PROVIDER_REPORTED
```

### Provider web application

``` text
Source:
Provider Web UI

Confidence:
PROVIDER_REPORTED
```

### Local CLI

``` text
Source:
Local CLI / Local Usage Data

Confidence:
LOCALLY_DERIVED
```

### Local estimation

``` text
Source:
Local Calculation

Confidence:
ESTIMATED
```

### No available source

``` text
Source:
None

Confidence:
UNAVAILABLE
```

The UI must never make an estimate look like an exact provider-reported
number.

------------------------------------------------------------------------

# 8. Provider Integration Philosophy

QuotaPilot uses a **provider adapter architecture**.

Each provider is isolated behind a common interface.

Conceptually:

``` text
                    QuotaPilot Core
                           │
                    Provider Adapter
                           │
       ┌───────────┬───────┼────────┬───────────┐
       │           │       │        │           │
    OpenAI      Gemini   Claude   GitHub      Future
       │           │       │        │           │
     API/Web     API/Web CLI/Web   API/CLI      ...
```

The core application should not contain provider-specific logic.

Provider-specific behavior belongs inside provider adapters.

This allows new providers to be added without redesigning the entire
application.

------------------------------------------------------------------------

# 9. Provider Data Acquisition

QuotaPilot should support multiple data acquisition mechanisms.

Preferred order:

1.  Official API
2.  Official OAuth
3.  Official CLI
4.  Supported local integration
5.  Secure local authentication
6.  Browser-assisted integration where appropriate
7.  Estimation from locally available information
8.  Unsupported

The application must not introduce a fragile scraping mechanism simply
to increase the number of supported providers.

If a provider does not expose reliable information through an acceptable
mechanism, it should be marked as unsupported.

------------------------------------------------------------------------

# 10. Example Provider Capability Matrix

Every provider should eventually be documented using a matrix similar
to:

  --------------------------------------------------------------------------
  Capability     OpenAI         Gemini         Claude         GitHub
  -------------- -------------- -------------- -------------- --------------
  Official API   To research    To research    To research    To research

  Consumer quota To research    To research    To research    To research
  API                                                         

  Remaining      To research    To research    To research    To research
  quota                                                       

  Reset time     To research    To research    To research    To research

  CLI            To research    To research    To research    To research
  information                                                 

  Local          To research    To research    To research    To research
  information                                                 

  Web            To research    To research    To research    To research
  information                                                 

  Multiple       Required       Required       Required       Required
  accounts                                                    
  --------------------------------------------------------------------------

This matrix is a research artifact and must be updated as provider
capabilities are verified.

------------------------------------------------------------------------

# 11. Privacy Model

QuotaPilot is designed to be **local-first** and **privacy-first**.

The application should not require:

-   A QuotaPilot account
-   A QuotaPilot cloud backend
-   A hosted database
-   Centralized user data
-   User prompts
-   User conversations
-   Cloud telemetry
-   Advertising

The application should communicate directly with supported providers
from the user's machine whenever technically possible.

Conceptually:

``` text
Provider
   ↓
QuotaPilot on user's machine
   ↓
Local normalized state
   ↓
Desktop UI
```

Not:

``` text
Provider
   ↓
QuotaPilot Cloud
   ↓
Database
   ↓
QuotaPilot Desktop
```

------------------------------------------------------------------------

# 12. Credential Security

Provider credentials must never be stored in source code.

Credentials should use the operating system's secure credential storage
where possible.

Target mechanisms:

-   macOS Keychain
-   Windows Credential Manager
-   Linux Secret Service

The application must never:

-   Log credentials
-   Log cookies
-   Log authorization headers
-   Commit secrets
-   Store credentials in plaintext configuration files
-   Upload credentials to a QuotaPilot server

Secret scanning should be part of CI.

------------------------------------------------------------------------

# 13. No Mandatory Database

QuotaPilot should not require a database for its core functionality.

The initial application can maintain local state using:

-   Configuration files
-   Secure OS credential storage
-   Local JSON or equivalent snapshots when historical data is required

For example:

``` text
~/.quota-pilot/
├── config.json
├── providers.json
└── snapshots/
    ├── 2026-08-12.json
    └── 2026-08-13.json
```

The exact storage implementation should be decided through an
architecture decision record.

------------------------------------------------------------------------

# 14. Target Platform

The initial target is a standalone desktop application.

Preferred technology:

-   Tauri
-   Rust
-   React
-   TypeScript
-   Vite

Initial operating systems:

1.  macOS
2.  Windows

Linux should remain architecturally possible but is not a first-release
requirement.

The application should eventually support:

-   Desktop dashboard
-   macOS menu bar
-   Windows system tray
-   Background refresh
-   Manual refresh
-   Automatic refresh
-   Notifications

A browser extension or web application may be considered later if it
provides a clear technical advantage.

It should not become the primary architecture unless research
demonstrates that it is more appropriate than a desktop application.

------------------------------------------------------------------------

# 15. Proposed Architecture

At a high level:

``` text
┌─────────────────────────────────────────────┐
│                  QuotaPilot                 │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │             React UI                  │  │
│  │                                       │  │
│  │ Dashboard / Accounts / Settings      │  │
│  └───────────────────┬───────────────────┘  │
│                      │                      │
│  ┌───────────────────▼───────────────────┐  │
│  │          Application Core             │  │
│  │                                       │  │
│  │ Provider Registry                     │  │
│  │ Account Manager                       │  │
│  │ Refresh Scheduler                     │  │
│  │ Usage Normalizer                      │  │
│  │ Notification Manager                  │  │
│  └───────────────────┬───────────────────┘  │
│                      │                      │
│  ┌───────────────────▼───────────────────┐  │
│  │          Provider Adapters            │  │
│  │                                       │  │
│  │ OpenAI / Gemini / Claude / GitHub    │  │
│  └───────────────────┬───────────────────┘  │
│                      │                      │
│  ┌───────────────────▼───────────────────┐  │
│  │      Secure Local Storage             │  │
│  │                                       │  │
│  │ OS Credential Store + Local State     │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

The exact boundaries between the Rust and TypeScript layers must be
determined during architecture design.

------------------------------------------------------------------------

# 16. Core Domain Concepts

The core domain should contain concepts such as:

``` text
Provider
ProviderAccount
Credential
ProviderCapabilities
UsageSnapshot
QuotaWindow
UsageMetric
ResetEvent
DataSource
DataConfidence
ProviderHealth
```

A provider may have multiple accounts.

An account may expose multiple quota windows.

A quota window may contain multiple metrics.

For example:

``` text
Gemini
└── Personal Account
    ├── 5-hour window
    │   ├── Remaining
    │   └── Reset time
    │
    └── Weekly window
        ├── Remaining
        └── Reset time
```

The domain model must support this without provider-specific hardcoding.

------------------------------------------------------------------------

# 17. Dashboard Philosophy

The dashboard should answer one question immediately:

> **How much AI capacity do I have right now?**

Primary information:

1.  Remaining quota
2.  Percentage remaining
3.  Reset time
4.  Provider
5.  Account
6.  Status
7.  Data freshness
8.  Confidence

Example:

``` text
AI QUOTA

┌─────────────────────────────────────┐
│ ChatGPT Go                          │
│ 73% remaining                       │
│ Resets in 2h 18m                    │
│ ● Provider reported                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Gemini Pro                          │
│ 61% remaining                       │
│ 5-hour window                       │
│ Resets in 1h 07m                    │
│ ● Provider reported                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Claude Code                         │
│ 42% remaining                       │
│ Resets in 3h 31m                    │
│ ● Provider reported                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ GitHub Copilot — Personal           │
│ 78% remaining                       │
│ ● Provider reported                 │
└─────────────────────────────────────┘
```

The interface should remain simple.

------------------------------------------------------------------------

# 18. Provider Status

Providers should have explicit states such as:

``` text
CONNECTED
DISCONNECTED
AUTHENTICATION_REQUIRED
RATE_LIMITED
PROVIDER_UNAVAILABLE
UNSUPPORTED
PARTIAL_DATA
STALE
ERROR
```

The application must not silently display stale information as current.

------------------------------------------------------------------------

# 19. Data Freshness

Every usage snapshot should include at least:

``` text
retrievedAt
source
confidence
```

The UI should communicate stale data.

Example:

``` text
Updated 3 minutes ago
```

or:

``` text
⚠ Data may be stale
```

The refresh system should be provider-aware.

Different providers may have different appropriate refresh intervals.

------------------------------------------------------------------------

# 20. Multiple Accounts

Multiple accounts for the same provider are a first-class requirement.

Example:

``` text
GitHub
├── Account A
└── Account B
```

The UI should make it obvious which account a quota belongs to.

The application should allow users to:

-   Add an account
-   Remove an account
-   Rename an account locally
-   Refresh an account
-   Disconnect an account
-   View authentication status

------------------------------------------------------------------------

# 21. Testing Philosophy

QuotaPilot will use **Test Driven Development (TDD)**.

The preferred development loop is:

``` text
Write test
    ↓
Test fails
    ↓
Implement minimum behavior
    ↓
Test passes
    ↓
Refactor
    ↓
Document
```

Testing must not be postponed until the end of development.

------------------------------------------------------------------------

# 22. Testing Layers

## Unit Tests

Test:

-   Domain models
-   Quota calculations
-   Reset calculations
-   Percentage calculations
-   Normalization
-   Confidence handling
-   Provider capability logic
-   Error handling

## Provider Contract Tests

Every provider adapter should satisfy a common contract.

## Integration Tests

Test:

-   Authentication
-   Provider communication
-   Secure credential access
-   Data normalization
-   Refresh
-   Rate limiting
-   Provider failures

## UI Tests

Test:

-   Dashboard rendering
-   Loading states
-   Empty states
-   Error states
-   Disconnected providers
-   Multiple accounts
-   Stale data
-   Estimated data
-   Refresh behavior

## End-to-End Tests

Test flows such as:

``` text
Install
→ Connect provider
→ Authenticate
→ Retrieve usage
→ Normalize usage
→ Display usage
→ Refresh
→ Handle provider failure
→ Disconnect
```

------------------------------------------------------------------------

# 23. Mock Provider

Before implementing a real provider, create a mock provider.

The mock provider should simulate:

-   Exact quota
-   Percentage quota
-   Multiple quota windows
-   Unknown quota
-   Expired credentials
-   Provider unavailable
-   Rate limiting
-   Stale data
-   Estimated data
-   Reset times

This allows the application core and UI to be developed and tested
independently from real provider availability.

------------------------------------------------------------------------

# 24. Development Phases

## Phase 0 --- Discovery and Research

Goal:

Understand what is technically possible.

Deliverables:

-   Provider capability matrix
-   Existing competitor analysis
-   Technology selection
-   Architecture proposal
-   Security model
-   Risk assessment
-   Data model proposal
-   Provider adapter proposal

No production UI is required.

------------------------------------------------------------------------

## Phase 1 --- Core Architecture

Deliver:

-   Tauri application
-   React application
-   Rust core
-   Domain models
-   Provider adapter interface
-   Provider registry
-   Mock provider
-   Testing framework
-   CI
-   Documentation structure

------------------------------------------------------------------------

## Phase 2 --- First Real Provider

Choose the provider with the best combination of:

-   Reliable usage data
-   Official support
-   Authentication simplicity
-   Testability
-   Low implementation risk

Implement the provider fully.

------------------------------------------------------------------------

## Phase 3 --- Multi-Provider MVP

Add at least three real providers.

Support:

-   Multiple accounts
-   Normalized quota
-   Reset times
-   Provider status
-   Data confidence
-   Data freshness

------------------------------------------------------------------------

## Phase 4 --- Real-World Testing

Test the application against available real accounts, including where
applicable:

-   ChatGPT Go
-   Gemini Pro
-   Claude Code
-   GitHub Copilot account 1
-   GitHub Copilot account 2

Do not assume that subscription access means API access.

Document the exact result for each account/provider combination.

------------------------------------------------------------------------

## Phase 5 --- Generalization

Improve:

-   Provider registry
-   Account management
-   Secure credential storage
-   Diagnostics
-   Error handling
-   Notifications
-   Auto-refresh
-   Import/export of non-secret configuration
-   Settings
-   Update architecture

------------------------------------------------------------------------

## Phase 6 --- Public Release

Prepare:

-   macOS package
-   Windows package
-   Installation instructions
-   README
-   Screenshots
-   Security documentation
-   Privacy documentation
-   Provider support matrix
-   Known limitations
-   Contribution guide
-   License
-   Release notes

------------------------------------------------------------------------

# 25. Documentation Requirements

Documentation is a first-class part of the project.

Create:

``` text
docs/
├── README.md
│
├── architecture/
│   ├── overview.md
│   ├── technology-selection.md
│   ├── domain-model.md
│   ├── provider-adapter-architecture.md
│   └── security.md
│
├── providers/
│   ├── provider-capability-matrix.md
│   ├── openai.md
│   ├── gemini.md
│   ├── anthropic.md
│   └── github.md
│
├── decisions/
│   ├── ADR-001-platform.md
│   ├── ADR-002-local-first.md
│   ├── ADR-003-provider-adapters.md
│   └── ...
│
├── workflows/
│   ├── authentication.md
│   ├── usage-refresh.md
│   └── release.md
│
├── testing/
│   ├── strategy.md
│   └── provider-testing.md
│
└── development/
    ├── setup.md
    ├── contributing.md
    └── release-process.md
```

Documentation must be understandable by:

-   Human developers
-   Future maintainers
-   AI coding agents
-   Contributors
-   Users investigating security and privacy

------------------------------------------------------------------------

# 26. Architecture Decision Records

Important technical decisions must be documented using ADRs.

Examples:

``` text
ADR-001: Why Tauri instead of Electron

ADR-002: Why QuotaPilot is local-first

ADR-003: Why provider adapters are isolated

ADR-004: Why QuotaPilot does not require a database

ADR-005: Why OS credential stores are used

ADR-006: Consumer subscriptions vs developer APIs

ADR-007: Provider usage acquisition strategy

ADR-008: Why a provider is unsupported
```

Each ADR should contain:

-   Context
-   Problem
-   Decision
-   Alternatives considered
-   Reasoning
-   Consequences
-   Status
-   Date

------------------------------------------------------------------------

# 27. Git Workflow

Major work must happen on branches.

Example:

``` text
main
│
├── research/provider-capabilities
├── architecture/core-domain
├── feature/provider-framework
├── feature/github-provider
├── feature/claude-provider
├── feature/gemini-provider
├── feature/openai-provider
└── feature/dashboard
```

Preferred workflow:

``` text
Create branch
    ↓
Write/update tests
    ↓
Implement
    ↓
Run tests
    ↓
Update documentation
    ↓
Update ADR if necessary
    ↓
Commit
    ↓
Review
    ↓
Merge into main
```

Do not perform major feature development directly on `main`.

Never claim that a change has been committed, pushed, reviewed, or
merged unless the relevant Git operation was actually performed.

------------------------------------------------------------------------

# 28. First Repository Milestone

The first milestone should intentionally avoid premature implementation.

The repository should first establish:

``` text
README.md
docs/
├── application-overview.md
├── architecture/
├── providers/
├── decisions/
├── workflows/
├── testing/
└── development/
```

The first research branch should be:

``` text
research/provider-capabilities
```

The first major research should answer:

1.  What can each provider expose?
2.  What can be retrieved without paid API access?
3.  Which provider integrations are officially supported?
4.  Which integrations require local CLI access?
5.  Which integrations require web access?
6.  Which integrations are impossible or unreliable?
7.  What should the first MVP contain?

------------------------------------------------------------------------

# 29. Future Features

These are intentionally outside the initial MVP.

Potential future features include:

### AI Recommendation

Recommend which provider to use based on available quota.

### Smart Notifications

Notify when:

-   Quota is nearly exhausted
-   Quota resets
-   Authentication expires
-   Provider becomes unavailable

### Usage History

Show:

``` text
Today
This week
This month
```

and usage trends.

### Cost Tracking

Where provider pricing information is available, optionally track cost.

### Model-Level Usage

Where supported:

``` text
GPT
Claude
Gemini
Copilot models
```

### Menu Bar / System Tray

Provide an at-a-glance view without opening the full application.

### Provider Health

Detect:

-   API outage
-   Authentication failure
-   Rate limiting
-   Unsupported account state

### Recommendation Engine

Eventually answer:

> "Which AI should I use right now?"

This should only be implemented once provider data is sufficiently
reliable.

------------------------------------------------------------------------

# 30. What QuotaPilot Is Not

QuotaPilot is not intended to be:

-   An AI chat application
-   An AI model aggregator
-   A prompt manager
-   A cloud AI gateway
-   An API proxy
-   A token marketplace
-   A provider billing platform
-   A centralized credential manager
-   A cloud analytics platform

Its primary purpose is:

> **Understanding and managing the AI capacity the user already has
> access to.**

------------------------------------------------------------------------

# 31. Product Principles

QuotaPilot should follow these principles throughout development.

### 1. Privacy First

User credentials and usage data belong to the user.

### 2. Local First

The application should work without a QuotaPilot backend.

### 3. Accuracy Over Provider Count

It is better to show "unavailable" than a misleading estimate.

### 4. Provider Agnostic

No provider should dictate the core architecture.

### 5. Test Driven

Core functionality must be covered by automated tests.

### 6. Documentation Driven

Important decisions must be recorded.

### 7. Explicit Uncertainty

Estimated information must be clearly identified.

### 8. Minimal UI

The user should understand their AI availability within seconds.

### 9. Extensible

Adding a provider should not require rewriting the application.

### 10. Secure by Default

Credentials and sensitive information must be protected.

------------------------------------------------------------------------

# 32. Definition of a Successful MVP

The MVP is successful when a user can:

1.  Install QuotaPilot.
2.  Open the application.
3.  Connect multiple supported AI accounts.
4.  See each account separately.
5.  See available usage/quota information.
6.  See reset windows.
7.  See when information was last retrieved.
8.  Understand whether information is provider-reported or estimated.
9.  Refresh provider information.
10. Handle disconnected or unsupported providers gracefully.
11. Run the application without a QuotaPilot cloud account.
12. Keep credentials on their own machine.

The MVP does **not** need to support every AI provider.

Reliability of supported providers is more important than the number of
integrations.

------------------------------------------------------------------------

# 33. Long-Term Vision

The long-term goal of QuotaPilot is to become:

> **The local AI resource control panel for developers.**

Instead of opening five different dashboards and remembering five
different quota systems, a developer should be able to open QuotaPilot
and immediately understand:

``` text
What do I have?
How much is left?
When does it reset?
Which account has capacity?
Which provider should I use?
Is the information reliable?
```

That is the core purpose of the project.

------------------------------------------------------------------------

# 34. Project Name

**QuotaPilot**

Repository:

**sardeepchhabra/quota-pilot**

Tagline:

> **Know your AI headroom.**

Core concept:

> **One local control panel for all of your AI quotas.**

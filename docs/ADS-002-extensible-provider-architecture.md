# ADR-002: Extensible Provider Architecture

## Status

Accepted

## Decision

QuotaPilot will use an extensible provider adapter architecture.

The application core must not depend on a fixed list of AI providers.

Built-in providers will provide first-class integrations for major platforms such as:

- ChatGPT
- OpenAI API
- Gemini
- Gemini API
- Claude
- Claude Code
- GitHub Copilot

The architecture must also support future user-defined providers and open-source/local model providers.

## Provider categories

### Consumer providers

Examples:

- ChatGPT
- Gemini
- Claude

These represent consumer subscriptions and their provider-specific usage limits.

### Developer/API providers

Examples:

- OpenAI API
- Gemini API
- GitHub Copilot
- Claude API

These represent API usage, credits, billing, requests, tokens, or provider-specific quotas.

### Local/open-source providers

Future examples:

- Ollama
- LM Studio
- vLLM
- LocalAI

These may have no provider-imposed quota. QuotaPilot may instead track locally measurable usage such as requests, tokens, model usage, or estimated cost.

## Authentication

Provider authentication must be abstracted from provider usage logic.

Supported authentication strategies may include:

- API key
- OAuth
- Device authorization
- Browser-based authentication
- Local/no authentication
- Custom provider authentication

Credentials must never be stored in React state, localStorage, source code, or plain configuration files.

The desktop application will eventually use an OS-appropriate secure credential mechanism.

## Multiple accounts

A provider may have multiple connections.

Examples:

- Two GitHub accounts
- Multiple OpenAI API accounts
- Multiple Gemini accounts

A provider connection is therefore separate from the provider definition.

## Capability model

Providers must explicitly declare which information they can provide.

Possible capabilities include:

- account
- plan
- subscription
- usage
- quota
- credits
- reset time
- billing

Unsupported information must be represented as unavailable rather than inferred or reported as zero.

## Future custom providers

QuotaPilot should eventually allow users to define providers themselves.

Potential configuration may include:

- Provider name
- API base URL
- Authentication method
- Usage endpoint
- Quota endpoint
- Billing endpoint
- Response mapping
- Custom metrics

This functionality is intentionally deferred from the MVP.

## Rationale

AI providers expose fundamentally different concepts of usage.

Some expose message windows.
Some expose AI credits.
Some expose tokens.
Some expose monetary spend.
Some expose only UI-level limits.
Some expose no quota at all.

A normalized provider abstraction allows QuotaPilot to represent all of these without coupling the application to any particular provider.

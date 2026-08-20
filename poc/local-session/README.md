# Local Session Providers POC

This Proof of Concept (POC) focuses on discovering and testing local session providers available on the user's machine. 

To achieve a "privacy-first, local-first" approach, QuotaPilot can inspect local configuration files, CLI states, and application databases to discover active authentication tokens and sessions for AI providers without requiring the user to re-authenticate manually.

## Supported Providers & Target Paths

The POC attempts to detect the presence of session/credentials for the following providers:

1. **GitHub Copilot CLI / extension**
   - File: `~/.config/github-copilot/hosts.json`
   - File: `%APPDATA%/github-copilot/hosts.json`
   - File: `%APPDATA%/Code/User/globalStorage/state.vscdb` (VS Code state)

2. **Claude Code / Anthropic CLI**
   - File: `~/.claude/config.json`
   - File: `~/.claude-code/` (Claude Code workspace / configuration)
   - File: `%USERPROFILE%/.anthropic/config.json`

3. **ChatGPT Desktop / Browser Sessions**
   - Directory: `%LOCALAPPDATA%/Google/Chrome/User Data/` (Chrome Profile Cookies/Storage)
   - Directory: `%LOCALAPPDATA%/Microsoft/Edge/User Data/` (Edge Profile Cookies/Storage)

## How to Run

Execute the script from the project root using:

```bash
node poc/local-session/index.cjs
```

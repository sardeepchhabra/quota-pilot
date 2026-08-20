const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const home = os.homedir();

function commandExists(command) {
  const result = spawnSync(command, ["--version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
    timeout: 5000,
  });

  return result.status === 0;
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: 5000,
  });

  return {
    success: result.status === 0,
    output: (result.stdout || "").trim(),
    error: (result.stderr || "").trim(),
  };
}

function fileOrDirectoryExists(relativePath) {
  return fs.existsSync(path.join(home, relativePath));
}

function detectCodex() {
  const installed = commandExists("codex");

  if (!installed) {
    return {
      provider: "codex",
      installed: false,
      authenticated: false,
      source: null,
      capabilities: [],
    };
  }

  return {
    provider: "codex",
    installed: true,
    authenticated: fileOrDirectoryExists(".codex"),
    source: "codex-app-server",
    capabilities: [
      "account",
      "plan",
      "rate-limit",
      "reset-time",
    ],
  };
}

function detectClaude() {
  const installed = commandExists("claude");

  if (!installed) {
    return {
      provider: "claude-code",
      installed: false,
      authenticated: false,
      source: null,
      capabilities: [],
    };
  }

  return {
    provider: "claude-code",
    installed: true,
    authenticated:
      fileOrDirectoryExists(".claude") ||
      fileOrDirectoryExists(".config/claude"),
    source: "claude-code-local",
    capabilities: [
      "rate-limit",
      "reset-time",
    ],
  };
}

function detectGemini() {
  const installed = commandExists("gemini");

  if (!installed) {
    return {
      provider: "gemini",
      installed: false,
      authenticated: false,
      source: null,
      capabilities: [],
    };
  }

  return {
    provider: "gemini",
    installed: true,
    authenticated:
      fileOrDirectoryExists(".gemini"),
    source: "gemini-cli-local",
    capabilities: [
      "local-auth-detection",
    ],
  };
}

function detectGitHub() {
  const installed = commandExists("gh");

  if (!installed) {
    return {
      provider: "github",
      installed: false,
      authenticated: false,
      source: null,
      capabilities: [],
    };
  }

  const auth = runCommand("gh", ["auth", "status"]);

  return {
    provider: "github",
    installed: true,
    authenticated: auth.success,
    source: auth.success
      ? "github-cli"
      : "github-cli-installed",
    capabilities: auth.success
      ? ["account", "api"]
      : [],
  };
}

function main() {
  console.log("=== QuotaPilot Provider Discovery POC ===");
  console.log(`Platform: ${process.platform}`);
  console.log(`OS: ${os.platform()}`);
  console.log(`Architecture: ${process.arch}`);
  console.log("");

  const results = [
    detectCodex(),
    detectClaude(),
    detectGemini(),
    detectGitHub(),
  ];

  console.dir(results, { depth: null });

  const output = {
    generatedAt: new Date().toISOString(),
    platform: process.platform,
    architecture: process.arch,
    providers: results,
  };

  const outputPath = path.join(
    __dirname,
    "provider-discovery-result.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(output, null, 2),
    "utf8"
  );

  console.log("");
  console.log(`Saved to: ${outputPath}`);
  console.log("");
  console.log(
    "No credentials, tokens, cookies, or secret values were read or printed."
  );
}

main();
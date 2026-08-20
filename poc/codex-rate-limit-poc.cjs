const { spawn } = require("child_process");

const POLL_COUNT = 5;
const POLL_INTERVAL_MS = 10_000;

const codex = spawn("codex", ["app-server"], {
  stdio: ["pipe", "pipe", "inherit"],
  shell: process.platform === "win32",
});

let buffer = "";
let initialized = false;
let pollCount = 0;

function send(id, method, params = {}) {
  codex.stdin.write(
    JSON.stringify({
      id,
      method,
      params,
    }) + "\n",
  );
}

function formatReset(timestamp) {
  if (!timestamp) return null;

  const reset = new Date(timestamp * 1000);
  const remainingMs = reset.getTime() - Date.now();

  return {
    iso: reset.toISOString(),
    remainingMinutes: Math.max(0, Math.round(remainingMs / 60000)),
  };
}

function extractCodexLimit(response) {
  const limits = response?.result?.rateLimits;

  if (!limits) {
    return null;
  }

  // Prefer the explicit codex bucket when available.
  const byId = response.result.rateLimitsByLimitId;

  if (byId?.codex) {
    return byId.codex;
  }

  return limits;
}

function printSnapshot(response) {
  const limit = extractCodexLimit(response);

  if (!limit) {
    console.log("\nNo rate-limit data returned.");
    return;
  }

  const primary = limit.primary;

  console.log(`\n--- Snapshot ${pollCount} ---`);
  console.log("Limit ID:", limit.limitId ?? "unknown");
  console.log("Plan:", limit.planType ?? "unknown");
  console.log(
    "Used:",
    primary?.usedPercent != null ? `${primary.usedPercent}%` : "unknown",
  );

  console.log(
    "Remaining:",
    primary?.usedPercent != null ? `${100 - primary.usedPercent}%` : "unknown",
  );

  console.log(
    "Window:",
    primary?.windowDurationMins != null
      ? `${primary.windowDurationMins} minutes`
      : "unknown",
  );

  console.log("Reset:", formatReset(primary?.resetsAt));

  console.log("Credits:", limit.credits ?? null);

  console.log("Individual limit:", limit.individualLimit ?? null);
}

codex.stdout.on("data", (chunk) => {
  buffer += chunk.toString();

  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;

    let message;

    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }

    if (message.id === 1 && message.result) {
      initialized = true;

      // Authenticate/read the account first.
      send(2, "account/read", {
        refreshToken: true,
      });

      return;
    }

    if (message.id === 2 && message.result) {
      console.log("\n=== ACCOUNT ===");
      console.dir(message.result.account, {
        depth: null,
      });

      // First rate-limit request.
      send(3, "account/rateLimits/read");

      return;
    }

    if (message.id === 3 && message.result) {
      pollCount += 1;
      printSnapshot(message);

      if (pollCount >= POLL_COUNT) {
        console.log("\n=== POC COMPLETE ===");
        console.log(`Collected ${pollCount} rate-limit snapshots.`);

        codex.kill();
        return;
      }

      setTimeout(() => {
        send(3, "account/rateLimits/read");
      }, POLL_INTERVAL_MS);

      return;
    }
  }
});

codex.on("error", (error) => {
  console.error("Failed to start Codex app-server:");
  console.error(error.message);
});

codex.on("close", (code) => {
  console.log(`\nCodex app-server exited with code ${code}`);
});

// Initialize exactly once.
send(1, "initialize", {
  clientInfo: {
    name: "quotapilot-codex-poc",
    title: "QuotaPilot Codex Rate Limit POC",
    version: "0.1.0",
  },
});

codex.stdin.write(
  JSON.stringify({
    method: "initialized",
  }) + "\n",
);

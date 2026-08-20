const { spawn } = require("child_process");

const codex = spawn("codex", ["app-server"], {
  stdio: ["pipe", "pipe", "inherit"],
  shell: true,
});

let buffer = "";

function send(id, method, params = {}) {
  const request = {
    method,
    id,
    params,
  };

  codex.stdin.write(`${JSON.stringify(request)}\n`);
}

codex.stdout.on("data", (chunk) => {
  buffer += chunk.toString();

  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const message = JSON.parse(line);

      console.log("\n--- Response ---");
      console.dir(message, { depth: null });

      if (message.id === 3) {
        console.log("\nPOC complete.");
        codex.kill();
      }
    } catch {
      console.log("Non-JSON output:", line);
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

// 1. Initialize the JSON-RPC connection
send(1, "initialize", {
  clientInfo: {
    name: "quotapilot-poc",
    title: "QuotaPilot ChatGPT POC",
    version: "0.1.0",
  },
});

// 2. Required initialization notification
codex.stdin.write(
  JSON.stringify({
    method: "initialized",
  }) + "\n"
);

// 3. Read the authenticated ChatGPT account
send(2, "account/read", {
  refreshToken: true,
});

// 4. Read ChatGPT rate limits
send(3, "account/rateLimits/read");

const { spawn } = require("child_process");

const claude = spawn(
  "claude",
  ["--print", "--output-format", "stream-json", "Say exactly: POC_CHECK"],
  {
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let output = "";
let stderr = "";

claude.stdout.on("data", (chunk) => {
  output += chunk.toString();
});

claude.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

claude.on("close", (code) => {
  console.log("=== CLAUDE CODE POC ===");
  console.log("Exit code:", code);

  if (stderr.trim()) {
    console.log("\nSTDERR:");
    console.log(stderr.trim());
  }

  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let foundRateLimits = false;

  for (const line of lines) {
    try {
      const event = JSON.parse(line);

      if (event.rate_limits) {
        foundRateLimits = true;

        console.log("\n=== RATE LIMITS FOUND ===");
        console.dir(event.rate_limits, { depth: null });
      }
    } catch {
      // Ignore non-JSON output.
    }
  }

  if (!foundRateLimits) {
    console.log("\nRATE LIMITS: NOT FOUND");

    console.log("\nThis does not necessarily mean authentication failed.");

    console.log(
      "Claude Code may expose rate_limits only through its statusline payload.",
    );
  }

  console.log("\nPOC complete.");
});

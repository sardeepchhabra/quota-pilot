const fs = require("fs");
const path = require("path");

let input = "";

process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  input += chunk;
});

process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);

    const result = {
      provider: "claude-code",
      capturedAt: new Date().toISOString(),
      version: data.version ?? null,
      rateLimits: {
        fiveHour: data.rate_limits?.five_hour
          ? {
              usedPercentage:
                data.rate_limits.five_hour.used_percentage ?? null,
              remainingPercentage:
                data.rate_limits.five_hour.used_percentage != null
                  ? 100 - data.rate_limits.five_hour.used_percentage
                  : null,
              resetsAt: data.rate_limits.five_hour.resets_at ?? null,
            }
          : null,

        sevenDay: data.rate_limits?.seven_day
          ? {
              usedPercentage:
                data.rate_limits.seven_day.used_percentage ?? null,
              remainingPercentage:
                data.rate_limits.seven_day.used_percentage != null
                  ? 100 - data.rate_limits.seven_day.used_percentage
                  : null,
              resetsAt: data.rate_limits.seven_day.resets_at ?? null,
            }
          : null,
      },
    };

    const output = path.resolve(__dirname, "claude-usage-result.json");

    fs.writeFileSync(output, JSON.stringify(result, null, 2));

    console.log("\n=== CLAUDE CODE POC ===");
    console.dir(result, { depth: null });
    console.log(`\nSaved to: ${output}`);
  } catch (error) {
    console.error("Failed to parse Claude Code statusline data:");
    console.error(error.message);
    process.exit(1);
  }
});

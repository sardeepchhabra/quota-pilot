const fs = require("fs");
const path = require("path");

async function getCopilotQuota() {
  const localAppData = process.env.LOCALAPPDATA;
  const appData = process.env.APPDATA;

  // Potential local token storage locations
  const candidatePaths = [
    path.join(localAppData, "github-copilot", "hosts.json"),
    path.join(
      appData,
      "Code",
      "User",
      "globalStorage",
      "github.copilot",
      "hosts.json",
    ),
  ];

  let token = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, "utf8"));
        const hostKey = Object.keys(raw).find((k) => k.includes("github.com"));
        if (hostKey && raw[hostKey].oauth_token) {
          token = raw[hostKey].oauth_token;
          console.log(`[Copilot] Found local token at: ${p}`);
          break;
        }
      } catch (err) {
        // Continue to next path
      }
    }
  }

  if (!token) {
    console.error("[Copilot] ❌ No local GitHub Copilot session found.");
    return;
  }

  // Query Copilot Internal Usage Endpoint
  try {
    const res = await fetch("https://api.github.com/copilot_internal/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "GitHubCopilotChat/0.24.0",
      },
    });

    if (!res.ok) {
      console.error(`[Copilot] ❌ API call failed: HTTP ${res.status}`);
      const text = await res.text();
      console.error(text);
      return;
    }

    const data = await res.json();
    console.log("[Copilot] ✅ Internal Data Retrieved:");
    console.log(
      JSON.stringify(
        {
          plan: data.copilot_plan || data.sku,
          resetDate: data.quota_reset_date_utc,
          percentRemaining: data.percent_remaining,
          entitlement: data.entitlement,
          rawSnapshots: data.quota_snapshots,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error("[Copilot] Network error:", err.message);
  }
}

getCopilotQuota();

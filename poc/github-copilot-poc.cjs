const https = require("https");

// POC ONLY:
// Use an environment variable in the final version.
const CLIENT_ID = "Iv23liMwu8rxQB41bMhZ";

if (!CLIENT_ID) {
  console.error("Missing GitHub Client ID.");
  process.exit(1);
}

function request(method, hostname, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const req = https.request(
      {
        hostname,
        path,
        method,
        headers: {
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "QuotaPilot-POC",
          "X-GitHub-Api-Version": "2026-03-10",
          ...headers,
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let response = "";

        res.on("data", (chunk) => {
          response += chunk;
        });

        res.on("end", () => {
          let parsed;

          try {
            parsed = response ? JSON.parse(response) : {};
          } catch {
            parsed = response;
          }

          resolve({
            status: res.statusCode,
            data: parsed,
          });
        });
      }
    );

    req.on("error", reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function authorizeDevice() {
  const response = await request(
    "POST",
    "github.com",
    `/login/device/code?client_id=${encodeURIComponent(CLIENT_ID)}`
  );

  if (response.status !== 200) {
    throw new Error(
      `Device authorization failed:\n${JSON.stringify(response.data, null, 2)}`
    );
  }

  const {
    device_code,
    user_code,
    verification_uri,
    expires_in,
    interval = 5,
  } = response.data;

  console.log("\n1. Open:");
  console.log(`   ${verification_uri}`);

  console.log("\n2. Enter this code:");
  console.log(`   ${user_code}`);

  console.log(`\nCode expires in ${expires_in} seconds.`);

  return {
    device_code,
    interval,
  };
}

async function getAccessToken(deviceCode, interval) {
  while (true) {
    const response = await request(
      "POST",
      "github.com",
      "/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }
    );

    const data = response.data;

    if (data.access_token) {
      return data.access_token;
    }

    if (data.error === "authorization_pending") {
      await sleep(interval * 1000);
      continue;
    }

    if (data.error === "slow_down") {
      interval += 5;
      await sleep(interval * 1000);
      continue;
    }

    throw new Error(
      `GitHub authorization failed:\n${JSON.stringify(data, null, 2)}`
    );
  }
}

async function githubGet(path, token) {
  return request("GET", "api.github.com", path, null, {
    Authorization: `Bearer ${token}`,
  });
}

async function getCurrentUser(token) {
  const response = await githubGet("/user", token);

  if (response.status !== 200) {
    throw new Error(
      `Failed to get GitHub user:\n${JSON.stringify(response.data, null, 2)}`
    );
  }

  return response.data;
}

async function getAiCreditUsage(token, username) {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const path =
    `/users/${encodeURIComponent(username)}/settings/billing/ai_credit/usage` +
    `?year=${year}&month=${month}`;

  return githubGet(path, token);
}

async function getBillingSummary(token, username) {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const path =
    `/users/${encodeURIComponent(username)}/settings/billing/usage/summary` +
    `?year=${year}&month=${month}`;

  return githubGet(path, token);
}

async function getOrganizations(token) {
  return githubGet("/user/orgs", token);
}

async function getOrganizationCopilotSeat(token, org, username) {
  const path = `/orgs/${encodeURIComponent(org)}/members/${encodeURIComponent(
    username
  )}/copilot`;

  return githubGet(path, token);
}

async function getOrganizationCopilotBilling(token, org) {
  const path = `/orgs/${encodeURIComponent(org)}/copilot/billing`;

  return githubGet(path, token);
}

async function main() {
  console.log("=== QuotaPilot GitHub Copilot POC 2A ===");

  // ------------------------------------------------------------
  // 1. Authenticate
  // ------------------------------------------------------------

  const { device_code, interval } = await authorizeDevice();

  console.log("\nWaiting for browser authorization...");

  const token = await getAccessToken(device_code, interval);

  console.log("\nGitHub authentication: SUCCESS");

  // ------------------------------------------------------------
  // 2. Identify GitHub account
  // ------------------------------------------------------------

  const user = await getCurrentUser(token);

  console.log("\n=== GITHUB ACCOUNT ===");
  console.dir(
    {
      login: user.login,
      name: user.name,
      email: user.email,
    },
    { depth: null }
  );

  // ------------------------------------------------------------
  // 3. Personal AI-credit usage
  // ------------------------------------------------------------

  const usage = await getAiCreditUsage(token, user.login);

  console.log("\n=== PERSONAL AI CREDIT USAGE ===");
  console.log("HTTP:", usage.status);
  console.dir(usage.data, { depth: null });

  // ------------------------------------------------------------
  // 4. Personal billing summary
  // ------------------------------------------------------------

  const summary = await getBillingSummary(token, user.login);

  console.log("\n=== PERSONAL BILLING SUMMARY ===");
  console.log("HTTP:", summary.status);
  console.dir(summary.data, { depth: null });

  // ------------------------------------------------------------
  // 5. Organizations
  // ------------------------------------------------------------

  const orgs = await getOrganizations(token);

  console.log("\n=== ORGANIZATIONS ===");
  console.log("HTTP:", orgs.status);
  console.dir(orgs.data, { depth: null });

  if (orgs.status === 200 && Array.isArray(orgs.data) && orgs.data.length > 0) {
    console.log(
      `\nChecking Copilot access across ${orgs.data.length} organization(s)...`
    );

    for (const org of orgs.data) {
      console.log(`\n----------------------------------------`);
      console.log(`Organization: ${org.login}`);
      console.log(`----------------------------------------`);

      // --------------------------------------------------------
      // 6. Organization Copilot seat for current user
      // --------------------------------------------------------

      const seat = await getOrganizationCopilotSeat(
        token,
        org.login,
        user.login
      );

      console.log("\nCopilot seat endpoint:");
      console.log("HTTP:", seat.status);

      if (seat.status === 200) {
        console.dir(seat.data, {
          depth: null,
        });
      } else {
        console.log(JSON.stringify(seat.data, null, 2));
      }

      // --------------------------------------------------------
      // 7. Organization Copilot billing
      // --------------------------------------------------------

      const billing = await getOrganizationCopilotBilling(token, org.login);

      console.log("\nOrganization Copilot billing:");
      console.log("HTTP:", billing.status);

      if (billing.status === 200) {
        console.dir(billing.data, {
          depth: null,
        });
      } else {
        console.log(JSON.stringify(billing.data, null, 2));
      }
    }
  } else {
    console.log("\nNo GitHub organizations returned for this account.");
  }

  console.log("\n=== POC RESULT ===");

  if (usage.status === 200 && Array.isArray(usage.data?.usageItems)) {
    console.log("Personal AI-credit endpoint: ACCESSIBLE");

    if (usage.data.usageItems.length === 0) {
      console.log("Personal AI-credit usage: EMPTY");
    } else {
      console.log("Personal AI-credit usage: DATA AVAILABLE");
    }
  } else {
    console.log("Personal AI-credit endpoint: NOT ACCESSIBLE");
  }

  console.log("\nToken was intentionally not printed.");
}

main().catch((error) => {
  console.error("\nPOC FAILED");
  console.error(error.message);
  process.exit(1);
});

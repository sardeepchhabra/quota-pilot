const https = require("https");
const readline = require("readline");

// const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_ID = "Iv23liMwu8rxQB41bMhZ";

if (!CLIENT_ID) {
  console.error("Missing GITHUB_CLIENT_ID.");
  console.error("Set it first with:");
  console.error("set GITHUB_CLIENT_ID=YOUR_CLIENT_ID");
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

async function getCurrentUser(token) {
  const response = await request("GET", "api.github.com", "/user", null, {
    Authorization: `Bearer ${token}`,
  });

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

  return request("GET", "api.github.com", path, null, {
    Authorization: `Bearer ${token}`,
  });
}

async function main() {
  console.log("=== QuotaPilot GitHub Copilot POC ===");

  const { device_code, interval } = await authorizeDevice();

  console.log("\nWaiting for browser authorization...");

  const token = await getAccessToken(device_code, interval);

  console.log("\nGitHub authentication: SUCCESS");

  const user = await getCurrentUser(token);

  console.log("\nGitHub account:");
  console.log({
    login: user.login,
    name: user.name,
    email: user.email,
  });

  const usage = await getAiCreditUsage(token, user.login);
  const summaryPath =
    `/users/${encodeURIComponent(user.login)}` +
    `/settings/billing/usage/summary` +
    `?year=${new Date().getUTCFullYear()}` +
    `&month=${new Date().getUTCMonth() + 1}`;

  const summary = await request("GET", "api.github.com", summaryPath, null, {
    Authorization: `Bearer ${token}`,
  });

  console.log("\n=== BILLING USAGE SUMMARY ===");
  console.log("Status:", summary.status);
  console.dir(summary.data, { depth: null });

  console.log("\nAI credit API status:");
  console.log(usage.status);

  console.log("\n=== AI CREDIT USAGE ===");
  console.dir(usage.data, { depth: null });

  if (usage.status === 200) {
    console.log("\nPOC RESULT: GitHub AI-credit usage is accessible.");
  } else {
    console.log(
      "\nPOC RESULT: Authentication worked, but AI-credit usage was not accessible."
    );
  }

  console.log("\nToken was intentionally not printed.");
}

main().catch((error) => {
  console.error("\nPOC FAILED");
  console.error(error.message);
  process.exit(1);
});

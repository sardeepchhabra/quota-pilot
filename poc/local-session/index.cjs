const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const APPDATA = process.env.APPDATA || (os.platform() === "win32" ? path.join(HOME, "AppData", "Roaming") : "");
const LOCALAPPDATA = process.env.LOCALAPPDATA || (os.platform() === "win32" ? path.join(HOME, "AppData", "Local") : "");

console.log("=== LOCAL SESSION PROVIDERS DISCOVERY POC ===");
console.log(`Operating System: ${os.type()} (${os.platform()} ${os.arch()})`);
console.log(`Home Directory:   ${HOME}`);
console.log(`AppData:          ${APPDATA}`);
console.log(`LocalAppData:     ${LOCALAPPDATA}\n`);

// Helper to check path existence
function checkPath(targetPath) {
  if (!targetPath) return { exists: false };
  try {
    const stats = fs.statSync(targetPath);
    return {
      exists: true,
      isDirectory: stats.isDirectory(),
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    };
  } catch (err) {
    return { exists: false, error: err.code };
  }
}

// Mask token for privacy
function maskToken(token) {
  if (!token) return "None";
  if (token.length <= 8) return "****";
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

const discoveries = {};

// 1. GitHub Copilot Session Detection
discoveries.githubCopilot = {
  name: "GitHub Copilot",
  checks: [
    {
      description: "Copilot CLI Config (hosts.json)",
      path: path.join(HOME, ".config", "github-copilot", "hosts.json"),
      parser: (filePath) => {
        const content = fs.readFileSync(filePath, "utf8");
        const json = JSON.parse(content);
        const hosts = Object.keys(json);
        const result = {};
        for (const host of hosts) {
          result[host] = {
            oauthToken: maskToken(json[host].oauth_token),
            user: json[host].user || "Unknown",
          };
        }
        return result;
      }
    },
    {
      description: "Copilot App Config (apps.json)",
      path: path.join(HOME, ".config", "github-copilot", "apps.json"),
      parser: (filePath) => {
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content);
      }
    },
    {
      description: "VS Code SQLite global state db",
      path: APPDATA ? path.join(APPDATA, "Code", "User", "globalStorage", "state.vscdb") : null,
      parser: () => "SQLite DB exists (requires sqlite3 driver to extract tokens)"
    }
  ]
};

// 2. Claude Code Session Detection
discoveries.claudeCode = {
  name: "Claude Code / Anthropic",
  checks: [
    {
      description: "Claude Config",
      path: path.join(HOME, ".claude", "config.json"),
      parser: (filePath) => {
        const content = fs.readFileSync(filePath, "utf8");
        const json = JSON.parse(content);
        return {
          hasToken: !!json.authToken,
          tokenMasked: maskToken(json.authToken)
        };
      }
    },
    {
      description: "Claude Code CLI Storage Directory",
      path: path.join(HOME, ".claude-code"),
      parser: () => "Claude Code directory found (stores workspace metadata and state)"
    },
    {
      description: "Anthropic API Config",
      path: path.join(HOME, ".anthropic", "config.json"),
      parser: (filePath) => {
        const content = fs.readFileSync(filePath, "utf8");
        const json = JSON.parse(content);
        return {
          hasApiKey: !!json.apiKey,
          apiKeyMasked: maskToken(json.apiKey)
        };
      }
    }
  ]
};

// 3. Browser Session Detection (ChatGPT / Gemini / Claude Web sessions)
discoveries.browserSessions = {
  name: "Web Browser Local Storage / Cookies Paths",
  checks: [
    {
      description: "Google Chrome User Data",
      path: LOCALAPPDATA ? path.join(LOCALAPPDATA, "Google", "Chrome", "User Data") : null,
      parser: () => "Chrome data directory found (contains cookies/local storage databases)"
    },
    {
      description: "Microsoft Edge User Data",
      path: LOCALAPPDATA ? path.join(LOCALAPPDATA, "Microsoft", "Edge", "User Data") : null,
      parser: () => "Edge data directory found (contains cookies/local storage databases)"
    }
  ]
};

// Run the checks
console.log("-----------------------------------------");
console.log("Analyzing local files & configurations...");
console.log("-----------------------------------------\n");

for (const providerKey in discoveries) {
  const provider = discoveries[providerKey];
  console.log(`[Provider: ${provider.name}]`);
  
  let detectedCount = 0;
  
  for (const check of provider.checks) {
    if (!check.path) continue;
    
    const info = checkPath(check.path);
    if (info.exists) {
      detectedCount++;
      console.log(`  ✅ FOUND: ${check.description}`);
      console.log(`     Path:  ${check.path}`);
      console.log(`     Type:  ${info.isDirectory ? "Directory" : "File"}`);
      console.log(`     Size:  ${info.size} bytes`);
      console.log(`     Mtime: ${info.modifiedAt}`);
      
      if (!info.isDirectory && check.parser) {
        try {
          const parsed = check.parser(check.path);
          console.log("     Data:", JSON.stringify(parsed, null, 2).replace(/\n/g, "\n     "));
        } catch (e) {
          console.log(`     Data: [Unparsed/Error: ${e.message}]`);
        }
      } else if (info.isDirectory && check.parser) {
        console.log(`     Data: ${check.parser(check.path)}`);
      }
    } else {
      console.log(`  ❌ MISSING: ${check.description}`);
      console.log(`     Path:    ${check.path} (${info.error || "unavailable path"})`);
    }
    console.log();
  }
  
  if (detectedCount === 0) {
    console.log(`  ℹ️ No active sessions or local files discovered for ${provider.name}.\n`);
  }
}

console.log("-----------------------------------------");
console.log("Discovery completed.");
console.log("-----------------------------------------");

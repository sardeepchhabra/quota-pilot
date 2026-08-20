use serde::Serialize;
use serde_json::{json, Value};
use std::env;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

#[derive(Debug, Serialize)]
pub struct CodexSnapshot {
    pub provider: String,
    pub account_type: Option<String>,
    pub email: Option<String>,
    pub plan_type: Option<String>,
    pub limit_id: Option<String>,
    pub used_percent: Option<f64>,
    pub remaining_percent: Option<f64>,
    pub window_duration_minutes: Option<i64>,
    pub resets_at: Option<i64>,
}

fn executable_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    // 1. Explicit override.
    if let Ok(path) = env::var("QUOTAPILOT_CODEX_BIN") {
        candidates.push(PathBuf::from(path));
    }

    // 2. Resolve Codex from PATH.
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = Command::new("where.exe")
            .arg("codex")
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);

                for line in stdout.lines() {
                    let path = PathBuf::from(line.trim());

                    if !path.as_os_str().is_empty() {
                        candidates.push(path);
                    }
                }
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        if let Ok(output) = Command::new("which")
            .arg("-a")
            .arg("codex")
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);

                for line in stdout.lines() {
                    let path = PathBuf::from(line.trim());

                    if !path.as_os_str().is_empty() {
                        candidates.push(path);
                    }
                }
            }
        }
    }

    // 3. npm global installation on Windows.
    #[cfg(target_os = "windows")]
    {
        if let Ok(app_data) = env::var("APPDATA") {
            let npm_dir = PathBuf::from(app_data).join("npm");

            candidates.push(npm_dir.join("codex.cmd"));
            candidates.push(npm_dir.join("codex.exe"));
        }
    }

    // 4. OpenAI per-user Codex installation.
    #[cfg(target_os = "windows")]
    {
        if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
            let base = PathBuf::from(local_app_data)
                .join("OpenAI")
                .join("Codex")
                .join("bin");

            candidates.push(base.join("codex.exe"));

            if let Ok(entries) = std::fs::read_dir(&base) {
                for entry in entries.flatten() {
                    let path = entry.path();

                    if path.is_dir() {
                        candidates.push(path.join("codex.exe"));
                    }
                }
            }
        }
    }

    // 5. Windows MSIX installation.
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = Command::new("powershell.exe")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "(Get-AppxPackage OpenAI.Codex | Select-Object -ExpandProperty InstallLocation)",
            ])
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);

                for install_location in stdout.lines() {
                    let install_location = install_location.trim();

                    if install_location.is_empty() {
                        continue;
                    }

                    let base = PathBuf::from(install_location);

                    candidates.push(
                        base.join("app")
                            .join("resources")
                            .join("codex.exe"),
                    );

                    candidates.push(
                        base.join("resources")
                            .join("codex.exe"),
                    );
                }
            }
        }
    }

    // Remove duplicates.
    let mut unique = Vec::new();

    for candidate in candidates {
        if !unique.contains(&candidate) {
            unique.push(candidate);
        }
    }

    unique
}

fn can_start_codex_app_server(path: &Path) -> bool {
    if !path.exists() {
        return false;
    }

    #[cfg(target_os = "windows")]
    let result = Command::new("cmd")
        .args(["/C"])
        .arg(path)
        .arg("app-server")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn();

    #[cfg(not(target_os = "windows"))]
    let result = Command::new(path)
        .arg("app-server")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn();

    result.is_ok()
}

fn find_codex_binary() -> Option<PathBuf> {
    for candidate in executable_candidates() {
        if can_start_codex_app_server(&candidate) {
            return Some(candidate);
        }
    }

    None
}

fn send_request(
    stdin: &mut impl Write,
    request: Value,
) -> Result<(), String> {
    let payload = serde_json::to_string(&request)
        .map_err(|error| format!("Failed to serialize request: {error}"))?;

    stdin
        .write_all(payload.as_bytes())
        .map_err(|error| format!("Failed to write request: {error}"))?;

    stdin
        .write_all(b"\n")
        .map_err(|error| format!("Failed to write newline: {error}"))?;

    stdin
        .flush()
        .map_err(|error| format!("Failed to flush request: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_codex_snapshot() -> Result<CodexSnapshot, String> {
    let binary = find_codex_binary()
        .ok_or_else(|| {
            "Codex runtime was not found on this machine.".to_string()
        })?;

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut command = Command::new("cmd");
        command.arg("/C").arg(&binary).arg("app-server");
        command
    };

    #[cfg(not(target_os = "windows"))]
    let mut command = {
        let mut command = Command::new(&binary);
        command.arg("app-server");
        command
    };

    let mut child = command
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| {
            format!("Failed to start Codex app-server: {error}")
        })?;

    let mut stdin = child.stdin.take().ok_or_else(|| {
        "Failed to access Codex app-server stdin.".to_string()
    })?;

    let stdout = child.stdout.take().ok_or_else(|| {
        "Failed to access Codex app-server stdout.".to_string()
    })?;

    // Initialize.
    send_request(
        &mut stdin,
        json!({
            "id": 1,
            "method": "initialize",
            "params": {
                "clientInfo": {
                    "name": "quotapilot",
                    "title": "QuotaPilot",
                    "version": "0.1.0"
                }
            }
        }),
    )?;

    send_request(
        &mut stdin,
        json!({
            "method": "initialized"
        }),
    )?;

    // Read authenticated account.
    send_request(
        &mut stdin,
        json!({
            "id": 2,
            "method": "account/read",
            "params": {
                "refreshToken": false
            }
        }),
    )?;

    // Read rate limits.
    send_request(
        &mut stdin,
        json!({
            "id": 3,
            "method": "account/rateLimits/read"
        }),
    )?;

    let reader = BufReader::new(stdout);

    let mut account: Option<Value> = None;
    let mut rate_limits: Option<Value> = None;

    for line in reader.lines() {
        let line = line.map_err(|error| {
            format!("Failed reading Codex output: {error}")
        })?;

        if line.trim().is_empty() {
            continue;
        }

        let message: Value = match serde_json::from_str(&line) {
            Ok(value) => value,
            Err(_) => continue,
        };

        match message.get("id").and_then(Value::as_i64) {
            Some(2) => {
                if let Some(error) = message.get("error") {
                    let _ = child.kill();

                    return Err(format!(
                        "Codex authentication/account lookup failed: {}",
                        error
                    ));
                }

                account = message
                    .get("result")
                    .and_then(|result| result.get("account"))
                    .cloned();
            }

            Some(3) => {
                if let Some(error) = message.get("error") {
                    let _ = child.kill();

                    return Err(format!(
                        "Codex rate-limit lookup failed: {}",
                        error
                    ));
                }

                rate_limits = message
                    .get("result")
                    .and_then(|result| {
                        result
                            .get("rateLimitsByLimitId")
                            .and_then(|limits| limits.get("codex"))
                            .or_else(|| result.get("rateLimits"))
                    })
                    .cloned();
            }

            _ => {}
        }

        if account.is_some() && rate_limits.is_some() {
            break;
        }
    }

    let _ = child.kill();

    let account = account.ok_or_else(|| {
        "Codex is installed, but no authenticated Codex account was returned."
            .to_string()
    })?;

    let rate_limits = rate_limits.ok_or_else(|| {
        "Codex returned no rate-limit information.".to_string()
    })?;

    let primary = rate_limits.get("primary");

    let used_percent = primary
        .and_then(|value| value.get("usedPercent"))
        .and_then(Value::as_f64);

    let remaining_percent =
        used_percent.map(|value| 100.0 - value);

    let window_duration_minutes = primary
        .and_then(|value| value.get("windowDurationMins"))
        .and_then(Value::as_i64);

    let resets_at = primary
        .and_then(|value| value.get("resetsAt"))
        .and_then(Value::as_i64);

    Ok(CodexSnapshot {
        provider: "codex".to_string(),

        account_type: account
            .get("type")
            .and_then(Value::as_str)
            .map(str::to_string),

        email: account
            .get("email")
            .and_then(Value::as_str)
            .map(str::to_string),

        plan_type: account
            .get("planType")
            .and_then(Value::as_str)
            .map(str::to_string),

        limit_id: rate_limits
            .get("limitId")
            .and_then(Value::as_str)
            .map(str::to_string),

        used_percent,

        remaining_percent,

        window_duration_minutes,

        resets_at,
    })
}
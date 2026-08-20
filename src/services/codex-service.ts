import { invoke } from "@tauri-apps/api/core";

export interface CodexSnapshot {
  provider: "codex";
  account_type: string | null;
  email: string | null;
  plan_type: string | null;
  limit_id: string | null;
  used_percent: number | null;
  remaining_percent: number | null;
  window_duration_minutes: number | null;
  resets_at: number | null;
}

export function getCodexSnapshot(): Promise<CodexSnapshot> {
  return invoke<CodexSnapshot>("get_codex_snapshot");
}

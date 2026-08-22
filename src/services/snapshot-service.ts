import type { ProviderSnapshot } from "../domain/quota";
import type { CodexSnapshot } from "./codex-service";

const STORAGE_KEY = "quotapilot.snapshot-state";

export interface SnapshotState {
  providerSnapshots: ProviderSnapshot[];
  codexSnapshot: CodexSnapshot | null;
  updatedAt: string | null;
}

const emptyState: SnapshotState = {
  providerSnapshots: [],
  codexSnapshot: null,
  updatedAt: null,
};

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return globalThis.localStorage as Storage;
  }

  return null;
}

export class SnapshotService {
  read(): SnapshotState {
    const storage = getStorage();

    if (!storage) {
      return emptyState;
    }

    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      return emptyState;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SnapshotState>;

      return {
        providerSnapshots: Array.isArray(parsed.providerSnapshots)
          ? (parsed.providerSnapshots as ProviderSnapshot[])
          : [],
        codexSnapshot:
          parsed.codexSnapshot !== undefined ? parsed.codexSnapshot : null,
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      };
    } catch {
      return emptyState;
    }
  }

  saveProviderSnapshots(snapshots: ProviderSnapshot[]): void {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    const previous = this.read();

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...previous,
        providerSnapshots: snapshots,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  saveCodexSnapshot(snapshot: CodexSnapshot | null): void {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    const previous = this.read();

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...previous,
        codexSnapshot: snapshot,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  loadProviderSnapshots(): ProviderSnapshot[] {
    return this.read().providerSnapshots;
  }

  loadCodexSnapshot(): CodexSnapshot | null {
    return this.read().codexSnapshot;
  }
}

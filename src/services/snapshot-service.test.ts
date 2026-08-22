import { beforeEach, describe, expect, it } from "vitest";
import { SnapshotService } from "./snapshot-service";

const createLocalStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => {
      values.clear();
    },
  } as Storage;
};

describe("SnapshotService", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: createLocalStorage(),
      configurable: true,
      writable: true,
    });
  });

  it("persists provider snapshots and codex snapshots locally", () => {
    const service = new SnapshotService();

    const providerSnapshot = {
      account: {
        id: "mock-account-1",
        providerId: "mock",
        displayName: "Demo Account",
        capabilities: [
          {
            id: "usage",
            availability: "available",
          },
        ],
      },
      quotas: [
        {
          id: "demo-quota",
          name: "Demo quota",
          unit: "percentage",
          percentageRemaining: 72,
          confidence: "provider-reported",
          availability: "available",
          retrievedAt: "2026-08-22T00:00:00.000Z",
        },
      ],
      retrievedAt: "2026-08-22T00:00:00.000Z",
    } as const;

    const codexSnapshot = {
      provider: "codex",
      account_type: "personal",
      email: "user@example.com",
      plan_type: "go",
      limit_id: "codex",
      used_percent: 18,
      remaining_percent: 82,
      window_duration_minutes: 43200,
      resets_at: 1755854200,
    };

    service.saveProviderSnapshots([providerSnapshot as any]);
    service.saveCodexSnapshot(codexSnapshot as any);

    expect(service.loadProviderSnapshots()).toHaveLength(1);
    expect(service.loadCodexSnapshot()).toEqual(codexSnapshot);
  });
});

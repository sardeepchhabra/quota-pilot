import { describe, expect, it } from "vitest";
import { ProviderService } from "./provider-service";
import { createProviderRegistry } from "../providers";

describe("ProviderService", () => {
  it("returns accounts from registered providers", async () => {
    const service = new ProviderService(createProviderRegistry());

    const accounts = await service.getAccounts();

    expect(accounts).toHaveLength(2);
    expect(accounts.map((account) => account.providerId)).toContain("mock");
    expect(accounts.map((account) => account.providerId)).toContain("chatgpt");
  });

  it("retrieves usage through the correct provider", async () => {
    const service = new ProviderService(createProviderRegistry());

    const accounts = await service.getAccounts();
    const chatgpt = accounts.find(
      (account) => account.providerId === "chatgpt"
    );

    expect(chatgpt).toBeDefined();

    const snapshot = await service.getSnapshot(chatgpt!);
    expect(snapshot.account.providerId).toBe("chatgpt");
    expect(snapshot.quotas).toHaveLength(0);
    expect(snapshot.subscription?.status).toBe("unknown");
  });
});

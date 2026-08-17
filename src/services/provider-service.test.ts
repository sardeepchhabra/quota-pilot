import { describe, expect, it } from "vitest";
import { ProviderService } from "./provider-service";
import { createProviderRegistry } from "../providers";

describe("ProviderService", () => {
  it("returns accounts only from connected providers", async () => {
    const service = new ProviderService(createProviderRegistry());

    const accounts = await service.getAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerId).toBe("mock");
  });

  it("does not expose an unconnected ChatGPT account", async () => {
    const service = new ProviderService(createProviderRegistry());

    const accounts = await service.getAccounts();

    const chatgpt = accounts.find(
      (account) => account.providerId === "chatgpt"
    );

    expect(chatgpt).toBeUndefined();
  });
});

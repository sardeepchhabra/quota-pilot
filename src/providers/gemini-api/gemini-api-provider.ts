import type { Provider, ProviderAccount } from "../provider";
import type { ProviderSnapshot } from "../../domain/quota";
import { GeminiApiClient } from "./gemini-api-client";

export class GeminiApiProvider implements Provider {
  readonly id = "gemini-api";
  readonly name = "Gemini API";

  constructor(private readonly client: GeminiApiClient) {}

  async getAccounts(): Promise<ProviderAccount[]> {
    const models = await this.client.getModels();

    return [
      {
        id: "gemini-api-default",
        providerId: this.id,
        displayName: "Gemini API",
        capabilities: ["account", "usage", "quota"],
        metadata: {
          modelCount: models.length,
        },
      },
    ];
  }

  async getSnapshot(account: ProviderAccount): Promise<ProviderSnapshot> {
    await this.client.getModels();

    return {
      account,

      connection: {
        status: "connected",
        message: "Gemini API authentication successful.",
      },

      quotas: [],

      retrievedAt: new Date().toISOString(),
    };
  }

  async disconnect(_account: ProviderAccount): Promise<void> {}
}

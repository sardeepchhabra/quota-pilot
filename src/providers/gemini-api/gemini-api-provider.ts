import type { Provider, ProviderAccount } from "../provider";
import type { ProviderSnapshot } from "../../domain/quota";
import { GeminiApiClient } from "./gemini-api-client";

export class GeminiApiProvider implements Provider {
  readonly id = "gemini-api";
  readonly name = "Gemini API";

  private readonly client: GeminiApiClient;

  constructor(client: GeminiApiClient) {
    this.client = client;
  }

  async getAccounts(): Promise<ProviderAccount[]> {
    const models = await this.client.getModels();

    return [
      {
        id: "gemini-api-default",
        providerId: this.id,
        displayName: "Gemini API",
        capabilities: [
          { id: "account", availability: "available" },
          { id: "usage", availability: "available" },
          { id: "quota", availability: "available" },
          { id: "plan", availability: "available" },
          { id: "reset-time", availability: "available" },
        ],
        plan: `${models.length} models available`,
      },
    ];
  }

  async getSnapshot(account: ProviderAccount): Promise<ProviderSnapshot> {
    await this.client.getModels();

    return {
      account,
      quotas: [],
      retrievedAt: new Date().toISOString(),
    };
  }

  async disconnect(_account: ProviderAccount): Promise<void> {}
}

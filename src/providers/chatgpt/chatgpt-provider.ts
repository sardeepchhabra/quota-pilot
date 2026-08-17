import type { Provider, ProviderAccount } from "../provider";
import type { ProviderSnapshot } from "../../domain/quota";

export class ChatGPTProvider implements Provider {
  readonly id = "chatgpt";
  readonly name = "ChatGPT";

  async getAccounts(): Promise<ProviderAccount[]> {
    return [];
  }

  async getSnapshot(account: ProviderAccount): Promise<ProviderSnapshot> {
    return {
      account,
      quotas: [],
      retrievedAt: new Date().toISOString(),
    };
  }

  async disconnect(_account: ProviderAccount): Promise<void> {}
}

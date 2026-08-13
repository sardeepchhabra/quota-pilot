import type { Provider, ProviderAccount } from '../provider';
import type { ProviderUsage } from '../../domain/quota';

export class ChatGPTProvider implements Provider {
  readonly id = 'chatgpt';
  readonly name = 'ChatGPT';

  async getAccounts(): Promise<ProviderAccount[]> {
    return [];
  }

  async getUsage(account: ProviderAccount): Promise<ProviderUsage> {
    return {
      providerId: this.id,
      accountId: account.id,
      plan: account.plan,
      quotas: [],
      retrievedAt: new Date().toISOString(),
    };
  }

  async disconnect(_account: ProviderAccount): Promise<void> {
    // ChatGPT authentication will be handled by a future
    // browser/local integration.
  }
}
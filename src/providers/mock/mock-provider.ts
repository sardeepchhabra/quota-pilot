import type { Provider, ProviderAccount } from '../provider';
import type { ProviderUsage } from '../../domain/quota';

const mockAccount: ProviderAccount = {
  id: 'mock-account-1',
  providerId: 'mock',
  displayName: 'Demo Account',
  plan: 'Demo',
};

export class MockProvider implements Provider {
  readonly id = 'mock';
  readonly name = 'Mock Provider';

  async getAccounts(): Promise<ProviderAccount[]> {
    return [mockAccount];
  }

  async getUsage(account: ProviderAccount): Promise<ProviderUsage> {
    return {
      providerId: this.id,
      accountId: account.id,
      plan: account.plan,
      quotas: [
        {
          id: 'mock-3-hour-window',
          name: 'Demo 3-hour window',
          unit: 'messages',
          limit: 100,
          used: 27,
          remaining: 73,
          percentageUsed: 27,
          percentageRemaining: 73,
          resetsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          confidence: 'provider-reported',
          retrievedAt: new Date().toISOString(),
        },
      ],
      retrievedAt: new Date().toISOString(),
    };
  }

  async disconnect(_account: ProviderAccount): Promise<void> {
    // Mock provider has nothing to disconnect.
  }
}
import type { Provider, ProviderAccount } from '../provider';
import type { ProviderSnapshot } from '../../domain/quota';

export class ChatGPTProvider implements Provider {
  readonly id = 'chatgpt';
  readonly name = 'ChatGPT';

  async getAccounts(): Promise<ProviderAccount[]> {
    return [
      {
        id: 'chatgpt-local',
        providerId: this.id,
        displayName: 'ChatGPT Account',
        plan: 'Go',
      },
    ];
  }

  async getSnapshot(account: ProviderAccount): Promise<ProviderSnapshot> {
    const retrievedAt = new Date().toISOString();

    return {
      account: {
        ...account,

        capabilities: [
          {
            id: 'account',
            availability: 'requires-authentication',
          },
          {
            id: 'plan',
            availability: 'requires-authentication',
          },
          {
            id: 'subscription',
            availability: 'requires-authentication',
          },
          {
            id: 'usage',
            availability: 'not-supported',
            description:
              'No supported public API currently exposes consumer ChatGPT usage.',
          },
          {
            id: 'quota',
            availability: 'not-supported',
          },
          {
            id: 'credits',
            availability: 'not-supported',
          },
          {
            id: 'reset-time',
            availability: 'not-supported',
          },
          {
            id: 'billing',
            availability: 'requires-authentication',
          },
        ],
      },

      subscription: {
        planName: account.plan,
        status: 'unknown',
        availability: 'requires-authentication',
      },

      quotas: [],

      retrievedAt,
    };
  }

  async disconnect(_account: ProviderAccount): Promise<void> {}
}
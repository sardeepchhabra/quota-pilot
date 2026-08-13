import type { Provider, ProviderAccount } from "../provider";
import type { ProviderSnapshot } from "../../domain/quota";

const mockAccount: ProviderAccount = {
  id: "mock-account-1",
  providerId: "mock",
  displayName: "Demo Account",
  plan: "Demo",
};

export class MockProvider implements Provider {
  readonly id = "mock";
  readonly name = "Mock Provider";

  async getAccounts(): Promise<ProviderAccount[]> {
    return [mockAccount];
  }

  async getSnapshot(account: ProviderAccount): Promise<ProviderSnapshot> {
    const retrievedAt = new Date().toISOString();

    return {
      account: {
        ...account,
        capabilities: [
          {
            id: "account",
            availability: "available",
          },
          {
            id: "plan",
            availability: "available",
          },
          {
            id: "subscription",
            availability: "available",
          },
          {
            id: "usage",
            availability: "available",
          },
          {
            id: "quota",
            availability: "available",
          },
          {
            id: "reset-time",
            availability: "available",
          },
          {
            id: "credits",
            availability: "not-supported",
          },
          {
            id: "billing",
            availability: "not-supported",
          },
        ],
      },

      subscription: {
        planName: "Demo",
        status: "active",
        billingPeriod: "monthly",
        renewsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        availability: "available",
      },

      quotas: [
        {
          id: "mock-3-hour-window",
          name: "Demo usage",
          unit: "messages",
          limit: 100,
          used: 27,
          remaining: 73,
          percentageUsed: 27,
          percentageRemaining: 73,
          resetsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          confidence: "provider-reported",
          availability: "available",
          retrievedAt,
        },
      ],

      credits: {
        availability: "not-supported",
        retrievedAt,
      },

      retrievedAt,
    };
  }

  async disconnect(_account: ProviderAccount): Promise<void> {}
}

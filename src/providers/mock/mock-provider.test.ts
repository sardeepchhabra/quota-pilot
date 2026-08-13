import { describe, expect, it } from 'vitest';
import { MockProvider } from './mock-provider';

describe('MockProvider', () => {
  it('returns an account', async () => {
    const provider = new MockProvider();

    const accounts = await provider.getAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerId).toBe('mock');
  });

  it('returns normalized quota information', async () => {
    const provider = new MockProvider();
    const [account] = await provider.getAccounts();

    const usage = await provider.getUsage(account);

    expect(usage.providerId).toBe('mock');
    expect(usage.quotas).toHaveLength(1);

    expect(usage.quotas[0].remaining).toBe(73);
    expect(usage.quotas[0].percentageRemaining).toBe(73);
    expect(usage.quotas[0].confidence).toBe('provider-reported');
  });
});
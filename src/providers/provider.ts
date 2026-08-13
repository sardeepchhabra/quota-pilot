import type { ProviderUsage } from '../domain/quota';

export interface ProviderAccount {
  id: string;
  providerId: string;
  displayName: string;
  plan?: string;
}

export interface Provider {
  readonly id: string;
  readonly name: string;

  getAccounts(): Promise<ProviderAccount[]>;

  getUsage(account: ProviderAccount): Promise<ProviderUsage>;

  disconnect(account: ProviderAccount): Promise<void>;
}
import type { ProviderCapability, ProviderSnapshot } from "../domain/quota";

export interface ProviderAccount {
  id: string;
  providerId: string;
  displayName: string;
  email?: string;
  plan?: string;
  capabilities: ProviderCapability[];
}

export interface Provider {
  readonly id: string;
  readonly name: string;

  getAccounts(): Promise<ProviderAccount[]>;

  getSnapshot(account: ProviderAccount): Promise<ProviderSnapshot>;

  disconnect(account: ProviderAccount): Promise<void>;
}

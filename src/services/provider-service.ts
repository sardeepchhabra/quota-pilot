import type { ProviderAccount } from "../providers/provider";
import type { ProviderSnapshot } from "../domain/quota";
import { ProviderRegistry } from "../providers/provider-registry";

export class ProviderService {
  private readonly registry: ProviderRegistry;

  constructor(registry: ProviderRegistry) {
    this.registry = registry;
  }

  async getAccounts(): Promise<ProviderAccount[]> {
    const accounts: ProviderAccount[] = [];

    for (const provider of this.registry.getAll()) {
      accounts.push(...(await provider.getAccounts()));
    }

    return accounts;
  }

  async getSnapshot(account: ProviderAccount): Promise<ProviderSnapshot> {
    const provider = this.registry.get(account.providerId);

    if (!provider) {
      throw new Error(`Provider not registered: ${account.providerId}`);
    }

    return provider.getSnapshot(account);
  }
}

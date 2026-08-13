import type { Provider } from './provider';

export class ProviderRegistry {
  private readonly providers = new Map<string, Provider>();

  register(provider: Provider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider already registered: ${provider.id}`);
    }

    this.providers.set(provider.id, provider);
  }

  get(providerId: string): Provider | undefined {
    return this.providers.get(providerId);
  }

  getAll(): Provider[] {
    return Array.from(this.providers.values());
  }
}
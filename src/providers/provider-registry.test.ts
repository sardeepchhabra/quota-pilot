import { describe, expect, it } from 'vitest';
import { ProviderRegistry } from './provider-registry';
import { MockProvider } from './mock/mock-provider';
import { ChatGPTProvider } from './chatgpt/chatgpt-provider';

describe('ProviderRegistry', () => {
  it('registers and retrieves providers', () => {
    const registry = new ProviderRegistry();
    const provider = new MockProvider();

    registry.register(provider);

    expect(registry.get('mock')).toBe(provider);
  });

  it('returns all registered providers', () => {
    const registry = new ProviderRegistry();

    registry.register(new MockProvider());
    registry.register(new ChatGPTProvider());

    expect(registry.getAll()).toHaveLength(2);
  });

  it('rejects duplicate providers', () => {
    const registry = new ProviderRegistry();

    registry.register(new MockProvider());

    expect(() => registry.register(new MockProvider())).toThrow(
      'Provider already registered: mock',
    );
  });
});
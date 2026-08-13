import { ChatGPTProvider } from './chatgpt/chatgpt-provider';
import { MockProvider } from './mock/mock-provider';
import { ProviderRegistry } from './provider-registry';

export function createProviderRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();

  registry.register(new MockProvider());
  registry.register(new ChatGPTProvider());

  return registry;
}
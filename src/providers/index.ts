import { ChatGPTProvider } from "./chatgpt/chatgpt-provider";
import { MockProvider } from "./mock/mock-provider";
import { ProviderRegistry } from "./provider-registry";
import { GeminiApiProvider } from "./gemini-api/gemini-api-provider";
import { GeminiApiClient } from "./gemini-api/gemini-api-client";

export function createProviderRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const allowLiveGemini =
    import.meta.env.MODE !== "test" &&
    typeof geminiApiKey === "string" &&
    geminiApiKey.trim().length > 0;

  registry.register(new MockProvider());
  registry.register(new ChatGPTProvider());

  if (allowLiveGemini) {
    registry.register(new GeminiApiProvider(new GeminiApiClient(geminiApiKey)));
  }

  return registry;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  category: "consumer" | "developer";

  liveUsageSupported: boolean;
  subscriptionTrackingSupported: boolean;

  description: string;
}

export const PROVIDER_CATALOG: ProviderDefinition[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "consumer",
    liveUsageSupported: false,
    subscriptionTrackingSupported: true,
    description:
      "Track ChatGPT subscription information locally. Live consumer usage is not currently exposed through an official API.",
  },

  {
    id: "gemini",
    name: "Gemini",
    category: "consumer",
    liveUsageSupported: false,
    subscriptionTrackingSupported: true,
    description: "Track Gemini subscription and usage where supported.",
  },

  {
    id: "claude",
    name: "Claude",
    category: "consumer",
    liveUsageSupported: false,
    subscriptionTrackingSupported: true,
    description: "Track Claude subscription and usage where supported.",
  },

  {
    id: "github",
    name: "GitHub Copilot",
    category: "developer",
    liveUsageSupported: true,
    subscriptionTrackingSupported: true,
    description: "Track GitHub Copilot usage and subscription information.",
  },

  {
    id: "openai-api",
    name: "OpenAI API",
    category: "developer",
    liveUsageSupported: true,
    subscriptionTrackingSupported: true,
    description: "Track OpenAI API usage and costs.",
  },
];

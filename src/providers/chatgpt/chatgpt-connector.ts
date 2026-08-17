import type { DataAvailability, SubscriptionInfo } from "../../domain/quota";

export interface ChatGPTAccountInfo {
  id: string;
  email?: string;
  displayName?: string;

  plan?: string;

  subscription?: SubscriptionInfo;

  availability: {
    account: DataAvailability;
    plan: DataAvailability;
    subscription: DataAvailability;
    usage: DataAvailability;
    quota: DataAvailability;
    resetTime: DataAvailability;
  };
}

export interface ChatGPTConnector {
  connect(): Promise<ChatGPTAccountInfo>;

  disconnect(): Promise<void>;

  getAccount(): Promise<ChatGPTAccountInfo>;

  getUsage(): Promise<unknown>;
}

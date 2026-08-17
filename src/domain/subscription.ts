export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "paused"
  | "unknown";

export type BillingCycle = "monthly" | "annual" | "custom" | "unknown";

export type SubscriptionSource = "provider" | "user";

export interface Subscription {
  id: string;
  providerId: string;

  planName: string;

  status: SubscriptionStatus;

  price?: number;
  currency?: string;

  billingCycle: BillingCycle;

  startedAt?: string;
  renewsAt?: string;
  expiresAt?: string;

  source: SubscriptionSource;

  lastUpdatedAt: string;
}

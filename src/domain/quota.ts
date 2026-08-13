export type QuotaUnit =
  | "messages"
  | "credits"
  | "tokens"
  | "requests"
  | "minutes"
  | "percentage"
  | "unknown";

export type DataConfidence =
  | "exact"
  | "provider-reported"
  | "locally-derived"
  | "estimated"
  | "unavailable";

export type DataAvailability =
  | "available"
  | "unavailable"
  | "not-supported"
  | "requires-authentication";

export interface QuotaWindow {
  id: string;
  name: string;

  unit: QuotaUnit;

  limit?: number;
  used?: number;
  remaining?: number;

  percentageUsed?: number;
  percentageRemaining?: number;

  windowStartedAt?: string;
  resetsAt?: string;

  confidence: DataConfidence;
  availability: DataAvailability;

  retrievedAt: string;
}

export interface SubscriptionInfo {
  planName?: string;
  status: "active" | "inactive" | "cancelled" | "unknown";

  startedAt?: string;
  renewsAt?: string;
  expiresAt?: string;

  billingPeriod?: "monthly" | "annual" | "unknown";

  availability: DataAvailability;
}

export interface CreditBalance {
  balance?: number;
  currency?: string;
  expiresAt?: string;

  availability: DataAvailability;
  retrievedAt: string;
}

export interface ProviderCapability {
  id:
    | "account"
    | "plan"
    | "subscription"
    | "usage"
    | "quota"
    | "credits"
    | "reset-time"
    | "billing";

  availability: DataAvailability;

  description?: string;
}

export interface ProviderAccount {
  id: string;
  providerId: string;
  displayName: string;

  email?: string;
  plan?: string;

  capabilities: ProviderCapability[];
}

export interface ProviderSnapshot {
  account: ProviderAccount;

  subscription?: SubscriptionInfo;

  quotas: QuotaWindow[];

  credits?: CreditBalance;

  retrievedAt: string;
}

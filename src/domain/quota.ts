export type QuotaUnit =
  | 'messages'
  | 'credits'
  | 'tokens'
  | 'requests'
  | 'minutes'
  | 'percentage'
  | 'unknown';

export type DataConfidence =
  | 'exact'
  | 'provider-reported'
  | 'locally-derived'
  | 'estimated'
  | 'unavailable';

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

  retrievedAt: string;
}

export interface ProviderUsage {
  providerId: string;
  accountId: string;
  plan?: string;

  quotas: QuotaWindow[];

  retrievedAt: string;
}
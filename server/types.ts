export interface UsageSentinelState {
  date: string;
  requestsToday: number;
  requestsMonth: number;
  minuteTimestamps: number[];
  circuitBreakerActive: boolean;
  circuitBreakerThresholdPercent: number; // e.g. 95% -> 1,425 calls
  autoThrottleEnabled: boolean;
}

export interface ServerAIAuditRecord {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  documentType: string;
  merchantName: string;
  ssmNumber?: string;
  category: string;
  statutorySection: string;
  claimableAmount: number;
  totalAmount: number;
  isTaxDeductible: boolean;
  confidenceScore: number;
  auditStatus: 'compliant' | 'warning' | 'flagged';
  aiModel: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  payloadSizeKb: number;
  abuseFlag: boolean;
  abuseReason?: string;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  clientIpOrSession: string;
  ruleCheckNote?: string;
  isAccurateByLHDN?: boolean;
  actionType?: 'scan' | 'copilot_chat';
  copilotQuestion?: string;
  copilotAnswerPreview?: string;
  persona?: string;
  adminVerifiedStatus: 'verified' | 'flagged' | 'pending';
}

export interface LHDNRegulationRule {
  id: string;
  title: string;
  category: string;
  statutorySection: string;
  maxLimit: number;
  description: string;
  isActive: boolean;
  lastUpdatedYear: number;
}

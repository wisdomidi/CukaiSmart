export type Persona = 'individual' | 'business';

export type TaxpayerCategory =
  | 'salaried_employee'
  | 'influencer_creator'
  | 'freelancer_consultant'
  | 'sole_proprietor'
  | 'sme_director'
  | 'partnership_partner';

export interface TaxpayerProfileDefinition {
  id: TaxpayerCategory;
  title: string;
  badge: string;
  defaultPersona: Persona;
  primaryForm: string;
  eFilingDeadline: string;
  governingStatute: string;
  description: string;
  keyDeductions: string[];
  auditFocusPoints: string[];
}

export type RegionalAuthority = 'MY' | 'SG' | 'ID';

export interface TaxBracket {
  id: string;
  min: number;
  max: number | null;
  rate: number; // e.g. 0.15 for 15%
  baseTax: number;
  description: string;
}

export interface RegionalTaxProfile {
  id: RegionalAuthority;
  country: string;
  name: string;
  authority: string;
  currency: string;
  symbol: string;
  formName: {
    individual: string;
    business: string;
  };
  statute: string;
  brackets: TaxBracket[];
  standardRelief: number;
}

export interface TaxRelief {
  id: string;
  category: 'lifestyle' | 'sports' | 'medical' | 'education' | 'retirement' | 'family' | 'green';
  name: string;
  section: string;
  maxLimit: number;
  claimedAmount: number;
  description: string;
  eligibleItems: string[];
  ineligibleItems: string[];
  urgencyDaysLeft?: number;
}

export interface BusinessDeductionCategory {
  id: string;
  name: string;
  section: string;
  deductionRate: number; // e.g. 1.0 for 100%, 0.5 for 50%
  description: string;
  statutoryRule: string;
  claimedAmount: number;
  isCapitalAllowance?: boolean;
  initialAllowanceRate?: number;
  annualAllowanceRate?: number;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  isClaimable: boolean;
  taxCode: string;
  statutorySection: string;
  reason: string;
  claimableAmount: number;
  categoryId?: string;
}

export interface LHDNValidationResult {
  isValidSSM: boolean;
  ssmNumber: string;
  isTaxYearMatch: boolean;
  exceedsHighValueMandate: boolean; // > RM 1,000
  taxpayerNamePresent: boolean;
  isDuplicate: boolean;
  duplicateHashMatchId?: string;
  auditStatus: 'compliant' | 'warning' | 'flagged';
  complianceScore: number; // 0 - 100
  flags: string[];
  recommendations: string[];
}

export interface ClarificationOption {
  label: string;
  description: string;
  isClaimable: boolean;
  statutorySection?: string;
  categoryName?: string;
  claimableMultiplier?: number; // e.g., 1.0 (100%), 0.5 (50%), 0.0 (0%)
  applicableItemIds?: string[];
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  context: string;
  options: ClarificationOption[];
  selectedOptionIndex?: number;
}

export interface ReceiptRecord {
  id: string;
  persona: Persona;
  merchantName: string;
  ssmNumber: string;
  tinNumber?: string;
  date: string;
  taxYear: number;
  totalAmount: number;
  claimableAmount: number;
  categoryId: string;
  categoryName: string;
  statutorySection: string;
  items: ReceiptItem[];
  imageUrl?: string;
  verificationHash: string; // SHA-256
  lhdnValidation: LHDNValidationResult;
  notes?: string;
  aiConfidence?: number; // e.g., 65 for 65%
  confidenceLevel?: 'high' | 'medium' | 'needs_clarification';
  clarificationQuestions?: ClarificationQuestion[];
  isUserVerified?: boolean;
  eInvoicingStatus?: {
    isCompliant: boolean;
    eInvoiceUUID?: string;
    verifiedAt?: string;
    msicCode?: string;
  };
  createdAt: string;
  retentionUntilYear: number; // Section 82A: Tax Year + 7 years
}

export interface PaydayAllocationAdvice {
  reliefId: string;
  reliefName: string;
  category: string;
  statutorySection: string;
  remainingCap: number;
  recommendedMonthly: number;
  annualTotal: number;
  taxSavingsCash: number;
  marginalRate: number;
  efficiencyRating: 'High' | 'Max' | 'Moderate';
  explanation: string;
}

export interface PaydayPlanResult {
  grossMonthlyIncome: number;
  annualGrossIncome: number;
  epfMonthly: number;
  annualEpf: number;
  monthlyDisposableSavings: number;
  estimatedMarginalRate: number;
  allocations: PaydayAllocationAdvice[];
  totalMonthlyAllocated: number;
  totalAnnualAllocated: number;
  totalAnnualTaxSaved: number;
  netEffectiveReliefIncrease: number;
  projectedTaxBeforeOptimization: number;
  projectedTaxAfterOptimization: number;
}

export interface TaxAgentVerification {
  isVerified: boolean;
  licenseNumber: string; // e.g. LHDN/TA/2026/8941
  agentName: string;
  firmName: string;
  firmSSM: string;
  verifiedAt?: string;
  validUntil?: string;
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  displayName: string;
  persona: Persona;
  role: 'admin' | 'user';
  documentsCount: number;
  totalClaimedAmount: number;
  aiScansUsed: number;
  aiScansLimit: number;
  status: 'active' | 'suspended';
  createdAt: string;
  lastActive: string;
}

export interface AIScanLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  documentType: string; // e.g. "Tax Invoice", "Cash Receipt", "Medical Bill", "EPF / Insurance Statement", etc.
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
  inputTokens?: number;
  outputTokens?: number;
  payloadSizeKb?: number;
  abuseFlag?: boolean;
  abuseReason?: string;
  riskScore?: 'LOW' | 'MEDIUM' | 'HIGH';
  clientIpOrSession?: string;
  ruleCheckNote: string;
  actionType?: 'scan' | 'copilot_chat';
  copilotQuestion?: string;
  copilotAnswerPreview?: string;
  persona?: string;
  adminVerifiedStatus?: 'verified' | 'flagged' | 'pending';
}

export interface GoogleFreeTierUsage {
  requestsToday: number;
  requestsDailyLimit: number; // Google Gemini Free Tier: 1,500 RPD
  requestsMinute: number;
  requestsMinuteLimit: number; // Google Gemini Free Tier: 15 RPM
  requestsMonth: number;
  requestsMonthLimit: number; // 45,000 / month
  dailyPercentage: number;
  minutePercentage: number;
  monthlyPercentage: number;
  alertLevel: 'safe' | 'caution_50' | 'warning_70' | 'critical_90' | 'exceeded_100';
  circuitBreakerActive: boolean;
  circuitBreakerThresholdPercent: number; // e.g. 95%
  autoThrottleEnabled: boolean;
  lastResetDate: string;
  estimatedCostSavedUsd: number;
}

export interface LHDNRegulationItem {
  id: string;
  title: string;
  category: string;
  statutorySection: string;
  maxLimit: number;
  description: string;
  isActive: boolean;
  lastUpdatedYear: number;
  eligibleItems?: string[];
  ineligibleItems?: string[];
}

export interface AIUsageAccounting {
  totalScans: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  estimatedCostMyr: number;
  avgLatencyMs: number;
  accuracyRate: number;
  remainingCredits: number;
}

export interface UserFeedbackRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  persona?: Persona;
  rating: number; // 1 to 5 stars
  type: 'bug_report' | 'feature_request' | 'tax_question' | 'general';
  category: 'scanner' | 'copilot' | 'vault' | 'calculator' | 'other';
  message: string;
  createdAt: string;
  status: 'new' | 'reviewed' | 'resolved';
}

export interface CrashLogRecord {
  id: string;
  errorMessage: string;
  errorName?: string;
  componentStack?: string;
  userId?: string;
  userEmail?: string;
  url?: string;
  persona?: Persona;
  createdAt: string;
  resolvedStatus?: 'unresolved' | 'investigating' | 'fixed';
}




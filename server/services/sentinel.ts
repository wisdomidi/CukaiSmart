import type { UsageSentinelState, ServerAIAuditRecord } from '../types.ts';

// =========================================================================
// GOOGLE GEMINI FREE USAGE SENTINEL & FINOPS COST CONTROLS
// =========================================================================
// Benchmark Free Tier Limits for Gemini:
// - 15 Requests Per Minute (RPM)
// - 1,500 Requests Per Day (RPD)
// - 45,000 Requests Per Month (~1.5k * 30 days)
export const GOOGLE_DAILY_FREE_LIMIT = 1500;
export const GOOGLE_RPM_FREE_LIMIT = 15;
export const GOOGLE_MONTHLY_FREE_LIMIT = 45000;

export const usageState: UsageSentinelState = {
  date: new Date().toISOString().split('T')[0],
  requestsToday: 0,
  requestsMonth: 0,
  minuteTimestamps: [],
  circuitBreakerActive: false,
  circuitBreakerThresholdPercent: 95,
  autoThrottleEnabled: true,
};

// Check and reset daily counter if date shifted
export function checkDailyRollover(): void {
  const today = new Date().toISOString().split('T')[0];
  if (usageState.date !== today) {
    console.log(`[Usage Sentinel] Daily rollover: Resetting today's count from ${usageState.requestsToday} to 0.`);
    usageState.date = today;
    usageState.requestsToday = 0;
    usageState.circuitBreakerActive = false;
  }
}

// Clean minute timestamps older than 60 seconds
export function cleanMinuteTimestamps(): number {
  const now = Date.now();
  usageState.minuteTimestamps = usageState.minuteTimestamps.filter((t) => now - t < 60000);
  return usageState.minuteTimestamps.length;
}

// Compute alert level: 50%, 70%, 90%
export function getAlertLevel(todayCount: number, dailyLimit: number): 'safe' | 'caution_50' | 'warning_70' | 'critical_90' | 'exceeded_100' {
  const pct = (todayCount / dailyLimit) * 100;
  if (pct >= 100) return 'exceeded_100';
  if (pct >= 90) return 'critical_90';
  if (pct >= 70) return 'warning_70';
  if (pct >= 50) return 'caution_50';
  return 'safe';
}

// User-level burst detection to prevent scraper abuse
const userRequestTimestamps = new Map<string, number[]>();

export function checkUserAbuse(userIdOrIp: string): { isAbusive: boolean; reason?: string } {
  const now = Date.now();
  let timestamps = userRequestTimestamps.get(userIdOrIp) || [];
  // Keep last 60 seconds
  timestamps = timestamps.filter((t) => now - t < 60000);
  timestamps.push(now);
  userRequestTimestamps.set(userIdOrIp, timestamps);

  // If a single user or IP triggers > 8 requests in 60 seconds, flag burst abuse
  if (timestamps.length > 8) {
    return {
      isAbusive: true,
      reason: `High-frequency burst rate detected (${timestamps.length} calls in 60s). Potential automated scraping.`,
    };
  }
  return { isAbusive: false };
}

// =========================================================================
// GUEST DAILY QUOTA TRACKING (MAX 3 SCANS & 5 COPILOT QUERIES PER DAY)
// =========================================================================
export const GUEST_DAILY_SCAN_LIMIT = 3;
export const GUEST_DAILY_COPILOT_LIMIT = 5;

interface GuestSessionCounter {
  date: string;
  scanCount: number;
  copilotQueryCount: number;
}

const guestSessionStore = new Map<string, GuestSessionCounter>();

export function checkAndIncrementGuestQuotaServer(
  sessionId: string,
  actionType: 'scan' | 'copilot_query'
): { allowed: boolean; remaining: number; limit: number; currentCount: number; reason?: string } {
  const today = new Date().toISOString().split('T')[0];
  let record = guestSessionStore.get(sessionId);

  if (!record || record.date !== today) {
    record = { date: today, scanCount: 0, copilotQueryCount: 0 };
  }

  const limit = actionType === 'scan' ? GUEST_DAILY_SCAN_LIMIT : GUEST_DAILY_COPILOT_LIMIT;
  const currentCount = actionType === 'scan' ? record.scanCount : record.copilotQueryCount;

  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      currentCount,
      reason: `Guest daily threshold reached (${limit} ${actionType === 'scan' ? 'document scans' : 'Copilot queries'} per day). Please sign in or create an account for full access.`,
    };
  }

  if (actionType === 'scan') {
    record.scanCount += 1;
  } else {
    record.copilotQueryCount += 1;
  }

  guestSessionStore.set(sessionId, record);

  const updatedCount = actionType === 'scan' ? record.scanCount : record.copilotQueryCount;
  return {
    allowed: true,
    remaining: limit - updatedCount,
    limit,
    currentCount: updatedCount,
  };
}

// =========================================================================
// AUDIT TRAIL LOGGING STORE
// =========================================================================
export const serverAIAuditLogs: ServerAIAuditRecord[] = [];

export function addAuditRecord(record: ServerAIAuditRecord): void {
  serverAIAuditLogs.unshift(record);
  if (serverAIAuditLogs.length > 500) {
    serverAIAuditLogs.pop(); // Keep rolling 500 records
  }
}


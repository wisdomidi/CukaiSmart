import { Router } from 'express';
import {
  usageState,
  GOOGLE_DAILY_FREE_LIMIT,
  GOOGLE_RPM_FREE_LIMIT,
  GOOGLE_MONTHLY_FREE_LIMIT,
  checkDailyRollover,
  cleanMinuteTimestamps,
  getAlertLevel,
  serverAIAuditLogs,
} from '../services/sentinel.ts';

export const adminRouter = Router();

// GET /api/admin/free-usage-stats
adminRouter.get('/free-usage-stats', (req, res) => {
  checkDailyRollover();
  const currentRPM = cleanMinuteTimestamps();
  const dailyPct = Number(((usageState.requestsToday / GOOGLE_DAILY_FREE_LIMIT) * 100).toFixed(1));
  const minutePct = Number(((currentRPM / GOOGLE_RPM_FREE_LIMIT) * 100).toFixed(1));
  const monthPct = Number(((usageState.requestsMonth / GOOGLE_MONTHLY_FREE_LIMIT) * 100).toFixed(1));

  // Compute estimated cost saved by staying inside Google's free tier
  const estimatedCostSavedUsd = Number((usageState.requestsToday * 0.0012).toFixed(3));

  res.json({
    requestsToday: usageState.requestsToday,
    requestsDailyLimit: GOOGLE_DAILY_FREE_LIMIT,
    requestsMinute: currentRPM,
    requestsMinuteLimit: GOOGLE_RPM_FREE_LIMIT,
    requestsMonth: usageState.requestsMonth,
    requestsMonthLimit: GOOGLE_MONTHLY_FREE_LIMIT,
    dailyPercentage: dailyPct,
    minutePercentage: minutePct,
    monthlyPercentage: monthPct,
    alertLevel: getAlertLevel(usageState.requestsToday, GOOGLE_DAILY_FREE_LIMIT),
    circuitBreakerActive: usageState.circuitBreakerActive,
    circuitBreakerThresholdPercent: usageState.circuitBreakerThresholdPercent,
    autoThrottleEnabled: usageState.autoThrottleEnabled,
    lastResetDate: usageState.date,
    estimatedCostSavedUsd,
  });
});

// POST /api/admin/circuit-breaker - Configure circuit breaker settings
adminRouter.post('/circuit-breaker', (req, res) => {
  const { autoThrottleEnabled, circuitBreakerThresholdPercent, resetTodayCounter } = req.body;

  if (typeof autoThrottleEnabled === 'boolean') {
    usageState.autoThrottleEnabled = autoThrottleEnabled;
  }
  if (typeof circuitBreakerThresholdPercent === 'number') {
    usageState.circuitBreakerThresholdPercent = Math.min(100, Math.max(50, circuitBreakerThresholdPercent));
  }
  if (resetTodayCounter === true) {
    usageState.requestsToday = 0;
    usageState.circuitBreakerActive = false;
  }

  // Update circuit breaker status
  const currentDailyPct = (usageState.requestsToday / GOOGLE_DAILY_FREE_LIMIT) * 100;
  usageState.circuitBreakerActive = usageState.autoThrottleEnabled && currentDailyPct >= usageState.circuitBreakerThresholdPercent;

  res.json({
    status: 'success',
    autoThrottleEnabled: usageState.autoThrottleEnabled,
    circuitBreakerThresholdPercent: usageState.circuitBreakerThresholdPercent,
    circuitBreakerActive: usageState.circuitBreakerActive,
    requestsToday: usageState.requestsToday,
  });
});

// POST /api/admin/simulate-usage - For testing 50%, 70%, 90% alerts and circuit breaker
adminRouter.post('/simulate-usage', (req, res) => {
  const { targetPercentage } = req.body;
  if (typeof targetPercentage === 'number') {
    usageState.requestsToday = Math.round((targetPercentage / 100) * GOOGLE_DAILY_FREE_LIMIT);
    const currentDailyPct = (usageState.requestsToday / GOOGLE_DAILY_FREE_LIMIT) * 100;
    usageState.circuitBreakerActive = usageState.autoThrottleEnabled && currentDailyPct >= usageState.circuitBreakerThresholdPercent;
    console.log(`[Usage Sentinel] Simulated usage: ${usageState.requestsToday}/${GOOGLE_DAILY_FREE_LIMIT} (${targetPercentage}%). Alert: ${getAlertLevel(usageState.requestsToday, GOOGLE_DAILY_FREE_LIMIT)}`);
  }
  res.json({
    status: 'success',
    requestsToday: usageState.requestsToday,
    dailyPercentage: ((usageState.requestsToday / GOOGLE_DAILY_FREE_LIMIT) * 100).toFixed(1),
    alertLevel: getAlertLevel(usageState.requestsToday, GOOGLE_DAILY_FREE_LIMIT),
    circuitBreakerActive: usageState.circuitBreakerActive,
  });
});

// GET /api/admin/ai-audit-trail - Retrieve complete AI API call audit trail
adminRouter.get('/ai-audit-trail', (req, res) => {
  const { limit = 100, documentType, userId, abuseOnly } = req.query;
  let filtered = [...serverAIAuditLogs];

  if (documentType) {
    filtered = filtered.filter((l) => l.documentType.toLowerCase().includes(String(documentType).toLowerCase()));
  }
  if (userId) {
    filtered = filtered.filter((l) => l.userId.toLowerCase().includes(String(userId).toLowerCase()) || l.userEmail.toLowerCase().includes(String(userId).toLowerCase()));
  }
  if (abuseOnly === 'true') {
    filtered = filtered.filter((l) => l.abuseFlag || l.riskScore === 'HIGH' || l.auditStatus === 'flagged');
  }

  const result = filtered.slice(0, Number(limit));
  res.json({
    totalLogs: serverAIAuditLogs.length,
    returnedCount: result.length,
    logs: result,
  });
});

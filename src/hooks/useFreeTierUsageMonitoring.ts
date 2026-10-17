import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleFreeTierUsage } from '../types/tax';
import { fetchGoogleFreeTierStats, simulateUsageLevel } from '../services/firebase';

export interface FreeTierToastNotification {
  id: string;
  threshold: 50 | 70 | 90 | 100;
  level: 'notice' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  callsCount: number;
  dailyLimit: number;
  percentage: number;
  actionLabel?: string;
  actionType?: 'view_sentinel' | 'trip_breaker' | 'dismiss';
}

interface UseFreeTierUsageOptions {
  pollingIntervalMs?: number;
  autoDismissDelayMs?: number; // 0 to disable auto-dismiss
  enabled?: boolean;
}

export function useFreeTierUsageMonitoring(options: UseFreeTierUsageOptions = {}) {
  const {
    pollingIntervalMs = 12000,
    autoDismissDelayMs = 9000,
    enabled = true,
  } = options;

  const [usage, setUsage] = useState<GoogleFreeTierUsage>({
    requestsToday: 0,
    requestsDailyLimit: 1500,
    requestsMinute: 0,
    requestsMinuteLimit: 15,
    requestsMonth: 0,
    requestsMonthLimit: 45000,
    dailyPercentage: 0,
    minutePercentage: 0,
    monthlyPercentage: 0,
    alertLevel: 'safe',
    circuitBreakerActive: false,
    circuitBreakerThresholdPercent: 95,
    autoThrottleEnabled: true,
    lastResetDate: new Date().toISOString().split('T')[0],
    estimatedCostSavedUsd: 0,
  });

  const [toasts, setToasts] = useState<FreeTierToastNotification[]>([]);
  const notifiedThresholdsRef = useRef<Set<number>>(new Set());

  // Initialize notified thresholds from sessionStorage to prevent spam across tab reloads
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('cukaismart_free_tier_notified_thresholds');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          notifiedThresholdsRef.current = new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read notified thresholds', e);
    }
  }, []);

  const saveNotifiedThresholds = (thresholds: Set<number>) => {
    try {
      sessionStorage.setItem(
        'cukaismart_free_tier_notified_thresholds',
        JSON.stringify(Array.from(thresholds))
      );
    } catch (e) {
      console.warn('Could not save notified thresholds', e);
    }
  };

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const triggerToast = useCallback(
    (threshold: 50 | 70 | 90 | 100, currentCalls: number, pct: number) => {
      const id = `toast-threshold-${threshold}-${Date.now()}`;
      let level: 'notice' | 'warning' | 'critical' = 'notice';
      let title = '';
      let message = '';

      if (threshold === 90 || threshold === 100) {
        level = 'critical';
        title = '🚨 CRITICAL: 90% Free Tier Threshold Alert!';
        message = `Google free tier calls have reached ${pct.toFixed(1)}% (${currentCalls} / 1,500 daily quota). The 95% zero-bill circuit breaker is primed to stop billable requests.`;
      } else if (threshold === 70) {
        level = 'warning';
        title = '⚠️ 70% Free Usage Quota Warning';
        message = `Daily AI usage has reached ${pct.toFixed(1)}% (${currentCalls} / 1,500 requests). Proactive rate controls are active to stay within free limits.`;
      } else {
        level = 'notice';
        title = 'ℹ️ 50% Free Usage Notice';
        message = `Daily AI usage has reached half capacity: ${pct.toFixed(1)}% (${currentCalls} / 1,500 calls). Platform operating comfortably with $0.00 costs.`;
      }

      const newToast: FreeTierToastNotification = {
        id,
        threshold,
        level,
        title,
        message,
        timestamp: new Date().toISOString(),
        callsCount: currentCalls,
        dailyLimit: 1500,
        percentage: pct,
        actionLabel: threshold >= 90 ? 'View FinOps Sentinel' : 'Inspect Usage',
        actionType: 'view_sentinel',
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts

      // Auto dismiss after timeout if configured
      if (autoDismissDelayMs > 0 && threshold < 90) {
        setTimeout(() => {
          dismissToast(id);
        }, autoDismissDelayMs);
      }
    },
    [autoDismissDelayMs, dismissToast]
  );

  const checkThresholdAlerts = useCallback(
    (stats: GoogleFreeTierUsage) => {
      const pct = stats.dailyPercentage;
      const calls = stats.requestsToday;
      const notified = notifiedThresholdsRef.current;

      // If counter was reset to 0, clear previously notified thresholds
      if (calls === 0) {
        notified.clear();
        saveNotifiedThresholds(notified);
        return;
      }

      // Check 90% threshold
      if (pct >= 90 && !notified.has(90)) {
        notified.add(90);
        notified.add(70);
        notified.add(50);
        saveNotifiedThresholds(notified);
        triggerToast(90, calls, pct);
      }
      // Check 70% threshold
      else if (pct >= 70 && !notified.has(70)) {
        notified.add(70);
        notified.add(50);
        saveNotifiedThresholds(notified);
        triggerToast(70, calls, pct);
      }
      // Check 50% threshold
      else if (pct >= 50 && !notified.has(50)) {
        notified.add(50);
        saveNotifiedThresholds(notified);
        triggerToast(50, calls, pct);
      }
    },
    [triggerToast]
  );

  const refreshUsage = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await fetchGoogleFreeTierStats();
      if (data) {
        setUsage(data);
        checkThresholdAlerts(data);
      }
    } catch (e) {
      console.warn('Error fetching free tier stats in hook:', e);
    }
  }, [enabled, checkThresholdAlerts]);

  // Polling loop
  useEffect(() => {
    if (!enabled) return;
    refreshUsage();
    const timer = setInterval(refreshUsage, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [enabled, pollingIntervalMs, refreshUsage]);

  // Simulate threshold helper
  const simulateAndNotify = useCallback(
    async (targetPct: number) => {
      try {
        const res = await simulateUsageLevel(targetPct);
        if (res) {
          // Force reset notified thresholds so the toast triggers reliably for testing
          if (targetPct === 0) {
            notifiedThresholdsRef.current.clear();
            saveNotifiedThresholds(notifiedThresholdsRef.current);
            setToasts([]);
          } else {
            notifiedThresholdsRef.current.delete(targetPct >= 90 ? 90 : targetPct >= 70 ? 70 : 50);
          }
          await refreshUsage();
        }
      } catch (err) {
        console.error('Error simulating threshold:', err);
      }
    },
    [refreshUsage]
  );

  return {
    usage,
    toasts,
    dismissToast,
    clearAllToasts,
    refreshUsage,
    simulateAndNotify,
  };
}

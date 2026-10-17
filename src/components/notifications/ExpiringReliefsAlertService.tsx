import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  Camera,
  Bell,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';
import { useLHDNPushNotifications } from '../../hooks/useLHDNPushNotifications';

interface ExpiringReliefsAlertServiceProps {
  onNavigateToScan?: () => void;
  onNavigateToOptimize?: () => void;
}

export const ExpiringReliefsAlertService: React.FC<ExpiringReliefsAlertServiceProps> = ({
  onNavigateToScan,
  onNavigateToOptimize,
}) => {
  const { activeTaxYear, personalReliefs, persona } = useTax();
  const { isSubscribed, toggleSubscription, triggerTestPushNotification } = useLHDNPushNotifications();

  const [isDismissed, setIsDismissed] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // Compute days remaining until Dec 31 of activeTaxYear (e.g., 31 Dec 2026)
  const today = new Date();
  const yearEndDeadline = new Date(activeTaxYear, 11, 31, 23, 59, 59);
  const diffMs = yearEndDeadline.getTime() - today.getTime();
  const daysUntilDeadline = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Identify reliefs nearing deadline with remaining unspent limit
  const expiringReliefs = personalReliefs
    .filter((r) => r.claimedAmount < r.maxLimit)
    .map((r) => {
      const remaining = r.maxLimit - r.claimedAmount;
      const percentUsed = Math.round((r.claimedAmount / r.maxLimit) * 100);
      const estCashBack = Math.round(remaining * 0.24); // Avg 24% tax rate
      return { ...r, remaining, percentUsed, estCashBack };
    })
    .sort((a, b) => b.remaining - a.remaining);

  const totalUnspentCap = expiringReliefs.reduce((sum, r) => sum + r.remaining, 0);
  const totalCashReforfeited = Math.round(totalUnspentCap * 0.24);

  if (isDismissed || expiringReliefs.length === 0) return null;

  const handlePushAlertClick = async () => {
    if (!isSubscribed) {
      await toggleSubscription();
    }
    const success = await triggerTestPushNotification(
      `Expiring Soon: YA ${activeTaxYear} Relief Alert`,
      `${daysUntilDeadline} days left to claim ${formatCurrency(totalUnspentCap)} in tax reliefs!`
    );
    if (success) {
      setNotificationStatus(`14-Day Service Worker Alert active for YA ${activeTaxYear} reliefs!`);
      setTimeout(() => setNotificationStatus(null), 4000);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden space-y-4 animate-fade-in">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/50">
            <AlertTriangle className="w-5 h-5 animate-pulse text-amber-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/25 text-amber-300 border border-amber-500/40">
                Expiring Soon Alert &bull; YA {activeTaxYear}
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{daysUntilDeadline} Days Left Until 31 Dec Cutoff</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              {expiringReliefs.length} Tax Relief Categories Have Unclaimed Caps ({formatCurrency(totalUnspentCap)} Left)
            </h3>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          title="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Explanation Banner in Simple English */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 relative z-10">
        <p className="font-semibold text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Why this matters for your bank account:</span>
        </p>
        <p className="text-slate-400 leading-relaxed">
          In Malaysia, tax reliefs expire on 31st December every year. Any eligible expenses (books, sports gear, medical checkups, EPF, SSPN education savings) made after Dec 31 cannot be claimed for Tax Year {activeTaxYear}. Maximizing these reliefs before deadline saves up to <strong className="text-emerald-400 font-mono">{formatCurrency(totalCashReforfeited)}</strong> in cash tax refunds!
        </p>
      </div>

      {/* Grid of Top 3 Expiring Relief Items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
        {expiringReliefs.slice(0, 3).map((r) => (
          <div
            key={r.id}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-amber-500/40 transition"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-mono">{r.section}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">
                  {r.percentUsed}% Claimed
                </span>
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1">{r.name}</h4>
            </div>

            <div className="flex items-end justify-between pt-1 border-t border-slate-900">
              <div>
                <span className="text-[10px] text-slate-500 block">Remaining Cap</span>
                <span className="text-xs font-mono font-black text-amber-400">
                  {formatCurrency(r.remaining)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Tax Refund</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  +{formatCurrency(r.estCashBack)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Controls */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          {onNavigateToScan && (
            <button
              onClick={onNavigateToScan}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/50 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Receipt to Claim Now</span>
            </button>
          )}

          <button
            onClick={handlePushAlertClick}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Enable Push Reminder</span>
          </button>
        </div>

        {onNavigateToOptimize && (
          <button
            onClick={onNavigateToOptimize}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Optimize Payday Savings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {notificationStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in relative z-10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationStatus}</span>
        </div>
      )}
    </div>
  );
};

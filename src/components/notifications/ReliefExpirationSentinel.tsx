import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Calendar,
  Sparkles,
  ChevronRight,
  Bell,
  CheckCircle2,
  DollarSign,
  Download,
  Flame,
  X,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';
import { useLHDNPushNotifications } from '../../hooks/useLHDNPushNotifications';

interface ReliefExpirationSentinelProps {
  onNavigateToOptimizer?: () => void;
  onNavigateToScan?: () => void;
}

export const ReliefExpirationSentinel: React.FC<ReliefExpirationSentinelProps> = ({
  onNavigateToOptimizer,
  onNavigateToScan,
}) => {
  const { activeTaxYear, personalReliefs, persona } = useTax();
  const { isSubscribed, toggleSubscription, triggerTestPushNotification } = useLHDNPushNotifications();

  const [isDismissed, setIsDismissed] = useState(false);
  const [reminderSetMessage, setReminderSetMessage] = useState<string | null>(null);

  // Expiration Target: 31st December of the active tax year (e.g., 31 Dec 2026)
  const expirationTargetDate = new Date(activeTaxYear, 11, 31, 23, 59, 59);

  // Time remaining calculation
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const now = new Date();
    const diff = expirationTargetDate.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = expirationTargetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeRemaining({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTaxYear]);

  // Unclaimed relief analysis
  const unspentReliefs = personalReliefs.filter((r) => r.claimedAmount < r.maxLimit);
  const totalUnspentCap = unspentReliefs.reduce((sum, r) => sum + (r.maxLimit - r.claimedAmount), 0);
  const estimatedTaxCashForfeited = Math.round(totalUnspentCap * 0.24); // Based on average 24% marginal rate

  // Key high-priority reliefs expiring
  const topExpiringReliefs = unspentReliefs
    .map((r) => ({
      ...r,
      remaining: r.maxLimit - r.claimedAmount,
      cashSavings: Math.round((r.maxLimit - r.claimedAmount) * 0.24),
    }))
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 4);

  // Generate .ics calendar download file
  const handleDownloadCalendarEvent = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CukaiSmart LHDN Tax Assistant//EN
BEGIN:VEVENT
UID:cukaisemart-relief-deadline-${activeTaxYear}@cukaismart.local
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${activeTaxYear}1231T090000Z
DTEND:${activeTaxYear}1231T180000Z
SUMMARY:🔥 LHDN Tax Relief Expiration Deadline (YA ${activeTaxYear})
DESCRIPTION:Last day to incur tax-deductible expenses (Lifestyle, Sports, Medical, SSPN, PRS, EV charging) for Tax Year ${activeTaxYear}. Check your CukaiSmart vault for missing receipts!
LOCATION:Malaysia
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:1 Week left to maximize LHDN Tax Reliefs for YA ${activeTaxYear}!
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LHDN_Relief_Deadline_YA${activeTaxYear}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setReminderSetMessage('ICS Calendar Event downloaded! Added 7-day pre-deadline alert to your calendar.');
    setTimeout(() => setReminderSetMessage(null), 4500);
  };

  const handleEnablePushAlert = async () => {
    if (!isSubscribed) {
      await toggleSubscription();
    }
    const success = await triggerTestPushNotification(
      `LHDN Relief Expiration Alert YA ${activeTaxYear}`,
      `31 December ${activeTaxYear}`
    );
    if (success) {
      setReminderSetMessage(`Relief Expiration Reminder activated! We will notify you before 31 Dec ${activeTaxYear}.`);
      setTimeout(() => setReminderSetMessage(null), 4500);
    }
  };

  if (isDismissed) return null;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl relative overflow-hidden space-y-4">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/50">
            <Flame className="w-6 h-6 animate-bounce text-amber-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Tax Year {activeTaxYear} Relief Expiration Sentinel
              </span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Strict Dec 31 Cutoff</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              Do not forfeit your <span className="text-amber-400">{formatCurrency(estimatedTaxCashForfeited)}</span> in cash tax refunds!
            </h3>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition shrink-0 cursor-pointer"
          title="Dismiss sentinel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live Countdown Clock Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-center">
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
            {timeRemaining.days}
          </div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 mt-0.5">Days Remaining</div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-center">
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
            {String(timeRemaining.hours).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 mt-0.5">Hours</div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-center">
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
            {String(timeRemaining.minutes).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 mt-0.5">Minutes</div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-center">
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
            {String(timeRemaining.seconds).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 mt-0.5">Seconds</div>
        </div>
      </div>

      {/* Expiry Warning Summary */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2 relative z-10">
        <div className="flex items-center justify-between font-bold">
          <span className="text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Statutory Rule: Section 46 ITA 1967</span>
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            Unclaimed Cap: <strong className="text-white">{formatCurrency(totalUnspentCap)}</strong>
          </span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Invoices and receipts must be dated on or before <strong className="text-white font-bold">31 December {activeTaxYear}</strong> to be eligible for deduction in YA {activeTaxYear}. Purchases made on or after 1 January {activeTaxYear + 1} will roll over to the next tax cycle.
        </p>
      </div>

      {/* Top Unclaimed Relief Categories Grid */}
      {topExpiringReliefs.length > 0 && (
        <div className="space-y-2 relative z-10">
          <div className="text-[11px] uppercase font-black text-slate-400 tracking-wider flex items-center justify-between">
            <span>High Priority Unclaimed Reliefs (Expiring Soon)</span>
            <span className="text-amber-400">Potential Refund Cash: {formatCurrency(estimatedTaxCashForfeited)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topExpiringReliefs.map((relief) => (
              <div
                key={relief.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-amber-500/40 transition flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-white line-clamp-1">{relief.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{relief.section}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-amber-400 font-mono">
                    {formatCurrency(relief.remaining)} left
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    +{formatCurrency(relief.cashSavings)} tax back
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Controls & Reminders */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnablePushAlert}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>Enable 1-Click Expiration Push Alert</span>
          </button>

          <button
            onClick={handleDownloadCalendarEvent}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Download .ics calendar file to add LHDN deadline reminder to Google Calendar / Outlook"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>.ICS Calendar File</span>
          </button>
        </div>

        {onNavigateToOptimizer && (
          <button
            onClick={onNavigateToOptimizer}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Optimize Payday Reliefs</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Feedback Toast */}
      {reminderSetMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in relative z-10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reminderSetMessage}</span>
        </div>
      )}
    </div>
  );
};

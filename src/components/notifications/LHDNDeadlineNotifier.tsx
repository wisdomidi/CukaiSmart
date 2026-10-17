import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  ExternalLink,
  Info,
  CheckCircle2,
  X,
  Building,
  User,
  ShieldAlert,
  Bell,
  BellRing,
  Send,
  Zap,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { useLHDNPushNotifications } from '../../hooks/useLHDNPushNotifications';

type ProfileType = 'BE' | 'B' | 'E' | 'C' | 'P';

interface FormDeadline {
  formCode: string;
  formName: string;
  taxpayerType: string;
  manualDeadlineMonthDay: string; // MM-DD
  eFilingDeadlineMonthDay: string; // MM-DD
  manualDateLabel: string;
  eFilingDateLabel: string;
  statutorySection: string;
  description: string;
  latePenaltyInfo: string;
}

const FORM_DEADLINES: Record<ProfileType, FormDeadline> = {
  BE: {
    formCode: 'Form BE / e-BE',
    formName: 'Salaried Individual Return (No Business Income)',
    taxpayerType: 'Employed Individuals & Executives',
    manualDeadlineMonthDay: '04-30',
    eFilingDeadlineMonthDay: '05-15',
    manualDateLabel: '30 April',
    eFilingDateLabel: '15 May',
    statutorySection: 'Section 77(1) Income Tax Act 1967',
    description: 'For individuals with employment, dividend, interest, or rental income (no business revenue).',
    latePenaltyInfo: '10% penalty on unpaid balance + potential Section 112(1) late submission penalty (RM 200 - RM 2,000 fine).',
  },
  B: {
    formCode: 'Form B / e-B',
    formName: 'Individual Return with Business Income',
    taxpayerType: 'Sole Proprietors, Freelancers & Partners',
    manualDeadlineMonthDay: '06-30',
    eFilingDeadlineMonthDay: '07-15',
    manualDateLabel: '30 June',
    eFilingDateLabel: '15 July',
    statutorySection: 'Section 77(1) Income Tax Act 1967',
    description: 'For self-employed individuals, freelancers, trade/professionals, and sole proprietorship owners.',
    latePenaltyInfo: '10% penalty on tax payable + 5% subsequent penalty after 60 days under Section 103(3).',
  },
  E: {
    formCode: 'Form E / e-E',
    formName: 'Employer Return on Remuneration & CP8D',
    taxpayerType: 'Employers & Business Owners',
    manualDeadlineMonthDay: '03-31',
    eFilingDeadlineMonthDay: '04-30',
    manualDateLabel: '31 March',
    eFilingDateLabel: '30 April',
    statutorySection: 'Section 83(1) Income Tax Act 1967',
    description: 'Mandatory annual employer declaration of employees, salaries, PCB/MTD deductions, and CP8D e-filing.',
    latePenaltyInfo: 'Failure to submit Form E is an offence under Section 120(1)(b) subject to RM 200 to RM 20,000 fine or imprisonment.',
  },
  C: {
    formCode: 'Form C / e-C',
    formName: 'Company Income Tax Return',
    taxpayerType: 'Sdn Bhd & Sendirian Berhad Companies',
    manualDeadlineMonthDay: '07-31',
    eFilingDeadlineMonthDay: '08-31',
    manualDateLabel: '7 Months from Financial Year Close',
    eFilingDateLabel: '7 Months + 1 Month Grace Period for e-C',
    statutorySection: 'Section 77A Income Tax Act 1967',
    description: 'Due within 7 months from the end of the accounting period governing the company financial year.',
    latePenaltyInfo: 'Section 112(3) penalty range from 20% to 35% of tax payable for late filing of corporate return.',
  },
  P: {
    formCode: 'Form P / e-P',
    formName: 'Partnership Income Return',
    taxpayerType: 'Partnerships & Joint Ventures',
    manualDeadlineMonthDay: '06-30',
    eFilingDeadlineMonthDay: '07-15',
    manualDateLabel: '30 June',
    eFilingDateLabel: '15 July',
    statutorySection: 'Section 86 Income Tax Act 1967',
    description: 'Annual declaration of partnership divisible income allocated to individual partners.',
    latePenaltyInfo: 'Offence under Section 120(1)(h) for precedent partner failing to lodge Form P.',
  },
};

export const LHDNDeadlineNotifier: React.FC = () => {
  const { persona, activeTaxYear } = useTax();
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    toggleSubscription,
    triggerTestPushNotification,
  } = useLHDNPushNotifications();

  // Selected profile type (auto-default to BE for individual, B for business)
  const [profileType, setProfileType] = useState<ProfileType>(() =>
    persona === 'business' ? 'B' : 'BE'
  );

  const [isDismissed, setIsDismissed] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Assessment year for submission is typically activeTaxYear + 1 (e.g., Tax Year 2026 filed in 2027)
  const filingYear = activeTaxYear + 1;
  const deadlineInfo = FORM_DEADLINES[profileType];

  // Calculate days remaining to official e-Filing deadline
  const calculateDaysRemaining = () => {
    const today = new Date();
    const [monthStr, dayStr] = deadlineInfo.eFilingDeadlineMonthDay.split('-');
    const eFilingDeadline = new Date(filingYear, parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));

    const diffTime = eFilingDeadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();

  const handleTestNotification = async () => {
    const success = await triggerTestPushNotification(
      deadlineInfo.formCode,
      `${deadlineInfo.eFilingDateLabel} ${filingYear}`
    );
    if (success) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 5000);
    }
  };

  if (isDismissed) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-xl relative overflow-hidden animate-fade-in space-y-3">
      {/* Background Accent glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                LHDN Filing Deadline &bull; YA {activeTaxYear} (Filing in {filingYear})
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {deadlineInfo.statutorySection}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
              Official Filing Target: <span className="text-amber-400">{deadlineInfo.eFilingDateLabel} {filingYear}</span>
            </h3>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <span className="text-[11px] text-slate-400 px-2 font-semibold shrink-0">Your Profile Form:</span>
        {(['BE', 'B', 'E', 'C', 'P'] as ProfileType[]).map((type) => {
          const formLabels: Record<ProfileType, { badge: string; label: string }> = {
            BE: { badge: 'Form BE', label: 'Individual' },
            B: { badge: 'Form B', label: 'Business / SME' },
            E: { badge: 'Form E', label: 'Employer' },
            C: { badge: 'Form C', label: 'Company' },
            P: { badge: 'Form P', label: 'Partnership' },
          };
          const info = formLabels[type];
          const isSelected = profileType === type;

          return (
            <button
              key={type}
              onClick={() => setProfileType(type)}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title={`${FORM_DEADLINES[type].formName} (${FORM_DEADLINES[type].statutorySection})`}
            >
              <span>{info.badge}</span>
              <span className={`text-[10px] font-normal ${isSelected ? 'text-slate-900/80 font-medium' : 'text-slate-500'}`}>
                &bull; {info.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Service Worker 14-Day Recurring Push Notification Control Bar */}
      <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">
                14-Day Service Worker Push Alerts
              </span>
              {pushSubscribed ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Service Worker dispatches push notifications 14 days before deadline even when PWA is closed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSubscription}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition ${
              pushSubscribed
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{pushSubscribed ? 'Subscribed (14-Day SW)' : 'Enable 14-Day SW Push'}</span>
          </button>

          <button
            onClick={handleTestNotification}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Fire an immediate push alert via Service Worker API"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>{testNotificationSent ? 'Alert Dispatched!' : 'Send Instant Alert'}</span>
          </button>
        </div>
      </div>

      {/* Description & Key Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400">Taxpayer Type</span>
          <p className="text-xs font-semibold text-white mt-0.5">{deadlineInfo.taxpayerType}</p>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{deadlineInfo.description}</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Manual Paper Submission</span>
            <p className="text-sm font-black text-slate-200 mt-0.5">{deadlineInfo.manualDateLabel} {filingYear}</p>
            <span className="text-[10px] text-slate-500">Postmark / LHDN counter</span>
          </div>
          <Calendar className="w-5 h-5 text-slate-500 shrink-0" />
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-300">e-Filing Grace Period (MyTax)</span>
            <p className="text-sm font-black text-amber-400 mt-0.5">{deadlineInfo.eFilingDateLabel} {filingYear}</p>
            <span className="text-[10px] text-emerald-400 font-medium">+15 Days e-Filing Extension</span>
          </div>
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
        </div>
      </div>

      {/* Countdown & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300">
            {daysRemaining > 0 ? (
              <>
                Target date is in <strong className="text-amber-400 font-mono text-sm">{daysRemaining} days</strong>. Ensure all receipt proofs are saved in your vault!
              </>
            ) : (
              <>
                Filing period for YA {activeTaxYear} is approaching or active. Keep all documents ready in your vault.
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPenaltyModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Late Penalty Rules
          </button>
          <a
            href="https://mytax.hasil.gov.my"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
          >
            <span>Launch LHDN MyTax</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Penalty Modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/50 p-6 shadow-2xl relative text-white space-y-4">
            <button
              onClick={() => setShowPenaltyModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">LHDN Late Filing Penalties</h4>
                <p className="text-xs text-amber-400">{deadlineInfo.formCode} Regulations</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 leading-relaxed">
              <p className="text-slate-300 font-semibold">{deadlineInfo.latePenaltyInfo}</p>
              <p className="text-slate-400">
                <strong>Section 112(1) ITA 1967:</strong> Any person who fails to submit a return without reasonable excuse shall be guilty of an offence and liable to a fine between RM 200 and RM 2,000 or imprisonment not exceeding 6 months, or both.
              </p>
            </div>

            <button
              onClick={() => setShowPenaltyModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

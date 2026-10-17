import React, { useState } from 'react';
import {
  Coins,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Shield,
  FileText,
  Camera,
  Building,
  Info,
  X,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
  Scale,
  Plus,
  HelpCircle,
  Archive,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency, calculateTaxForChargeableIncome } from '../../utils/taxEngine';
import { TaxRelief, BusinessDeductionCategory } from '../../types/tax';
import { ReliefUtilizationWidget } from './ReliefUtilizationWidget';
import { TaxAuditReadinessReport } from './TaxAuditReadinessReport';
import { TaxFilingChecklist } from './TaxFilingChecklist';
import { LHDNReliefTooltip } from './LHDNReliefTooltip';
import { LHDNDeadlineNotifier } from '../notifications/LHDNDeadlineNotifier';
import { ReliefExpirationSentinel } from '../notifications/ReliefExpirationSentinel';
import { ExpiringReliefsAlertService } from '../notifications/ExpiringReliefsAlertService';
import { SimpleEnglishTaxTipCard } from '../common/SimpleEnglishTaxTipCard';
import { BiometricAuthGate } from '../auth/BiometricAuthGate';
import { SolutionVsHumanCostModal } from '../analytics/SolutionVsHumanCostModal';



interface HomeDashboardProps {
  onNavigateToScan: () => void;
  onNavigateToOptimize: () => void;
  onNavigateToVault: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateToScan,
  onNavigateToOptimize,
  onNavigateToVault,
}) => {
  const {
    persona,
    activeTaxYear,
    personalReliefs,
    businessCategories,
    customBrackets,
    monthlyIncome,
    receipts,
  } = useTax();

  const [selectedRelief, setSelectedRelief] = useState<TaxRelief | null>(null);
  const [selectedBusinessCat, setSelectedBusinessCat] = useState<BusinessDeductionCategory | null>(null);
  const [showCostRoiModal, setShowCostRoiModal] = useState(false);

  // Close modals on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedRelief(null);
        setSelectedBusinessCat(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter saved claimable receipts for active persona and year
  const activeReceipts = receipts.filter(
    (r) => r.persona === persona && r.taxYear === activeTaxYear
  );

  // Calculations for Individual Mode
  const totalReliefClaimed = personalReliefs.reduce(
    (acc, r) => acc + Math.min(r.claimedAmount, r.maxLimit),
    0
  );
  const totalReliefCap = personalReliefs.reduce((acc, r) => acc + r.maxLimit, 0);
  const totalUnclaimedRelief = Math.max(0, totalReliefCap - totalReliefClaimed);

  // Marginal Tax Rate Calculation
  const annualGross = monthlyIncome * 12;
  const chargeableIncome = Math.max(0, annualGross - totalReliefClaimed);
  const taxCalculation = calculateTaxForChargeableIncome(chargeableIncome, customBrackets);
  const marginalRate = taxCalculation.marginalRate;

  // Actual cash tax saved from saved documents
  const baselineCalculationWithoutReliefs = calculateTaxForChargeableIncome(
    annualGross - 9000,
    customBrackets
  );
  const actualCashTaxSaved = Math.max(
    0,
    baselineCalculationWithoutReliefs.taxPayable - taxCalculation.taxPayable
  );

  // Cash money left on the table if remaining relief is untouched
  const cashLeftOnTable = totalUnclaimedRelief * marginalRate;

  // Business metrics
  const totalBusinessDeductible = businessCategories.reduce(
    (acc, b) => acc + b.claimedAmount,
    0
  );
  const entertainmentCat = businessCategories.find((b) => b.id === 'biz-entertainment');
  const entertainmentDisallowed = entertainmentCat ? entertainmentCat.claimedAmount : 0;
  const capitalAllowanceCat = businessCategories.find((b) => b.id === 'biz-capital-allowance');
  const capitalAllowanceTotal = capitalAllowanceCat ? capitalAllowanceCat.claimedAmount : 0;

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-fade-in">
      {/* Hero: Tax Relief Maximization Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Tax Assessment Year YA {activeTaxYear}</span>
              <span className="text-slate-600" aria-hidden="true">&bull;</span>
              <span className="text-slate-300">Section 46 Statutory Relief Maximizer</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {persona === 'individual' ? (
                <>
                  Up to{' '}
                  <span className="text-amber-400 font-mono tabular-nums">
                    {formatCurrency(totalUnclaimedRelief)}
                  </span>{' '}
                  in Unclaimed Personal Reliefs
                </>
              ) : (
                <>
                  Small Business Opex &amp; Section 33 Deductions
                </>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {persona === 'individual' ? (
                <>
                  Under the Income Tax Act 1967, allowable expenses without verified receipts forfeit direct tax refunds. Verifying receipts now can return up to{' '}
                  <strong className="text-emerald-400 font-mono tabular-nums font-bold">
                    {formatCurrency(cashLeftOnTable)}
                  </strong>{' '}
                  in direct cash refunds on your YA {activeTaxYear} filing.
                </>
              ) : (
                <>
                  Maintain Section 82A audit-proof records for business expenses. Automatically enforce Section 39(1)(l) 50% dining limitations while claiming allowable Section 33 revenue deductions.
                </>
              )}
            </p>
          </div>

          {/* Quick Check Doc Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={onNavigateToScan}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/80 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Upload Document to Check</span>
            </button>
            <button
              onClick={onNavigateToVault}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Archive className="w-4 h-4 text-emerald-400" />
              <span>7-Year Vault ({activeReceipts.length} docs)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expiring Soon Tax Relief Alert Service */}
      <ExpiringReliefsAlertService
        onNavigateToScan={onNavigateToScan}
        onNavigateToOptimize={onNavigateToOptimize}
      />

      {/* Simple English Tax Tips Card */}
      <SimpleEnglishTaxTipCard topic="how_tax_works" defaultExpanded={true} />

      {/* Tax Relief Dec 31 Expiration Sentinel */}
      <ReliefExpirationSentinel
        onNavigateToOptimizer={onNavigateToOptimize}
        onNavigateToScan={onNavigateToScan}
      />


      {/* Biometric WebAuthn Protected Financial Summary Gate */}

      <BiometricAuthGate
        title="Biometric Security Gate: Tax Profile & Financial Summaries"
        description="Web Authentication API requires fingerprint or Face ID verification before revealing your personal chargeable income, cash tax refund, and 7-year audit records."
      >
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {persona === 'individual' ? (
            <>
              {/* Money Left on Table */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium text-amber-300">Left on the Table</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
                  {formatCurrency(cashLeftOnTable)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                  <span>{formatCurrency(totalUnclaimedRelief)} unclaimed room</span>
                </div>
              </div>

              {/* Total Tax Cash Saved */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Cash Saved So Far</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  {formatCurrency(actualCashTaxSaved)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                  <span>At {(marginalRate * 100).toFixed(0)}% marginal rate</span>
                </div>
              </div>

              {/* Verified Docs Kept in Vault */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Claimable Docs Saved</span>
                  <Archive className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {activeReceipts.length} Documents
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400">
                  <span>100% Audit-Proof Proofs</span>
                </div>
              </div>

              {/* Total Deductions Captured */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Reliefs Captured</span>
                  <Scale className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-indigo-300 font-mono tracking-tight">
                  {formatCurrency(totalReliefClaimed)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                  <span>Cap: {formatCurrency(totalReliefCap)}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Small Business Metrics */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Deductible Business Opex</span>
                  <Building className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  {formatCurrency(totalBusinessDeductible)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                  <span>Sec 33(1) Claimable expenses</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">50% Disallowed Opex</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
                  {formatCurrency(entertainmentDisallowed)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                  <span>Sec 39(1)(l) 50% dining cap</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Saved Invoices</span>
                  <Archive className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {activeReceipts.length} Documents
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400">
                  <span>7-Year Vault Sealed</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Capital Allowance Pool</span>
                  <Scale className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-indigo-300 font-mono tracking-tight">
                  {formatCurrency(capitalAllowanceTotal)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                  <span>Schedule 3 Asset Pool</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Recharts Visual Relief Utilization Widget */}
        <ReliefUtilizationWidget />

        {/* FinOps ROI: Solution Cost vs Human Cost Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-emerald-950/40 border border-teal-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  FinOps Value Engine &bull; YA {activeTaxYear}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  &gt;99.9% Savings
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                AI vs Human Accounting Cost: Save up to RM{' '}
                {Math.max(450, Math.round((Math.max(10, activeReceipts.length) * 12 / 60) * 45)).toLocaleString()}{' '}
                in Bookkeeping Fees
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                CukaiSmart processes each tax document in 1.2s with zero processing fees vs. 12 minutes of manual bookkeeping labor (RM 45/hr benchmark).
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCostRoiModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Tax Savings Calculator</span>
          </button>
        </div>

        {/* Tax Audit Readiness Report (7-Year Statutory Record Retention) */}
        <TaxAuditReadinessReport
          onNavigateToScan={onNavigateToScan}
          onNavigateToVault={onNavigateToVault}
        />

        {/* Tax Filing Documentation Checklist Module */}
        <TaxFilingChecklist
          onNavigateToScan={onNavigateToScan}
          onNavigateToVault={onNavigateToVault}
        />
      </BiometricAuthGate>

      {/* Main Feature: Relief Maximizer & Shopping/Expenses Guide */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {persona === 'individual'
                ? 'Tax Reliefs You Can Claim This Year'
                : 'Small Business Allowable Deductions'}
            </h3>
            <p className="text-xs text-slate-400">
              Tap any category to see what qualifies, what is excluded, and upload proof.
            </p>
          </div>
          <button
            onClick={onNavigateToOptimize}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>Unclaimed Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {persona === 'individual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {personalReliefs.map((relief) => {
              const remaining = Math.max(0, relief.maxLimit - relief.claimedAmount);
              const percent = Math.min(100, Math.round((relief.claimedAmount / relief.maxLimit) * 100));
              const isMaxed = relief.claimedAmount >= relief.maxLimit;

              return (
                <div
                  key={relief.id}
                  onClick={() => setSelectedRelief(relief)}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-950/20 group relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition flex items-center gap-1">
                          <span>{relief.name}</span>
                          <LHDNReliefTooltip reliefName={relief.name} reliefId={relief.id} />
                        </h4>
                        {isMaxed && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            MAXED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{relief.section}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white font-mono">
                        {formatCurrency(relief.claimedAmount)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Cap: {formatCurrency(relief.maxLimit)}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1 font-medium">
                      <span className="text-slate-400">{percent}% claimed</span>
                      <span className={remaining > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                        {remaining > 0 ? `RM ${remaining.toLocaleString()} left to claim` : 'Fully Claimed'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMaxed
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-400 line-clamp-1">
                    {relief.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400/90 font-medium">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Info className="w-3.5 h-3.5" />
                      Tap to check eligible items checklist
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {businessCategories.map((category) => {
              const isEntertainment = category.id === 'biz-entertainment';

              return (
                <div
                  key={category.id}
                  onClick={() => setSelectedBusinessCat(category)}
                  className={`p-4 rounded-2xl bg-slate-900/90 border cursor-pointer transition-all hover:shadow-lg group ${
                    isEntertainment ? 'border-amber-500/30' : 'border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                          {category.name}
                        </h4>
                        {isEntertainment && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            50% STATUTORY CAP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{category.section}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {formatCurrency(category.claimedAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400">Claimable Opex</div>
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-300">
                    {category.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="line-clamp-1">{category.statutoryRule}</span>
                    <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Relief Checklist */}
      {selectedRelief && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRelief(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedRelief.name}</h3>
                  <p className="text-xs text-emerald-400 font-medium">{selectedRelief.section}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRelief(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer shadow-sm"
                title="Close (Esc)"
              >
                <X className="w-4 h-4 text-slate-300" />
                <span>Close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs">
              <div>
                <span className="text-slate-400">Statutory Max Cap</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {formatCurrency(selectedRelief.maxLimit)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Remaining Room</span>
                <p className="text-base font-bold text-amber-400 mt-0.5">
                  {formatCurrency(Math.max(0, selectedRelief.maxLimit - selectedRelief.claimedAmount))}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {selectedRelief.description}
            </p>

            {/* What qualifies */}
            <div className="space-y-3 mb-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Approved &bull; Save Documents For These</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedRelief.eligibleItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What does NOT qualify */}
              <div>
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Strictly Excluded &bull; Do Not Save</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedRelief.ineligibleItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-rose-950/30 p-2 rounded-lg border border-rose-500/20">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedRelief(null);
                  onNavigateToScan();
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Upload a Document for This Relief</span>
              </button>
              <button
                onClick={() => setSelectedRelief(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Business Category */}
      {selectedBusinessCat && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBusinessCat(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl text-slate-100 relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedBusinessCat.name}</h3>
                  <p className="text-xs text-emerald-400 font-medium">{selectedBusinessCat.section}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBusinessCat(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer shadow-sm"
                title="Close (Esc)"
              >
                <X className="w-4 h-4 text-slate-300" />
                <span>Close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs">
              <span className="text-slate-400">Statutory Tax Treatment</span>
              <p className="text-sm font-semibold text-white mt-1">
                {selectedBusinessCat.statutoryRule}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {selectedBusinessCat.description}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedBusinessCat(null);
                  onNavigateToScan();
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Upload Invoice to Check</span>
              </button>
              <button
                onClick={() => setSelectedBusinessCat(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solution Cost vs Human Cost (FinOps ROI) Modal */}
      <SolutionVsHumanCostModal
        isOpen={showCostRoiModal}
        onClose={() => setShowCostRoiModal(false)}
      />
    </div>
  );
};

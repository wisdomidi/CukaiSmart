import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  FileText,
  Upload,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';
import { ReceiptRecord } from '../../types/tax';
import { export7YearAuditRecordsToPDF } from '../../utils/pdfExport';
import { AuditSimulatorModal } from './AuditSimulatorModal';

interface TaxAuditReadinessReportProps {
  onNavigateToScan: () => void;
  onNavigateToVault: () => void;
  onClose?: () => void;
}

export const TaxAuditReadinessReport: React.FC<TaxAuditReadinessReportProps> = ({
  onNavigateToScan,
  onNavigateToVault,
  onClose,
}) => {
  const { activeTaxYear, personalReliefs, receipts, persona, currentUser } = useTax();

  const [expandedYear, setExpandedYear] = useState<number | null>(activeTaxYear);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExplanationModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // LHDN Section 82A requires 7 years of record retention
  const last7Years = Array.from({ length: 7 }, (_, i) => activeTaxYear - i);

  // Calculate audit readiness metrics across last 7 years
  const yearSummaries = last7Years.map((year) => {
    const yearReceipts = receipts.filter(
      (r) => r.taxYear === year && (persona === 'business' ? r.persona === 'business' : r.persona === 'individual')
    );

    // Sum of verified receipt amounts in vault for this year
    const totalReceiptsAmount = yearReceipts.reduce((acc, r) => acc + r.claimableAmount, 0);

    let totalClaimedRelief = 0;
    if (year === activeTaxYear) {
      totalClaimedRelief = personalReliefs.reduce((acc, r) => acc + Math.min(r.claimedAmount, r.maxLimit), 0);
    } else {
      totalClaimedRelief = totalReceiptsAmount;
    }

    const missingAmount = Math.max(0, totalClaimedRelief - totalReceiptsAmount);
    const receiptCount = yearReceipts.length;
    
    // Calculate readiness percentage for this year
    let readinessPercent = 100;
    if (totalClaimedRelief > 0) {
      readinessPercent = Math.min(100, Math.round((totalReceiptsAmount / totalClaimedRelief) * 100));
    }

    // Determine missing document flags by category
    const missingCategories: Array<{
      categoryName: string;
      claimed: number;
      documented: number;
      gap: number;
    }> = [];

    if (year === activeTaxYear) {
      personalReliefs.forEach((relief) => {
        if (relief.claimedAmount > 0) {
          const categoryReceipts = yearReceipts.filter(
            (r) => r.categoryId === relief.id || r.categoryName?.toLowerCase().includes(relief.category.toLowerCase())
          );
          const categoryDocTotal = categoryReceipts.reduce((acc, r) => acc + r.claimableAmount, 0);
          const gap = Math.max(0, relief.claimedAmount - categoryDocTotal);
          if (gap > 0 || categoryReceipts.length === 0) {
            missingCategories.push({
              categoryName: relief.name,
              claimed: relief.claimedAmount,
              documented: categoryDocTotal,
              gap: gap > 0 ? gap : relief.claimedAmount,
            });
          }
        }
      });
    }

    return {
      year,
      totalClaimedRelief,
      totalReceiptsAmount,
      missingAmount,
      receiptCount,
      readinessPercent,
      missingCategories,
      isCompliant: missingAmount === 0 && receiptCount > 0,
    };
  });

  // Overall 7-year totals
  const grandTotalClaimed = yearSummaries.reduce((acc, y) => acc + y.totalClaimedRelief, 0);
  const grandTotalDocumented = yearSummaries.reduce((acc, y) => acc + y.totalReceiptsAmount, 0);
  const grandTotalMissing = Math.max(0, grandTotalClaimed - grandTotalDocumented);
  const grandTotalReceiptsCount = yearSummaries.reduce((acc, y) => acc + y.receiptCount, 0);

  const overallReadinessScore = grandTotalClaimed > 0 
    ? Math.min(100, Math.round((grandTotalDocumented / grandTotalClaimed) * 100))
    : 100;

  // Determine risk badge color
  const getRiskColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', label: 'AUDIT READY (LOW RISK)' };
    if (score >= 60) return { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', label: 'MODERATE RISK (MISSING PROOF)' };
    return { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400', label: 'HIGH RISK (AUDIT PENALTY EXPOSURE)' };
  };

  const riskStatus = getRiskColor(overallReadinessScore);

  const handleExportAuditDossier = () => {
    const dossier = {
      title: 'LHDN 7-Year Tax Audit Defense Readiness Report',
      statutoryAuthority: 'Section 82A Income Tax Act 1967 (Malaysia)',
      generatedAt: new Date().toISOString(),
      activeTaxYear,
      persona,
      overallReadinessScore: `${overallReadinessScore}%`,
      summary: {
        grandTotalClaimed: formatCurrency(grandTotalClaimed),
        grandTotalDocumented: formatCurrency(grandTotalDocumented),
        grandTotalMissingProofGap: formatCurrency(grandTotalMissing),
        totalReceiptsStored: grandTotalReceiptsCount,
      },
      yearlyBreakdown: yearSummaries,
    };

    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LHDN_Tax_Audit_Readiness_Report_7Years_${activeTaxYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              LHDN 7-Year Tax Audit Readiness Report
            </h3>
            <button
              onClick={() => setShowExplanationModal(true)}
              className="text-slate-400 hover:text-slate-200 transition"
              title="What is the 7-Year Rule?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Mandatory Section 82A ITA 1967 record retention window ({activeTaxYear - 6} &ndash; {activeTaxYear}). Tracks missing invoices &amp; receipt gaps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              export7YearAuditRecordsToPDF({
                receipts,
                taxYear: activeTaxYear,
                userEmail: currentUser?.email || 'Registered Taxpayer',
                userName: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Taxpayer'),
                persona,
                reliefs: personalReliefs,
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md transition"
            title="Export official 7-year PDF audit pack for LHDN submission"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download LHDN PDF</span>
          </button>
          <button
            onClick={() => setShowSimulatorModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hover:border-amber-400 text-xs font-bold text-amber-300 shadow-md transition cursor-pointer"
            title="Pre-audit compliance check & Section 113 penalty exposure analysis with Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pre-Audit Risk Check</span>
          </button>
          <button
            onClick={handleExportAuditDossier}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>JSON Dossier</span>
          </button>
          <button
            onClick={onNavigateToScan}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>Upload Missing Docs</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close Report"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Readiness Score Gauge Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Readiness Meter */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Audit Readiness Score</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskStatus.bg} ${riskStatus.border} ${riskStatus.text} border`}>
              {overallReadinessScore}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-white font-mono">
              {overallReadinessScore}%
            </div>
            <p className={`text-[11px] font-semibold ${riskStatus.text}`}>
              {riskStatus.label}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallReadinessScore >= 90
                  ? 'bg-emerald-500'
                  : overallReadinessScore >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overallReadinessScore}%` }}
            />
          </div>
        </div>

        {/* Total Claimed 7 Years */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="text-xs font-medium text-slate-400">7-Year Claimed Reliefs</span>
          <div className="text-xl font-bold text-white font-mono">
            {formatCurrency(grandTotalClaimed)}
          </div>
          <p className="text-[11px] text-slate-400">
            Total tax deductions submitted to LHDN across 7 years.
          </p>
        </div>

        {/* Total Documented */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="text-xs font-medium text-slate-400">Verified Receipt Proof</span>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {formatCurrency(grandTotalDocumented)}
          </div>
          <p className="text-[11px] text-slate-400">
            {grandTotalReceiptsCount} valid receipts/invoices stored in Vault.
          </p>
        </div>

        {/* Missing Proof Gap */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="text-xs font-medium text-slate-400">Missing Document Gap</span>
          <div className={`text-xl font-bold font-mono ${grandTotalMissing > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatCurrency(grandTotalMissing)}
          </div>
          <p className="text-[11px] text-slate-400">
            {grandTotalMissing > 0 ? 'Unsubstantiated claims at risk of audit disallowance.' : '100% receipt proof backed!'}
          </p>
        </div>
      </div>

      {/* 7-Year Breakdown Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>7-Year Statutory Record Ledger</span>
          </h4>
          <button
            onClick={onNavigateToVault}
            className="text-xs font-medium text-emerald-400 hover:underline"
          >
            Manage Document Vault &rarr;
          </button>
        </div>

        <div className="space-y-2">
          {yearSummaries.map((summary) => {
            const isExpanded = expandedYear === summary.year;

            return (
              <div
                key={summary.year}
                className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition"
              >
                {/* Year Header Row */}
                <button
                  onClick={() => setExpandedYear(isExpanded ? null : summary.year)}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-800/40 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-bold text-white font-mono">
                      YA {summary.year}
                    </span>

                    {summary.missingAmount === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Audit Ready ({summary.receiptCount} receipts)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {formatCurrency(summary.missingAmount)} Missing Proof Gap
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-slate-200 font-mono">
                        {formatCurrency(summary.totalReceiptsAmount)} / {formatCurrency(summary.totalClaimedRelief)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {summary.readinessPercent}% Documented
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
                    {summary.missingCategories.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-300">
                          Missing Supporting Documents by Category:
                        </div>

                        <div className="space-y-1.5">
                          {summary.missingCategories.map((cat, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-200">{cat.categoryName}</div>
                                <div className="text-[11px] text-slate-400">
                                  Claimed: {formatCurrency(cat.claimed)} &bull; Documented: {formatCurrency(cat.documented)}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-amber-400">
                                  Gap: {formatCurrency(cat.gap)}
                                </span>
                                <button
                                  onClick={onNavigateToScan}
                                  className="px-2.5 py-1 rounded-md bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold transition shrink-0"
                                >
                                  Upload Invoice
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>All claimed reliefs for YA {summary.year} are backed by verified receipts in your Vault.</span>
                        </div>
                        <button
                          onClick={onNavigateToVault}
                          className="text-emerald-400 font-bold hover:underline text-[11px] shrink-0"
                        >
                          View {summary.receiptCount} Receipts
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Retention required until 31 Dec {summary.year + 7} under Section 82A ITA 1967.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation Modal */}
      {showExplanationModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExplanationModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Section 82A 7-Year Tax Record Retention Rule</h3>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Close (Esc)"
              >
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>Close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Under <strong>Section 82A of the Income Tax Act 1967 (ITA 1967)</strong>, all Malaysian taxpayers (both individuals and registered businesses) are legally obligated to preserve physical or verified digital records, invoices, receipts, and bank statements for a minimum of <strong>7 years</strong> from the end of the year in which the tax return is submitted.
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-400">Legal Penalties for Non-Compliance (Section 119A):</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Fine between <strong>RM 300 to RM 10,000</strong> upon conviction</li>
                  <li>Imprisonment for a term up to <strong>1 year</strong>, or both</li>
                  <li>Complete disallowance of unsubstantiated claimed reliefs with a <strong>100% tax penalty surcharge</strong> under Sec 113(1)(b)</li>
                </ul>
              </div>

              <p className="text-slate-400">
                CukaiSmart automatically anchors each scanned receipt with a <strong>SHA-256 cryptographic hash</strong> and LHDN compliance check to guarantee audit defense readiness during field audits or tax query letters.
              </p>
            </div>

            <button
              onClick={() => setShowExplanationModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* AI Audit Simulation Modal */}
      <AuditSimulatorModal
        isOpen={showSimulatorModal}
        onClose={() => setShowSimulatorModal(false)}
        onNavigateToScan={onNavigateToScan}
      />
    </div>
  );
};

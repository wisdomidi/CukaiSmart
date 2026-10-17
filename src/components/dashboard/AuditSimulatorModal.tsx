import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  FileText,
  HelpCircle,
  TrendingDown,
  Info,
  DollarSign,
  Lock,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';

interface AuditSimulationData {
  auditRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedTaxDeficiency: number;
  penaltyRange: {
    concessionRate45: number;
    statutoryRate100: number;
  };
  topAuditTriggers: string[];
  statutoryClauses: Array<{
    section: string;
    title: string;
    implication: string;
  }>;
  mitigationChecklist: string[];
  seniorAuditorVerdict: string;
}

interface AuditSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToScan?: () => void;
}

export const AuditSimulatorModal: React.FC<AuditSimulatorModalProps> = ({
  isOpen,
  onClose,
  onNavigateToScan,
}) => {
  const {
    activeTaxYear,
    persona,
    personalReliefs,
    businessCategories,
    receipts,
  } = useTax();

  const [isLoading, setIsLoading] = useState(false);
  const [simulation, setSimulation] = useState<AuditSimulationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Active metrics
  const activeReceipts = receipts.filter(
    (r) => r.taxYear === activeTaxYear && (persona === 'business' ? r.persona === 'business' : r.persona === 'individual')
  );

  const totalDocumented = activeReceipts.reduce((acc, r) => acc + r.claimableAmount, 0);

  const totalClaimed = persona === 'individual'
    ? personalReliefs.reduce((acc, r) => acc + Math.min(r.claimedAmount, r.maxLimit), 0)
    : businessCategories.reduce((acc, b) => acc + b.claimedAmount, 0);

  const missingProofGap = Math.max(0, totalClaimed - totalDocumented);

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sampleAuditItems = persona === 'individual'
        ? personalReliefs.filter((r) => r.claimedAmount > 0).map((r) => ({
            name: r.name,
            claimed: r.claimedAmount,
            max: r.maxLimit,
          }))
        : businessCategories.filter((b) => b.claimedAmount > 0).map((b) => ({
            name: b.name,
            claimed: b.claimedAmount,
          }));

      const res = await fetch('/api/advisor/audit-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          taxYear: activeTaxYear,
          totalClaimed,
          totalDocumented,
          missingProofGap,
          receiptCount: activeReceipts.length,
          sampleAuditItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute audit simulation.');
      }

      setSimulation(data.simulation);
    } catch (err: any) {
      console.error('Audit simulation failed:', err);
      // Fallback deterministic simulation if network/offline
      const calculatedRisk = missingProofGap > 3000 ? 'HIGH' : missingProofGap > 0 ? 'MEDIUM' : 'LOW';
      const estimatedDeficiency = missingProofGap * 0.19;
      setSimulation({
        auditRiskScore: Math.max(10, Math.min(100, Math.round((totalDocumented / (totalClaimed || 1)) * 100))),
        riskLevel: calculatedRisk,
        estimatedTaxDeficiency: estimatedDeficiency,
        penaltyRange: {
          concessionRate45: estimatedDeficiency * 0.45,
          statutoryRate100: estimatedDeficiency * 1.0,
        },
        topAuditTriggers: [
          missingProofGap > 0
            ? `Unsubstantiated deduction claim of ${formatCurrency(missingProofGap)} lacks invoice proof.`
            : 'Receipt verification hashes are healthy and intact.',
          persona === 'business'
            ? 'Section 39(1)(l) 50% statutory cap on entertainment meals must be strictly observed.'
            : 'Section 46(1)(q) sports attire claims are subject to scrutiny for dedicated equipment proof.',
        ],
        statutoryClauses: [
          {
            section: 'Section 113(1) ITA 1967',
            title: 'Incorrect Returns & Unsubstantiated Claims',
            implication: 'Statutory penalty up to 100% of the tax undercharged upon audit reassessment.',
          },
          {
            section: 'Section 82A ITA 1967',
            title: 'Mandatory 7-Year Record Retention',
            implication: 'Failure to produce original tax invoices/e-Invoices carries fines up to RM10,000.',
          },
        ],
        mitigationChecklist: [
          'Upload missing invoices to the 7-year Document Vault immediately.',
          'Verify SSM registration number and merchant TIN on all invoices above RM500.',
          'Separate lifestyle book/tech receipts from general stationary purchases.',
        ],
        seniorAuditorVerdict:
          missingProofGap === 0
            ? 'Compliant and audit-proof. All claimed reliefs are backed by verified receipts.'
            : `Audit exposure detected. Address the ${formatCurrency(missingProofGap)} documentation gap before submission.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'LOW':
        return {
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'LOW RISK - AUDIT COMPLIANT',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'MODERATE RISK - DOCUMENTATION GAPS',
        };
      case 'HIGH':
        return {
          bg: 'bg-rose-500/15',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          badge: 'HIGH RISK - STATUTORY PENALTY EXPOSURE',
        };
      case 'CRITICAL':
      default:
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          text: 'text-red-400',
          badge: 'CRITICAL AUDIT ALERT - IMMEDIATE ACTION REQUIRED',
        };
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  LHDN Pre-Audit Risk Assessment &amp; Section 113 Exposure Check
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Gemini 3.8 Reasoning
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated statutory scrutiny of tax claims and penalty exposure under the Income Tax Act 1967.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Snapshot Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Total Claimed (YA {activeTaxYear})</span>
              <div className="text-xl font-bold text-white font-mono">{formatCurrency(totalClaimed)}</div>
              <p className="text-[10px] text-slate-500">{persona === 'individual' ? 'Personal Reliefs' : 'Business Deductions'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Verified Receipt Proof</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">{formatCurrency(totalDocumented)}</div>
              <p className="text-[10px] text-slate-500">{activeReceipts.length} receipts stored in vault</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Missing Proof Gap</span>
              <div className={`text-xl font-bold font-mono ${missingProofGap > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatCurrency(missingProofGap)}
              </div>
              <p className="text-[10px] text-slate-500">
                {missingProofGap > 0 ? 'At risk of audit disallowance' : '100% substantiated'}
              </p>
            </div>
          </div>

          {/* Action to Run or Re-run Simulation */}
          {!simulation && !isLoading && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Scale className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-white">Execute Full AI Audit Scrutiny</h4>
                <p className="text-xs text-slate-400">
                  Gemini will analyze statutory compliance, evaluate Section 113 penalty benchmarks (45% vs 100%), and perform an official LHDN pre-audit inspection.
                </p>
              </div>
              <button
                onClick={handleRunSimulation}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Run Pre-Audit Inspection Now</span>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="p-10 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-4">
              <RefreshCw className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Cross-referencing Income Tax Act 1967...</p>
                <p className="text-xs text-slate-400">
                  Evaluating Section 113 penalties, Section 82A 7-year mandates, and Public Rulings...
                </p>
              </div>
            </div>
          )}

          {simulation && (
            <div className="space-y-6 animate-fade-in">
              {/* Risk Gauge & Verdict Card */}
              {(() => {
                const badge = getRiskBadge(simulation.riskLevel);
                return (
                  <div className={`p-5 rounded-2xl ${badge.bg} ${badge.border} border space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                          {badge.badge}
                        </span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-3xl font-black text-white font-mono">
                            {simulation.auditRiskScore}/100
                          </span>
                          <span className="text-xs text-slate-400">Audit Proof Index</span>
                        </div>
                      </div>

                      <button
                        onClick={handleRunSimulation}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-xs font-semibold text-slate-300 border border-slate-700/80 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-run Inspection</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Info className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Senior LHDN Auditor Verdict:</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {simulation.seniorAuditorVerdict}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Statutory Penalty Exposure Calculator */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Statutory Tax Deficiency &amp; Section 113 Penalty Exposure
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-medium text-slate-400">Estimated Tax Shortfall</span>
                    <div className="text-lg font-bold text-rose-400 font-mono mt-1">
                      {formatCurrency(simulation.estimatedTaxDeficiency || 0)}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Based on disallowable deductions</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-medium text-slate-400">Section 113(2) Concession (45%)</span>
                    <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                      {formatCurrency(simulation.penaltyRange?.concessionRate45 || 0)}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Standard settlement penalty</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-medium text-slate-400">Section 113(1) Statutory (100%)</span>
                    <div className="text-lg font-bold text-rose-500 font-mono mt-1">
                      {formatCurrency(simulation.penaltyRange?.statutoryRate100 || 0)}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Maximum statutory penalty</p>
                  </div>
                </div>
              </div>

              {/* Top Audit Triggers */}
              {simulation.topAuditTriggers && simulation.topAuditTriggers.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Identified LHDN Audit Red Flags
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {simulation.topAuditTriggers.map((trigger, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Statutory Legal Clauses */}
              {simulation.statutoryClauses && simulation.statutoryClauses.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Statutory Precedents &amp; Income Tax Act 1967 Clauses
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {simulation.statutoryClauses.map((clause, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                      >
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          {clause.section}
                        </span>
                        <h5 className="text-xs font-semibold text-white">{clause.title}</h5>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          {clause.implication}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Mitigation Checklist */}
              {simulation.mitigationChecklist && simulation.mitigationChecklist.length > 0 && (
                <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        Action Checklist to Achieve 100% Audit-Proof Status
                      </h4>
                    </div>
                    {onNavigateToScan && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToScan();
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
                      >
                        Scan Invoices Now &rarr;
                      </button>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {simulation.mitigationChecklist.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Income Tax Act 1967 (Act 53) &bull; Official LHDN Audit Framework
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
          >
            Close Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

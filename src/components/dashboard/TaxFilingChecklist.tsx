import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Upload,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Archive,
  Scale,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';
import { LHDNReliefTooltip } from './LHDNReliefTooltip';

interface TaxFilingChecklistProps {
  onNavigateToScan: () => void;
  onNavigateToVault: () => void;
}

export const TaxFilingChecklist: React.FC<TaxFilingChecklistProps> = ({
  onNavigateToScan,
  onNavigateToVault,
}) => {
  const {
    persona,
    activeTaxYear,
    personalReliefs,
    businessCategories,
    receipts,
  } = useTax();

  const [activeFormType, setActiveFormType] = useState<'BE' | 'B'>(() =>
    persona === 'business' ? 'B' : 'BE'
  );

  const [statusFilter, setStatusFilter] = useState<'all' | 'missing' | 'complete'>('all');

  // Filter saved receipts for active tax year
  const activeYearReceipts = receipts.filter((r) => r.taxYear === activeTaxYear);

  // Map Personal Reliefs or Business Categories into structured checklist items
  const checklistItems =
    activeFormType === 'BE'
      ? personalReliefs
          .filter((r) => r.claimedAmount > 0)
          .map((r) => {
            // Find saved receipts belonging to this relief category
            const matchingReceipts = activeYearReceipts.filter(
              (rec) =>
                rec.categoryName === r.name ||
                rec.categoryName?.toLowerCase().includes(r.name.toLowerCase()) ||
                r.name.toLowerCase().includes(rec.categoryName?.toLowerCase() || '')
            );

            const verifiedProofTotal = matchingReceipts.reduce((acc, rec) => acc + (rec.claimableAmount || rec.totalAmount || 0), 0);
            const proofGap = Math.max(0, r.claimedAmount - verifiedProofTotal);

            let status: 'VERIFIED' | 'PARTIAL' | 'MISSING' = 'MISSING';
            if (verifiedProofTotal >= r.claimedAmount) {
              status = 'VERIFIED';
            } else if (verifiedProofTotal > 0) {
              status = 'PARTIAL';
            }

            return {
              id: r.id,
              name: r.name,
              section: r.section,
              claimedAmount: r.claimedAmount,
              maxLimit: r.maxLimit,
              verifiedProofTotal,
              proofGap,
              receiptCount: matchingReceipts.length,
              status,
              receipts: matchingReceipts,
            };
          })
      : businessCategories
          .filter((b) => b.claimedAmount > 0)
          .map((b) => {
            const matchingReceipts = activeYearReceipts.filter(
              (rec) =>
                rec.categoryName === b.name ||
                rec.categoryName?.toLowerCase().includes(b.name.toLowerCase())
            );

            const verifiedProofTotal = matchingReceipts.reduce((acc, rec) => acc + (rec.claimableAmount || rec.totalAmount || 0), 0);
            const proofGap = Math.max(0, b.claimedAmount - verifiedProofTotal);

            let status: 'VERIFIED' | 'PARTIAL' | 'MISSING' = 'MISSING';
            if (verifiedProofTotal >= b.claimedAmount) {
              status = 'VERIFIED';
            } else if (verifiedProofTotal > 0) {
              status = 'PARTIAL';
            }

            return {
              id: b.id,
              name: b.name,
              section: b.section,
              claimedAmount: b.claimedAmount,
              maxLimit: b.claimedAmount * 1.5,
              verifiedProofTotal,
              proofGap,
              receiptCount: matchingReceipts.length,
              status,
              receipts: matchingReceipts,
            };
          });

  // Calculate Overall Progress
  const totalClaimedValue = checklistItems.reduce((acc, item) => acc + item.claimedAmount, 0);
  const totalVerifiedValue = checklistItems.reduce(
    (acc, item) => acc + Math.min(item.claimedAmount, item.verifiedProofTotal),
    0
  );
  const progressPercent =
    totalClaimedValue > 0 ? Math.min(100, Math.round((totalVerifiedValue / totalClaimedValue) * 100)) : 100;

  const verifiedCount = checklistItems.filter((i) => i.status === 'VERIFIED').length;
  const missingCount = checklistItems.filter((i) => i.status !== 'VERIFIED').length;

  // Filter items by tab
  const filteredItems = checklistItems.filter((item) => {
    if (statusFilter === 'missing') return item.status !== 'VERIFIED';
    if (statusFilter === 'complete') return item.status === 'VERIFIED';
    return true;
  });

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>LHDN Audit Readiness Module &bull; AY {activeTaxYear + 1}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Tax Filing Documentation Checklist
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Track receipt proofs for every claimed tax relief before submitting your official e-Filing return.
          </p>
        </div>

        {/* Form BE vs Form B Switcher */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs shrink-0">
          <button
            onClick={() => setActiveFormType('BE')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition ${
              activeFormType === 'BE'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Form BE (Salaried)
          </button>
          <button
            onClick={() => setActiveFormType('B')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition ${
              activeFormType === 'B'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Form B (Business)
          </button>
        </div>
      </div>

      {/* Progress & Audit Readiness Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/60 border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>7-Year Statutory Audit Progress</span>
          </span>
          <span className="text-emerald-400 font-mono text-sm">{progressPercent}% Ready</span>
        </div>

        {/* Progress meter */}
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Claimed Value</span>
            <p className="font-extrabold text-white text-sm font-mono mt-0.5">
              {formatCurrency(totalClaimedValue)}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">Verified Proofs Saved</span>
            <p className="font-extrabold text-emerald-400 text-sm font-mono mt-0.5">
              {formatCurrency(totalVerifiedValue)}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-amber-300 uppercase font-bold">Missing Documentation</span>
            <p className="font-extrabold text-amber-400 text-sm font-mono mt-0.5">
              {formatCurrency(Math.max(0, totalClaimedValue - totalVerifiedValue))}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Claims ({checklistItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('missing')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              statusFilter === 'missing'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Needs Proof ({missingCount})
          </button>
          <button
            onClick={() => setStatusFilter('complete')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              statusFilter === 'complete'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Fully Verified ({verifiedCount})
          </button>
        </div>

        <button
          onClick={onNavigateToVault}
          className="text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1 text-xs transition"
        >
          <span>Open Document Vault</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Checklist Line Items */}
      <div className="space-y-3">
        {checklistItems.length === 0 ? (
          <div className="text-center py-8 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs space-y-2">
            <Archive className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-bold text-white">No active tax claims logged yet for Tax Year {activeTaxYear}</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Upload or snap a receipt to claim eligible expenses and automatically track document completeness for Form {activeFormType}.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-white">All claims in this filter are fully documented!</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              You have 100% receipt proof coverage for these LHDN tax deductions in your Document Vault.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    {item.name}
                    <LHDNReliefTooltip reliefName={item.name} reliefId={item.id} />
                  </span>
                  <span className="text-slate-400 text-xs font-mono">({item.section})</span>
                </div>

                {/* Status Badge */}
                {item.status === 'VERIFIED' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>100% Audit Verified</span>
                  </span>
                )}

                {item.status === 'PARTIAL' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1 w-fit">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Partial Proof ({item.receiptCount} saved)</span>
                  </span>
                )}

                {item.status === 'MISSING' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1 w-fit">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    <span>Missing Proof (0 saved)</span>
                  </span>
                )}
              </div>

              {/* Progress & Values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Declared Claim</span>
                  <p className="font-bold text-white font-mono">{formatCurrency(item.claimedAmount)}</p>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Verified Receipts</span>
                  <p className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(item.verifiedProofTotal)} ({item.receiptCount} docs)
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Required Proof Gap</span>
                    <p className={`font-bold font-mono ${item.proofGap > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {item.proofGap > 0 ? formatCurrency(item.proofGap) : 'RM 0.00'}
                    </p>
                  </div>

                  {item.proofGap > 0 && (
                    <button
                      onClick={onNavigateToScan}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow transition"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

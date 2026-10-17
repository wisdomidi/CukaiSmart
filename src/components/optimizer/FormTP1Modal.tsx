import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Copy,
  Check,
  Building,
  CheckCircle2,
  Sparkles,
  Download,
  Coins,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';

interface FormTP1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyIncome: number;
  annualTaxSaved: number;
}

export const FormTP1Modal: React.FC<FormTP1ModalProps> = ({
  isOpen,
  onClose,
  monthlyIncome,
  annualTaxSaved,
}) => {
  const { personalReliefs, activeTaxYear, currentUser } = useTax();
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Active claimed reliefs in current year
  const claimedReliefs = personalReliefs.filter((r) => r.claimedAmount > 0);
  const totalInYearReliefs = claimedReliefs.reduce(
    (acc, r) => acc + Math.min(r.claimedAmount, r.maxLimit),
    0
  );

  const monthlyCashBoost = Math.round((annualTaxSaved / 12) * 100) / 100;

  // Rough estimation of monthly PCB withholding
  const annualGross = monthlyIncome * 12;
  const standardChargeable = Math.max(0, annualGross - 9000); // Standard individual relief only
  const optimizedChargeable = Math.max(0, standardChargeable - totalInYearReliefs);

  // Simplified PCB withholding estimate
  const standardMonthlyPCB = Math.round(((standardChargeable * 0.15) / 12) * 100) / 100;
  const optimizedMonthlyPCB = Math.max(0, Math.round(((optimizedChargeable * 0.15) / 12) * 100) / 100);

  const handleCopySchedule = () => {
    const lines = [
      `LEMBAGA HASIL DALAM NEGERI MALAYSIA (LHDN)`,
      `BORANG TP1 - JADUAL PELEPASAN CUKAI BULANAN (PCB) YA ${activeTaxYear}`,
      `Nama Pembayar Cukai: ${currentUser?.displayName || 'Taxpayer'}`,
      `Emel: ${currentUser?.email || 'Registered User'}`,
      `Gaji Bulanan Kasar: RM ${monthlyIncome.toLocaleString()}`,
      `Jumlah Pelepasan Dituntut (Borang TP1): RM ${totalInYearReliefs.toLocaleString()}`,
      ``,
      `SENARAI PELEPASAN BAHAGIAN C:`,
      ...claimedReliefs.map(
        (r) => `• ${r.name} (${r.section || 'Sec 46'}): RM ${Math.min(r.claimedAmount, r.maxLimit).toLocaleString()}`
      ),
      ``,
      `PENGURANGAN POTONGAN CUKAI BULANAN (PCB):`,
      `• Anggaran Penjimatan Bulanan: +RM ${monthlyCashBoost.toFixed(2)}/bulan`,
      `• Jumlah Penjimatan Cukai Tahunan: RM ${annualTaxSaved.toFixed(2)}`,
      `Tarikh Dijana: ${new Date().toLocaleDateString('ms-MY')}`,
      `Dijana secara automatik melalui CukaiSmart (Inland Revenue Act 1967 Compliant)`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Borang TP1 &bull; Monthly PCB Salary Rebalancer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  LHDN Rule 3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Borang Tuntutan Pelepasan Cukai Individu Oleh Pekerja (Kaedah-Kaedah PCB 1994).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer shadow-sm"
            title="Close Form TP1 (Esc)"
          >
            <X className="w-4 h-4 text-slate-300" />
            <span>Close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Monthly Cash In Pocket Comparison Hero */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Direct Payday Impact
                </span>
                <h4 className="text-lg font-bold text-white mt-1">
                  Extra Cash Credited Into Your Salary Every Month
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Submitting Form TP1 to HR reduces monthly PCB deduction immediately instead of waiting for a year-end refund.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-right shrink-0">
                <span className="text-[10px] font-semibold text-emerald-300 uppercase">Monthly Cash Boost</span>
                <div className="text-2xl font-black text-emerald-300 font-mono">
                  +{formatCurrency(monthlyCashBoost)}/mo
                </div>
                <span className="text-[10px] text-slate-300">
                  Total +{formatCurrency(annualTaxSaved)} / year
                </span>
              </div>
            </div>

            {/* Before vs After PCB Withholding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium">Standard HR PCB Deduction</span>
                <div className="text-base font-bold text-slate-300 font-mono mt-0.5">
                  ~ {formatCurrency(standardMonthlyPCB)} / month
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Assumes standard RM 9,000 personal relief only</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 font-medium">Optimized PCB Deduction (Form TP1)</span>
                <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                  ~ {formatCurrency(optimizedMonthlyPCB)} / month
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">With RM {totalInYearReliefs.toLocaleString()} in-year claimed reliefs</p>
              </div>
            </div>
          </div>

          {/* Schedule of Claimed Reliefs (Bahagian C) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>Bahagian C: Relief Schedule for Employer Payroll</span>
              </h4>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Total: {formatCurrency(totalInYearReliefs)}
              </span>
            </div>

            {claimedReliefs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                No active tax reliefs logged yet. Add your receipt claims to generate an official Form TP1 schedule.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {claimedReliefs.map((relief) => {
                  const claim = Math.min(relief.claimedAmount, relief.maxLimit);
                  return (
                    <div
                      key={relief.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">{relief.name}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          {relief.section || 'Income Tax Act 1967'} &bull; Max: {formatCurrency(relief.maxLimit)}
                        </p>
                      </div>
                      <div className="text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(claim)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submission Instructions */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>How to Submit Form TP1 to Your Company:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
              <li>Copy the schedule below or print this sheet for your HR / Payroll department.</li>
              <li>Your employer will input the figures into their official payroll software (e.g. Bukku, SQL Payroll, Kakitangan).</li>
              <li>Your monthly PCB deduction will be instantly adjusted downwards on your next payslip.</li>
            </ol>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            LHDN Form TP1 Schedule &bull; YA {activeTaxYear}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySchedule}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy for HR</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Schedule</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

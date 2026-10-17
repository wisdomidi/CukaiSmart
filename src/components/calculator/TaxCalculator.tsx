import React, { useState } from 'react';
import {
  Calculator,
  TrendingDown,
  Sparkles,
  Info,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Percent,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import {
  DEFAULT_MALAYSIA_BRACKETS,
  calculateTaxForChargeableIncome,
  formatCurrency,
} from '../../utils/taxEngine';
import { MultiYearTaxSimulator } from './MultiYearTaxSimulator';

interface TaxCalculatorProps {
  onNavigateToOptimize?: () => void;
  onNavigateToVault?: () => void;
}

export const TaxCalculator: React.FC<TaxCalculatorProps> = ({
  onNavigateToOptimize,
  onNavigateToVault,
}) => {
  const { activeTaxYear, personalReliefs, monthlyIncome, persona } = useTax();

  // Input Mode: 'quick' (Chargeable Income), 'detailed' (Gross Salary & Relief Breakdown), or 'multi-year'
  const [inputMode, setInputMode] = useState<'quick' | 'detailed' | 'multi-year'>('detailed');

  // Quick mode state
  const [quickChargeableIncome, setQuickChargeableIncome] = useState<number>(68000);

  // Detailed mode state
  const [monthlyGross, setMonthlyGross] = useState<number>(monthlyIncome || 6500);
  const [monthlyAllowance, setMonthlyAllowance] = useState<number>(500);
  const [annualBonus, setAnnualBonus] = useState<number>(6500);
  const [epfRate, setEpfRate] = useState<number>(11);

  // Toggle customized relief claim selections for detailed mode
  const [selectedReliefs, setSelectedReliefs] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    personalReliefs.forEach((r) => {
      initial[r.id] = r.claimedAmount;
    });
    return initial;
  });

  const [showReliefDetails, setShowReliefDetails] = useState(false);

  // Calculations for Detailed Mode
  const annualGrossSalary = monthlyGross * 12 + monthlyAllowance * 12 + annualBonus;
  const annualEpfContribution = Math.min((monthlyGross * (epfRate / 100)) * 12, 4000); // EPF cap RM 4,000

  // Total selected reliefs sum
  const totalSelectedReliefs = Object.entries(selectedReliefs).reduce((acc, [id, val]) => {
    const r = personalReliefs.find((item) => item.id === id);
    if (!r) return acc;
    return acc + Math.min(val, r.maxLimit);
  }, 0);

  // Final Chargeable Income
  const calculatedChargeableIncome =
    inputMode === 'quick'
      ? Math.max(0, quickChargeableIncome)
      : Math.max(0, annualGrossSalary - totalSelectedReliefs);

  // Tax calculation result
  const taxResult = calculateTaxForChargeableIncome(
    calculatedChargeableIncome,
    DEFAULT_MALAYSIA_BRACKETS
  );

  // Estimated Monthly PCB (Potongan Cukai Bulanan)
  const estimatedMonthlyPCB = Math.round((taxResult.taxPayable / 12) * 100) / 100;

  // Bracket Drop Optimization Calculation
  const currentBracket = taxResult.bracketUsed;
  const currentBracketIndex = DEFAULT_MALAYSIA_BRACKETS.findIndex(
    (b) => b.id === currentBracket.id
  );

  // Amount over the lower bound of the current bracket
  const excessOverBracketStart =
    currentBracket.min > 0 ? calculatedChargeableIncome - currentBracket.min : 0;

  const previousBracket =
    currentBracketIndex > 0 ? DEFAULT_MALAYSIA_BRACKETS[currentBracketIndex - 1] : null;

  // Tax saved if user drops to lower bracket boundary
  const potentialTaxSavings =
    excessOverBracketStart > 0 ? Math.round(excessOverBracketStart * taxResult.marginalRate) : 0;

  const handleReliefValueChange = (reliefId: string, val: number) => {
    const r = personalReliefs.find((item) => item.id === reliefId);
    if (!r) return;
    const clamped = Math.max(0, Math.min(val, r.maxLimit));
    setSelectedReliefs((prev) => ({
      ...prev,
      [reliefId]: clamped,
    }));
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Calculator className="w-3.5 h-3.5" />
            <span>LHDN Inland Revenue &bull; Statutory ITA 1967 Tax Rate Schedule (YA {activeTaxYear})</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Income Tax &amp; Bracket Estimator
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calculate your progressive LHDN tax bracket, marginal rate, and estimated monthly MTD/PCB. See how capturing relief expenses drops your taxable bracket.
          </p>
        </div>

        {/* Input Mode Switcher */}
        <div className="flex flex-wrap items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0 gap-1">
          <button
            onClick={() => setInputMode('detailed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              inputMode === 'detailed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Detailed Income &amp; Reliefs
          </button>
          <button
            onClick={() => setInputMode('quick')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              inputMode === 'quick'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick Chargeable
          </button>
          <button
            onClick={() => setInputMode('multi-year')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              inputMode === 'multi-year'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Multi-Year Comparison (YA 2024-2026)</span>
          </button>
        </div>
      </div>

      {inputMode === 'multi-year' ? (
        <MultiYearTaxSimulator grossAnnualIncome={annualGrossSalary} />
      ) : (
        <>
          {/* Calculator Inputs Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            {inputMode === 'quick' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Annual Chargeable Income (RM)
              <span className="text-slate-500 ml-1 font-normal">
                (Gross Income minus Total Personal Reliefs)
              </span>
            </label>
            <div className="relative max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                RM
              </span>
              <input
                type="number"
                value={quickChargeableIncome}
                onChange={(e) => setQuickChargeableIncome(Number(e.target.value) || 0)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-lg font-bold focus:outline-none focus:border-emerald-500"
                placeholder="68000"
                min={0}
                step={500}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Income Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Monthly Basic Salary (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    RM
                  </span>
                  <input
                    type="number"
                    value={monthlyGross}
                    onChange={(e) => setMonthlyGross(Number(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-semibold focus:outline-none focus:border-emerald-500"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Monthly Allowance (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    RM
                  </span>
                  <input
                    type="number"
                    value={monthlyAllowance}
                    onChange={(e) => setMonthlyAllowance(Number(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-semibold focus:outline-none focus:border-emerald-500"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Annual Bonus / Comm. (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    RM
                  </span>
                  <input
                    type="number"
                    value={annualBonus}
                    onChange={(e) => setAnnualBonus(Number(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-semibold focus:outline-none focus:border-emerald-500"
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Income & Relief Summary Bar */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400">Total Annual Gross Income: </span>
                <strong className="text-white font-mono font-bold">
                  {formatCurrency(annualGrossSalary)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Total Personal Tax Reliefs: </span>
                <strong className="text-emerald-400 font-mono font-bold">
                  - {formatCurrency(totalSelectedReliefs)}
                </strong>
              </div>
              <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <span className="text-slate-300 font-semibold">Net Chargeable Income: </span>
                <strong className="text-amber-400 font-mono font-bold">
                  {formatCurrency(calculatedChargeableIncome)}
                </strong>
              </div>
            </div>

            {/* Collapsible Relief Claims Adjuster */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowReliefDetails(!showReliefDetails)}
                className="w-full px-4 py-3 bg-slate-950 hover:bg-slate-800/80 transition flex items-center justify-between text-xs font-semibold text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Customize Personal Tax Relief Claims ({personalReliefs.length} statutory items)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-mono">
                    Total: {formatCurrency(totalSelectedReliefs)}
                  </span>
                  {showReliefDetails ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {showReliefDetails && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 max-h-96 overflow-y-auto">
                  <p className="text-[11px] text-slate-400">
                    Adjust your claimed relief amounts below to test how much tax you save when claiming receipts in CukaiSmart.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {personalReliefs.map((relief) => {
                      const currentVal = selectedReliefs[relief.id] ?? 0;
                      return (
                        <div
                          key={relief.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate max-w-[180px]">
                                {relief.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Cap: RM {relief.maxLimit.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{relief.section}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={relief.maxLimit}
                              step={50}
                              value={currentVal}
                              onChange={(e) =>
                                handleReliefValueChange(relief.id, Number(e.target.value))
                              }
                              className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">
                                RM
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={relief.maxLimit}
                                value={currentVal}
                                onChange={(e) =>
                                  handleReliefValueChange(
                                    relief.id,
                                    Math.min(relief.maxLimit, Number(e.target.value) || 0)
                                  )
                                }
                                className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tax Calculation Output Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Annual Tax Payable */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Estimated Annual Tax</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(taxResult.taxPayable)}
          </p>
          <p className="text-[11px] text-slate-400">Total statutory LHDN tax due for YA {activeTaxYear}</p>
        </div>

        {/* Metric 2: Marginal Tax Rate */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Marginal Tax Rate</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono tracking-tight">
            {(taxResult.marginalRate * 100).toFixed(0)}%
          </p>
          <p className="text-[11px] text-slate-400">
            Tax rate applied to your next RM 1 of income
          </p>
        </div>

        {/* Metric 3: Effective Tax Rate */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Effective Tax Rate</span>
            <TrendingDown className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-teal-300 font-mono tracking-tight">
            {taxResult.effectiveRate.toFixed(2)}%
          </p>
          <p className="text-[11px] text-slate-400">
            Actual tax paid relative to total chargeable income
          </p>
        </div>

        {/* Metric 4: Monthly PCB / MTD */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Estimated Monthly PCB</span>
            <Calculator className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-300 font-mono tracking-tight">
            {formatCurrency(estimatedMonthlyPCB)}
            <span className="text-xs font-normal text-slate-400">/mo</span>
          </p>
          <p className="text-[11px] text-slate-400">Potongan Cukai Bulanan payroll deduction</p>
        </div>
      </div>

      {/* Bracket Drop Optimization Insight */}
      {excessOverBracketStart > 0 && previousBracket && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">
              LHDN Tax Bracket Reduction Insight
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You are currently <strong className="text-white font-mono">RM {excessOverBracketStart.toLocaleString()}</strong> into the <strong className="text-amber-400">{(taxResult.marginalRate * 100).toFixed(0)}%</strong> marginal tax bracket band (RM {currentBracket.min.toLocaleString()} - {currentBracket.max ? `RM ${currentBracket.max.toLocaleString()}` : 'above'}).
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Additional Relief Needed to Drop Bracket: </span>
              <strong className="text-emerald-400 font-mono font-bold">
                {formatCurrency(excessOverBracketStart + 1)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Direct Cash Tax Saved: </span>
              <strong className="text-amber-300 font-mono font-bold">
                + {formatCurrency(potentialTaxSavings)}
              </strong>
            </div>
            {onNavigateToOptimize && (
              <button
                onClick={onNavigateToOptimize}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md self-start sm:self-auto"
              >
                <span>Automate with Payday Optimizer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interactive LHDN Progressive Tax Ladder Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>LHDN Progressive Tax Bracket Scale (ITA 1967)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Highlighting where your RM {calculatedChargeableIncome.toLocaleString()} chargeable income lands
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Tax Band / Income Range</th>
                <th className="py-2.5 px-3 font-semibold text-center">Tax Rate</th>
                <th className="py-2.5 px-3 font-semibold text-right">Base Cumulative Tax</th>
                <th className="py-2.5 px-3 font-semibold text-right">Tax In Band</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {DEFAULT_MALAYSIA_BRACKETS.map((b) => {
                const isActive = b.id === currentBracket.id;
                const isPassed = calculatedChargeableIncome > (b.max ?? Infinity);

                let taxableInBand = 0;
                if (calculatedChargeableIncome > b.min) {
                  const upper = b.max !== null ? Math.min(calculatedChargeableIncome, b.max) : calculatedChargeableIncome;
                  taxableInBand = upper - b.min;
                }
                const taxInThisBand = taxableInBand * b.rate;

                return (
                  <tr
                    key={b.id}
                    className={`transition ${
                      isActive
                        ? 'bg-emerald-500/15 border-l-4 border-l-emerald-500 text-white font-bold'
                        : isPassed
                        ? 'text-slate-300 bg-slate-950/40'
                        : 'text-slate-500'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold font-sans">
                        {b.max === null
                          ? `Above RM ${b.min.toLocaleString()}`
                          : `RM ${b.min.toLocaleString()} - RM ${b.max.toLocaleString()}`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">{b.description}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-950 text-slate-400'
                        }`}
                      >
                        {(b.rate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">RM {b.baseTax.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      RM {taxInThisBand.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Bracket</span>
                        </span>
                      ) : isPassed ? (
                        <span className="text-slate-500 text-[10px]">Taxed</span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Footer Navigation CTA */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Ready to claim your maximum tax refund?</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan receipts with CukaiSmart AI or setup automated monthly payday tax-sheltering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToVault && (
            <button
              onClick={onNavigateToVault}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              View Document Vault
            </button>
          )}
          {onNavigateToOptimize && (
            <button
              onClick={onNavigateToOptimize}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Optimize Payday Reliefs</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

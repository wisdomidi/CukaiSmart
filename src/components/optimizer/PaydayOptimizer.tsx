import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Sliders,
  Coins,
  Shield,
  ArrowRight,
  Globe,
  Settings2,
  CheckCircle2,
  Flame,
  Scale,
  RefreshCw,
  Info,
  X,
  Plus,
  FileText,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import {
  formatCurrency,
  calculatePaydayOptimization,
  REGIONAL_PROFILES,
} from '../../utils/taxEngine';
import { RegionalAuthority, TaxBracket } from '../../types/tax';
import { FormTP1Modal } from './FormTP1Modal';
import { SimpleEnglishTaxTipCard } from '../common/SimpleEnglishTaxTipCard';

export const PaydayOptimizer: React.FC = () => {

  const {
    monthlyIncome,
    setMonthlyIncome,
    monthlySavingsBudget,
    setMonthlySavingsBudget,
    personalReliefs,
    customBrackets,
    updateCustomBracket,
    resetCustomBrackets,
    regionalAuthority,
    setRegionalAuthority,
    activeTaxYear,
  } = useTax();

  const [showBracketEditor, setShowBracketEditor] = useState(false);
  const [showTP1Modal, setShowTP1Modal] = useState(false);

  // Compute optimization result
  const plan = calculatePaydayOptimization(
    monthlyIncome,
    monthlySavingsBudget,
    personalReliefs,
    customBrackets
  );

  const regionalProfile = REGIONAL_PROFILES[regionalAuthority] || REGIONAL_PROFILES.MY;

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Statutory Relief Maximizer &bull; Monthly PCB Rebalancing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Relief Maximizer &amp; Take-Home Pay Optimizer
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Identify unclaimed Section 46 relief opportunities before year-end. Reduce monthly PCB payroll tax deductions immediately with Rule 3 Form TP1 schedules.
          </p>
        </div>

        {/* Regional Scale Adapter & Custom Brackets Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={regionalAuthority}
              onChange={(e) => setRegionalAuthority(e.target.value as RegionalAuthority)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="MY" className="bg-slate-900 text-slate-200">Malaysia (LHDN)</option>
              <option value="SG" className="bg-slate-900 text-slate-200">Singapore (IRAS)</option>
              <option value="ID" className="bg-slate-900 text-slate-200">Indonesia (DJP)</option>
            </select>
          </div>

          <button
            onClick={() => setShowBracketEditor(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Edit Tax Brackets & Rates"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Brackets</span>
          </button>
        </div>
      </div>

      {/* Simple English Payday Tip Card */}
      <SimpleEnglishTaxTipCard topic="payday_optimizer" />

      {/* Input Sliders & Controls */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gross Monthly Income */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Gross Monthly Salary</span>
            <span className="text-base font-bold text-white font-mono">
              {formatCurrency(monthlyIncome, regionalProfile.symbol)}
            </span>
          </div>
          <input
            type="range"
            min={3000}
            max={50000}
            step={500}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>RM 3,000/mo</span>
            <span>Annual: {formatCurrency(plan.annualGrossIncome, regionalProfile.symbol)}</span>
            <span>RM 50,000/mo</span>
          </div>
        </div>

        {/* Monthly Savings / Disposable Budget */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Monthly Disposable / Savings Budget</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {formatCurrency(monthlySavingsBudget, regionalProfile.symbol)}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={monthlySavingsBudget}
            onChange={(e) => setMonthlySavingsBudget(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>RM 100/mo</span>
            <span>Annual: {formatCurrency(monthlySavingsBudget * 12, regionalProfile.symbol)}</span>
            <span>RM 10,000/mo</span>
          </div>
        </div>
      </div>

      {/* Summary Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Annual Cash Tax Refund</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(plan.totalAnnualTaxSaved, regionalProfile.symbol)}
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            Direct money saved from LHDN tax payment
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Marginal Tax Bracket</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-300 tracking-tight">
            {(plan.estimatedMarginalRate * 100).toFixed(0)}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Every RM 100 saved generates RM {(plan.estimatedMarginalRate * 100).toFixed(0)} rebate
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Projected Net Tax</span>
            <Scale className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(plan.projectedTaxAfterOptimization, regionalProfile.symbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 line-through">
            Before optimization: {formatCurrency(plan.projectedTaxBeforeOptimization, regionalProfile.symbol)}
          </p>
        </div>
      </div>

      {/* Borang TP1 Monthly Take-Home Cash Boost Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Monthly Take-Home Cash Boost: Form TP1</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Rule 3 PCB
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Submit Form TP1 to HR to reduce monthly salary PCB deductions by ~<strong className="text-emerald-400 font-mono">+{formatCurrency(plan.totalAnnualTaxSaved / 12, regionalProfile.symbol)}/month</strong> immediately.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTP1Modal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Generate Form TP1</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Payday Allocation Recommendations */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recommended Monthly Allocation Split</h3>
            <p className="text-xs text-slate-400">
              Ranked by statutory return on investment (ROI) at your {(plan.estimatedMarginalRate * 100).toFixed(0)}% marginal rate
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {plan.allocations.length} Active Buckets
          </span>
        </div>

        <div className="space-y-3">
          {plan.allocations.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                      {item.reliefName}
                    </h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {item.efficiencyRating} Efficiency
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.statutorySection}</p>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[11px] text-slate-400">Monthly Split</span>
                    <p className="text-sm font-bold text-emerald-400">
                      {formatCurrency(item.recommendedMonthly, regionalProfile.symbol)}/mo
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Annual Cash Saved</span>
                    <p className="text-sm font-bold text-white">
                      +{formatCurrency(item.taxSavingsCash, regionalProfile.symbol)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {item.explanation}
              </p>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Remaining annual cap: {formatCurrency(item.remainingCap, regionalProfile.symbol)}</span>
                <span className="text-emerald-400 font-medium">
                  Annual Target: {formatCurrency(item.annualTotal, regionalProfile.symbol)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customizable Tax Brackets Modal */}
      {showBracketEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBracketEditor(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-emerald-400" />
                  <span>Dynamic Progressive Tax Brackets</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {regionalProfile.name} • {regionalProfile.statute}
                </p>
              </div>

              <button
                onClick={resetCustomBrackets}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Statutory Default</span>
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {customBrackets.map((bracket) => (
                <div
                  key={bracket.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-white">{bracket.description}</p>
                    <p className="text-slate-400 font-mono text-[11px]">
                      {formatCurrency(bracket.min, regionalProfile.symbol)} —{' '}
                      {bracket.max ? formatCurrency(bracket.max, regionalProfile.symbol) : 'Above'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Rate:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={bracket.rate * 100}
                      onChange={(e) =>
                        updateCustomBracket(bracket.id, Math.max(0, Number(e.target.value) / 100))
                      }
                      className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="font-semibold text-slate-300">%</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowBracketEditor(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white transition"
            >
              Done &amp; Recalculate
            </button>
          </div>
        </div>
      )}

      {/* Form TP1 PCB Rebalancing Modal */}
      <FormTP1Modal
        isOpen={showTP1Modal}
        onClose={() => setShowTP1Modal(false)}
        monthlyIncome={monthlyIncome}
        annualTaxSaved={plan.totalAnnualTaxSaved}
      />
    </div>
  );
};

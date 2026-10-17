import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { ShieldCheck, Info, Sparkles, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';

export const ReliefUtilizationWidget: React.FC = () => {
  const { persona, personalReliefs, reliefSummary, businessCategories } = useTax();
  const [viewMode, setViewMode] = useState<'chart' | 'bar'>('chart');

  if (persona === 'business') {
    const totalDeductible = businessCategories.reduce((acc, b) => acc + b.claimedAmount, 0);
    const entertainmentCat = businessCategories.find((b) => b.id === 'biz-entertainment');
    const entertainmentClaimed = entertainmentCat ? entertainmentCat.claimedAmount : 0;

    const bizData = businessCategories.map((cat) => ({
      name: cat.name,
      Claimed: cat.claimedAmount,
      Section: cat.section,
    }));

    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Small Business Opex Breakdown</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Business Expense &amp; Statutory Cap Utilization
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Deductible Opex</span>
            <p className="text-xl font-black text-emerald-400 font-mono">
              {formatCurrency(totalDeductible)}
            </p>
          </div>
        </div>

        {/* Business Bar Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bizData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" tickFormatter={(v) => `RM ${v}`} stroke="#64748b" fontSize={11} />
              <YAxis dataKey="name" type="category" width={140} stroke="#cbd5e1" fontSize={11} tick={{ fill: '#cbd5e1' }} />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Claimed Opex']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="Claimed" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {entertainmentClaimed > 0 && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Section 39(1)(l) 50% Limit Applied to Client Entertainment ({formatCurrency(entertainmentClaimed)} claimed)</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  // Individual Persona Relief Utilization Calculations from LHDN Relief Summary
  const { totalClaimed, totalCap, totalRemaining, utilizationPercentage } = reliefSummary;

  // Pie Chart Data: Claimed vs Remaining
  const pieData = [
    { name: 'Reliefs Claimed', value: totalClaimed, color: '#10b981' },
    { name: 'Unclaimed Room', value: totalRemaining, color: '#1e293b' },
  ];

  // Bar Chart Data: Detailed Relief Categories
  const categoryBarData = personalReliefs.map((r) => {
    const claimed = Math.min(r.claimedAmount, r.maxLimit);
    const remaining = Math.max(0, r.maxLimit - claimed);
    return {
      shortName: r.name.length > 18 ? `${r.name.slice(0, 16)}...` : r.name,
      fullName: r.name,
      Claimed: claimed,
      Unclaimed: remaining,
      Limit: r.maxLimit,
      Section: r.section,
    };
  });

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-fade-in">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive Visual Analytics</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            Tax Relief Utilization Widget
          </h3>
          <p className="text-xs text-slate-400">
            Visualizing how much of your {formatCurrency(totalCap)} statutory tax relief cap you have claimed so far.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'chart'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overall Gauge
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'bar'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Category Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400">Total Statutory Limit</span>
          <p className="text-sm sm:text-lg font-black text-white font-mono mt-0.5">
            {formatCurrency(totalCap)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
          <span className="text-[11px] text-emerald-400">Claimed So Far</span>
          <p className="text-sm sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
            {formatCurrency(totalClaimed)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30">
          <span className="text-[11px] text-amber-300">Unclaimed Cap Left</span>
          <p className="text-sm sm:text-lg font-black text-amber-400 font-mono mt-0.5">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
      </div>

      {/* View Mode 1: Donut Gauge + Progress Summary */}
      {viewMode === 'chart' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          {/* Donut Chart Container */}
          <div className="relative h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {utilizationPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Relief Utilized
              </span>
            </div>
          </div>

          {/* Side Insight Card */}
          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Relief Utilization Cap</span>
                <span className="text-emerald-400 font-mono">{utilizationPercentage}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-300 transition-all duration-700"
                  style={{ width: `${utilizationPercentage}%` }}
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {utilizationPercentage < 50 ? (
                  <>
                    You have utilized <strong className="text-amber-400">{utilizationPercentage}%</strong> of your eligible LHDN tax reliefs. Upload receipts or log qualifying purchases to claim your remaining{' '}
                    <strong className="text-amber-300 font-mono">{formatCurrency(totalRemaining)}</strong> before 31 December.
                  </>
                ) : (
                  <>
                    Great job! You have captured <strong className="text-emerald-400">{utilizationPercentage}%</strong> of statutory tax reliefs, keeping more hard-earned money in your pocket.
                  </>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                100% compliant with LHDN ITA 1967 Section 46 statutory claim thresholds.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* View Mode 2: Category Stacked Bar Chart */
        <div className="space-y-2 pt-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBarData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <XAxis type="number" tickFormatter={(v) => `RM ${v}`} stroke="#64748b" fontSize={10} />
                <YAxis
                  dataKey="shortName"
                  type="category"
                  width={130}
                  stroke="#cbd5e1"
                  fontSize={10}
                  tick={{ fill: '#cbd5e1' }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [formatCurrency(Number(val) || 0), name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Claimed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Unclaimed" stackId="a" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Green bars represent claimed tax reliefs; grey bars represent remaining unclaimed limit.
          </p>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../utils/taxEngine';
import { ReceiptRecord } from '../../types/tax';

interface TaxYearFilterProps {
  receipts: ReceiptRecord[];
  selectedYear: string; // 'all' or specific year string like '2024'
  onSelectYear: (year: string) => void;
  activeTaxYear: number;
}

export const TaxYearFilter: React.FC<TaxYearFilterProps> = ({
  receipts,
  selectedYear,
  onSelectYear,
  activeTaxYear,
}) => {
  // Generate the 7-year statutory audit window (Section 82A ITA 1967)
  // e.g. for activeTaxYear 2026: 2026, 2025, 2024, 2023, 2022, 2021, 2020
  const statutoryYears: number[] = [];
  for (let i = 0; i < 7; i++) {
    statutoryYears.push(activeTaxYear - i);
  }

  // Also include any years from receipts that might fall outside this window
  receipts.forEach((r) => {
    if (r.taxYear && !statutoryYears.includes(r.taxYear)) {
      statutoryYears.push(r.taxYear);
    }
  });

  // Sort descending
  statutoryYears.sort((a, b) => b - a);

  // Calculate counts and claimable sums per year
  const statsByYear = statutoryYears.reduce<Record<number, { count: number; totalClaimable: number }>>(
    (acc, yr) => {
      acc[yr] = { count: 0, totalClaimable: 0 };
      return acc;
    },
    {}
  );

  let totalAllCount = 0;
  let totalAllClaimable = 0;

  receipts.forEach((r) => {
    totalAllCount++;
    totalAllClaimable += r.claimableAmount || 0;
    if (statsByYear[r.taxYear]) {
      statsByYear[r.taxYear].count += 1;
      statsByYear[r.taxYear].totalClaimable += r.claimableAmount || 0;
    } else {
      statsByYear[r.taxYear] = { count: 1, totalClaimable: r.claimableAmount || 0 };
    }
  });

  const isAllSelected = selectedYear === 'all';
  const selectedYearNum = !isAllSelected ? Number(selectedYear) : null;
  const currentYearStats = selectedYearNum ? statsByYear[selectedYearNum] : null;

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Tax Assessment Year Filter</span>
              <span className="text-[10px] font-normal text-slate-400 normal-case">
                (Section 82A 7-Year Statutory Horizon)
              </span>
            </h3>
          </div>
        </div>

        {/* Selected Year status summary / reset */}
        <div className="flex items-center gap-2 text-xs">
          {!isAllSelected && (
            <button
              onClick={() => onSelectYear('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Show All Years</span>
            </button>
          )}
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            {isAllSelected
              ? `All Years (${totalAllCount} docs • ${formatCurrency(totalAllClaimable)})`
              : `YA ${selectedYear} (${currentYearStats?.count || 0} docs • ${formatCurrency(currentYearStats?.totalClaimable || 0)})`}
          </span>
        </div>
      </div>

      {/* Year Toggle Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        {/* 'All Years' Button */}
        <button
          onClick={() => onSelectYear('all')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
            isAllSelected
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-950/40'
              : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>All Years</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              isAllSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalAllCount}
          </span>
        </button>

        {/* Individual Year Toggles */}
        {statutoryYears.map((yr) => {
          const isSelected = selectedYear === String(yr);
          const yrStats = statsByYear[yr] || { count: 0, totalClaimable: 0 };
          const hasReceipts = yrStats.count > 0;
          const isCurrentActive = yr === activeTaxYear;

          return (
            <button
              key={yr}
              onClick={() => onSelectYear(String(yr))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border relative ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-300 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                  : hasReceipts
                  ? 'bg-slate-950 text-slate-200 hover:text-white hover:border-slate-700 border-slate-800'
                  : 'bg-slate-950/50 text-slate-400 hover:text-slate-300 border-slate-900/60 opacity-70'
              }`}
              title={`Tax Year ${yr} • ${yrStats.count} receipts • ${formatCurrency(yrStats.totalClaimable)}`}
            >
              <div className="flex flex-col items-start leading-none">
                <span className="flex items-center gap-1">
                  <span>YA {yr}</span>
                  {isCurrentActive && (
                    <span
                      className={`text-[9px] px-1 rounded uppercase font-bold tracking-tight ${
                        isSelected ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      Current
                    </span>
                  )}
                </span>
                {hasReceipts && (
                  <span
                    className={`text-[9px] font-mono mt-0.5 ${
                      isSelected ? 'text-slate-900 font-bold' : 'text-emerald-400/90'
                    }`}
                  >
                    {formatCurrency(yrStats.totalClaimable)}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected
                    ? 'bg-slate-950 text-emerald-400'
                    : hasReceipts
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {yrStats.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic guidance banner when a year is active */}
      {!isAllSelected && (
        <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <span>
            Filtering strictly by <strong className="text-white font-bold">Assessment Year {selectedYear}</strong>.
            Showing {currentYearStats?.count || 0} verified documents.
          </span>
          <span className="font-mono text-slate-400">
            Retain until 31 Dec {Number(selectedYear) + 7} (Sec 82A)
          </span>
        </div>
      )}
    </div>
  );
};

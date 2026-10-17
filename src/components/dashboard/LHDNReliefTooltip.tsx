import React, { useState } from 'react';
import { HelpCircle, Check, X, Shield, Info } from 'lucide-react';
import { LHDN_STATUTORY_RELIEFS_MAPPING } from '../../constants/lhdnReliefs';

interface LHDNReliefTooltipProps {
  reliefName: string;
  reliefId?: string;
  className?: string;
}

export const LHDNReliefTooltip: React.FC<LHDNReliefTooltipProps> = ({
  reliefName,
  reliefId,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Match relief definition from statutory mapping
  const definition = LHDN_STATUTORY_RELIEFS_MAPPING.find((def) => {
    if (reliefId && def.id === reliefId) return true;
    return (
      def.name.toLowerCase().includes(reliefName.toLowerCase()) ||
      reliefName.toLowerCase().includes(def.name.toLowerCase())
    );
  });

  if (!definition) return null;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-1 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition focus:outline-none"
        title="View Official LHDN Eligibility Requirements"
        aria-label="LHDN Eligibility Information"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Interactive Tooltip Popover Card */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-80 p-4 rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-2xl text-slate-200 text-xs space-y-2.5 animate-fade-in pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px]">
                <Shield className="w-3.5 h-3.5" />
                <span>LHDN Eligibility Guide</span>
              </div>
              <h5 className="font-bold text-white text-xs mt-0.5">{definition.name}</h5>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              {definition.section}
            </span>
          </div>

          {/* Max Limit & Summary */}
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {definition.description}
          </p>

          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">Statutory Cap:</span>
            <span className="font-bold text-emerald-400">
              RM {definition.maxLimit.toLocaleString('en-MY')}
            </span>
          </div>

          {/* Eligible vs Ineligible Items */}
          <div className="space-y-2 pt-1">
            {/* Eligible items */}
            <div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Allowable Claim Items:</span>
              </span>
              <ul className="mt-1 space-y-1 pl-1">
                {definition.eligibleItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ineligible items */}
            {definition.ineligibleItems && definition.ineligibleItems.length > 0 && (
              <div>
                <span className="text-[10px] font-extrabold uppercase text-rose-400 flex items-center gap-1">
                  <X className="w-3 h-3 text-rose-400" />
                  <span>Strictly Excluded / Non-Deductible:</span>
                </span>
                <ul className="mt-1 space-y-1 pl-1">
                  {definition.ineligibleItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

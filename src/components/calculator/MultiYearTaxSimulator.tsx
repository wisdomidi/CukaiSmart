import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  DollarSign,
  Scale,
} from 'lucide-react';
import {
  DEFAULT_MALAYSIA_BRACKETS,
  calculateTaxForChargeableIncome,
  formatCurrency,
} from '../../utils/taxEngine';

interface MultiYearTaxSimulatorProps {
  grossAnnualIncome: number;
}

interface YearRuleProfile {
  year: number;
  label: string;
  badge: string;
  personalRelief: number;
  lifestyleCap: number;
  sportsCap: number;
  medicalCap: number;
  dentalMedicalCheckupCap: number;
  evChargingCap: number;
  childcareCap: number;
  sspnCap: number;
  epfCap: number;
  lifeInsuranceCap: number;
  prsCap: number;
  notes: string[];
}

const YEAR_PROFILES: YearRuleProfile[] = [
  {
    year: 2024,
    label: 'Assessment Year 2024',
    badge: 'Historic Baseline',
    personalRelief: 9000,
    lifestyleCap: 2500,
    sportsCap: 500, // Pre-budget limit
    medicalCap: 8000,
    dentalMedicalCheckupCap: 500,
    evChargingCap: 2500,
    childcareCap: 3000,
    sspnCap: 8000,
    epfCap: 4000,
    lifeInsuranceCap: 3000,
    prsCap: 3000,
    notes: [
      'Sports relief capped at RM 500 for equipment only (gym membership excluded).',
      'Medical serious illness capped at RM 8,000; dental capped at RM 500.',
    ],
  },
  {
    year: 2025,
    label: 'Assessment Year 2025',
    badge: 'Budget 2025 Reforms',
    personalRelief: 9000,
    lifestyleCap: 2500,
    sportsCap: 1000, // Doubled to RM 1,000 and expanded to gym fees
    medicalCap: 10000, // Increased to RM 10,000
    dentalMedicalCheckupCap: 1000,
    evChargingCap: 2500,
    childcareCap: 3000,
    sspnCap: 8000,
    epfCap: 4000,
    lifeInsuranceCap: 3000,
    prsCap: 3000,
    notes: [
      'Sports relief doubled to RM 1,000, covering gym memberships and coaching fees.',
      'Medical cap expanded to RM 10,000, dental up to RM 1,000, autism/ADHD therapy up to RM 4,000.',
    ],
  },
  {
    year: 2026,
    label: 'Assessment Year 2026',
    badge: 'Current Fiscal Gazette',
    personalRelief: 9000,
    lifestyleCap: 2500,
    sportsCap: 1000,
    medicalCap: 10000,
    dentalMedicalCheckupCap: 1000,
    evChargingCap: 2500, // Extended EV incentive
    childcareCap: 3000,
    sspnCap: 8000,
    epfCap: 4000,
    lifeInsuranceCap: 3000,
    prsCap: 3000,
    notes: [
      'Full MyInvois e-Invoicing integration mandate.',
      'EV Charging Equipment (RM 2,500) gazette extended.',
      'Comprehensive preventive medicine & diagnostic screenings qualifying.',
    ],
  },
];

export const MultiYearTaxSimulator: React.FC<MultiYearTaxSimulatorProps> = ({
  grossAnnualIncome,
}) => {
  // Configurable simulated taxpayer expenditures
  const [sportsSpending, setSportsSpending] = useState<number>(1000);
  const [medicalSpending, setMedicalSpending] = useState<number>(3500);
  const [lifestyleSpending, setLifestyleSpending] = useState<number>(2500);
  const [evSpending, setEvSpending] = useState<number>(1500);
  const [sspnSpending, setSspnSpending] = useState<number>(4000);
  const [epfSpending, setEpfSpending] = useState<number>(4000);

  // Compute tax outcomes for each year
  const results = YEAR_PROFILES.map((profile) => {
    // Calculate total allowed reliefs under this year's statutory limits
    const allowedPersonal = profile.personalRelief;
    const allowedSports = Math.min(sportsSpending, profile.sportsCap);
    const allowedMedical = Math.min(medicalSpending, profile.medicalCap);
    const allowedLifestyle = Math.min(lifestyleSpending, profile.lifestyleCap);
    const allowedEv = Math.min(evSpending, profile.evChargingCap);
    const allowedSspn = Math.min(sspnSpending, profile.sspnCap);
    const allowedEpf = Math.min(epfSpending, profile.epfCap);

    const totalReliefs =
      allowedPersonal +
      allowedSports +
      allowedMedical +
      allowedLifestyle +
      allowedEv +
      allowedSspn +
      allowedEpf;

    const chargeableIncome = Math.max(0, grossAnnualIncome - totalReliefs);
    const taxCalc = calculateTaxForChargeableIncome(chargeableIncome, DEFAULT_MALAYSIA_BRACKETS);
    const taxWithoutRelief = calculateTaxForChargeableIncome(
      Math.max(0, grossAnnualIncome - allowedPersonal),
      DEFAULT_MALAYSIA_BRACKETS
    );
    const taxSavedByReliefs = Math.max(0, taxWithoutRelief.taxPayable - taxCalc.taxPayable);

    return {
      profile,
      totalReliefs,
      chargeableIncome,
      taxPayable: taxCalc.taxPayable,
      marginalRate: taxCalc.marginalRate,
      effectiveRate: taxCalc.effectiveRate,
      taxSavedByReliefs,
      monthlyPCB: Math.round((taxCalc.taxPayable / 12) * 100) / 100,
    };
  });

  const res2024 = results.find((r) => r.profile.year === 2024)!;
  const res2026 = results.find((r) => r.profile.year === 2026)!;
  const netSavingsAdvantage = Math.max(0, res2024.taxPayable - res2026.taxPayable);

  return (
    <div className="space-y-6">
      {/* Advantage Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Budget Reform Benefit (YA 2024 vs YA 2026)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              You Save {formatCurrency(netSavingsAdvantage)} Extra in Tax Under Current Rules
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Expanded sports caps and modern medical treatments reduce your net taxable income without earning less!
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-right self-stretch sm:self-auto">
          <span className="text-[10px] text-emerald-300 block font-medium">Net Tax Liability Difference</span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            -{formatCurrency(netSavingsAdvantage)}
          </span>
        </div>
      </div>

      {/* Interactive Expense Sliders */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Adjust Expenditure Scenarios</h4>
          </div>
          <span className="text-xs text-slate-400">
            Annual Gross Income: <strong className="text-emerald-400">{formatCurrency(grossAnnualIncome)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Sports &amp; Fitness (Gym/Gear)</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(sportsSpending)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="100"
              value={sportsSpending}
              onChange={(e) => setSportsSpending(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Cap: RM 500 (2024) vs RM 1,000 (2025/2026)</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Medical &amp; Checkups</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(medicalSpending)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="12000"
              step="250"
              value={medicalSpending}
              onChange={(e) => setMedicalSpending(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Cap: RM 8,000 (2024) vs RM 10,000 (2025/2026)</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>EV Charging Facility</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(evSpending)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3000"
              step="100"
              value={evSpending}
              onChange={(e) => setEvSpending(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Max limit: RM 2,500/year</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Lifestyle (Laptop/Books/Wifi)</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(lifestyleSpending)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3500"
              step="100"
              value={lifestyleSpending}
              onChange={(e) => setLifestyleSpending(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Max limit: RM 2,500/year</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>SSPN-i Education Savings</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(sspnSpending)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="8000"
              step="500"
              value={sspnSpending}
              onChange={(e) => setSspnSpending(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Max limit: RM 8,000/year</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>EPF Employee Contribution</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(epfSpending)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="6000"
              step="200"
              value={epfSpending}
              onChange={(e) => setEpfSpending(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Max limit: RM 4,000/year</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map((res) => {
          const isCurrent = res.profile.year === 2026;
          return (
            <div
              key={res.profile.year}
              className={`p-5 rounded-2xl border transition-all relative ${
                isCurrent
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/30 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow-sm">
                  Active Tax Year
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`w-4 h-4 ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}`} />
                <h4 className="text-base font-bold text-white">{res.profile.label}</h4>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 mb-4">
                {res.profile.badge}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Claimable Reliefs:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(res.totalReliefs)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Chargeable Income:</span>
                  <span className="font-bold text-white font-mono">
                    {formatCurrency(res.chargeableIncome)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Marginal Tax Rate:</span>
                  <span className="font-bold text-cyan-400 font-mono">
                    {(res.marginalRate * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 mt-3">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Annual Tax Payable</span>
                  <div className="text-xl font-black text-white font-mono">
                    {formatCurrency(res.taxPayable)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Estimated Monthly PCB: {formatCurrency(res.monthlyPCB)}
                  </span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Total Tax Saved by Reliefs:</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    +{formatCurrency(res.taxSavedByReliefs)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Gazette Highlights:
                  </span>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    {res.profile.notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 text-xs mt-0.5">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

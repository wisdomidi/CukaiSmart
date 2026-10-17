import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Zap,
  DollarSign,
  Clock,
  Lock,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Server,
  Database,
  Cloud,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  Eye,
  Building2,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { isUserAdmin } from '../../services/firebase';
import { formatCurrency } from '../../utils/taxEngine';

export const HubFinOpsTab: React.FC<{ onNavigateToAdmin?: () => void }> = ({
  onNavigateToAdmin,
}) => {
  const { receipts, activeTaxYear, persona, currentUser } = useTax();
  const isAdmin = isUserAdmin(currentUser);

  // Active Sub-tab
  const [activeSection, setActiveSection] = useState<'roi' | 'architecture' | 'gazette' | 'governance'>('roi');

  // ROI Modeling Parameters
  const initialReceiptCount = Math.max(12, receipts.length || 60);
  const [receiptCount, setReceiptCount] = useState<number>(initialReceiptCount);
  const [hourlyHumanRate, setHourlyHumanRate] = useState<number>(45); // RM 45/hr benchmark
  const [humanMinutesPerDoc, setHumanMinutesPerDoc] = useState<number>(12); // 12 mins manual processing
  const [copied, setCopied] = useState(false);

  // Real Cost Computations
  const totalHumanMinutes = receiptCount * humanMinutesPerDoc;
  const totalHumanHours = Math.round((totalHumanMinutes / 60) * 10) / 10;
  const totalHumanLaborCost = Math.round(totalHumanHours * hourlyHumanRate);

  const totalAiCost = 0; // Standard processing
  const directLaborSavings = totalHumanLaborCost;
  const costReductionPercent = 100;
  const timeSavedHours = totalHumanHours;

  const estimatedOmittedReliefs = Math.round(receiptCount * 0.082 * 110);
  const potentialTaxLossAvoided = Math.round(estimatedOmittedReliefs * 0.19);
  const totalEconomicValueCreated = directLaborSavings + potentialTaxLossAvoided;

  const handleCopySummary = () => {
    const summary = `CukaiSmart Tax Savings Audit (YA ${activeTaxYear}):
- Document Volume: ${receiptCount} receipts modeled
- Manual Bookkeeping Cost: RM ${totalHumanLaborCost.toLocaleString()} (${totalHumanHours} hrs @ RM ${hourlyHumanRate}/hr)
- CukaiSmart Platform Cost: RM 0.00
- Direct Operational Savings: RM ${directLaborSavings.toLocaleString()} (100% reduction)
- Processing Time Saved: ${timeSavedHours} hours
- Audit Risk Mitigation: RM ${potentialTaxLossAvoided} in saved tax deductions
- Total Value Created: RM ${totalEconomicValueCreated.toLocaleString()}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-28 md:pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Platform Infrastructure &amp; Tax ROI Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Financial &amp; Tax Optimization Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Interactive return-on-investment modeling, system security standards, and live LHDN statutory tax relief gazette status.
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl shrink-0 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSection('roi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'roi'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Tax Savings ROI</span>
          </button>
          <button
            onClick={() => setActiveSection('architecture')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'architecture'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>System Infrastructure</span>
          </button>
          <button
            onClick={() => setActiveSection('gazette')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'gazette'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>LHDN Gazette Rules</span>
          </button>
          <button
            onClick={() => setActiveSection('governance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'governance'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security &amp; Privacy</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: TAX SAVINGS ROI CALCULATOR                                 */}
      {/* ===================================================================== */}
      {activeSection === 'roi' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Traditional Manual Bookkeeping</span>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-rose-400 font-mono">
                RM {totalHumanLaborCost.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {totalHumanHours} hours @ RM {hourlyHumanRate}/hr
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Automated Platform Cost</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                RM 0.00
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                Standard Automated Processing
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Direct Labor Savings</span>
                <TrendingDown className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300 font-mono">
                RM {directLaborSavings.toLocaleString()}
              </div>
              <div className="text-[11px] text-cyan-400/80 mt-1">
                100% time &amp; labor cost reduction
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Total Economic Value</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-300 font-mono">
                RM {totalEconomicValueCreated.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                Includes RM {potentialTaxLossAvoided} tax deductions secured
              </div>
            </div>
          </div>

          {/* Interactive Calculator Inputs */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Tax Savings &amp; Efficiency Modeler</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust document volumes and labor rates to calculate your personal or enterprise cost savings.
                </p>
              </div>

              <button
                onClick={handleCopySummary}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Audit Summary Copied!' : 'Copy Savings Summary'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Parameter 1: Document Volume */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-200">Annual Document Volume</label>
                  <span className="font-mono font-bold text-emerald-400">{receiptCount} receipts</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="500"
                  step="6"
                  value={receiptCount}
                  onChange={(e) => setReceiptCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <button onClick={() => setReceiptCount(12)} className="hover:text-white cursor-pointer">12 (Personal)</button>
                  <button onClick={() => setReceiptCount(60)} className="hover:text-white cursor-pointer">60 (Individual)</button>
                  <button onClick={() => setReceiptCount(200)} className="hover:text-white cursor-pointer">200 (Freelancer)</button>
                  <button onClick={() => setReceiptCount(500)} className="hover:text-white cursor-pointer">500 (SME)</button>
                </div>
              </div>

              {/* Parameter 2: Human Labor Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-200">Human Bookkeeping Rate</label>
                  <span className="font-mono font-bold text-cyan-400">RM {hourlyHumanRate}/hr</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="5"
                  value={hourlyHumanRate}
                  onChange={(e) => setHourlyHumanRate(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>RM 20 (Clerk)</span>
                  <span>RM 45 (Benchmark)</span>
                  <span>RM 120 (Senior)</span>
                </div>
              </div>

              {/* Parameter 3: Minutes Per Receipt */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-200">Processing Time per Doc</label>
                  <span className="font-mono font-bold text-amber-400">{humanMinutesPerDoc} minutes</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  step="1"
                  value={humanMinutesPerDoc}
                  onChange={(e) => setHumanMinutesPerDoc(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-950 rounded-lg cursor-pointer h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>3m (Quick)</span>
                  <span>12m (Manual OCR + Caps)</span>
                  <span>30m (Complex)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: SYSTEM INFRASTRUCTURE                                      */}
      {/* ===================================================================== */}
      {activeSection === 'architecture' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Enterprise Platform Architecture</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              CukaiSmart operates on a cloud-native architecture combining real-time AI multimodal parsing, local 256-bit cryptographic document vaulting, and automatic Section 46 statutory cap verification.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Zap className="w-4 h-4" />
                  <span>Sub-Second AI Extraction</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Processes paper receipts and digital invoices in ~1.2 seconds, extracting merchant SSM numbers, TINs, totals, and individual line items.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>7-Year Cryptographic Vault</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seals stored documents with SHA-256 tamper-evident hashes to meet Section 82A statutory audit retention mandates through 31 December {activeTaxYear + 7}.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>PDPA Privacy Protection</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatic data redaction shields private phone numbers, IC numbers, and personal details before processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: LHDN GAZETTE TAX RULES                                     */}
      {/* ===================================================================== */}
      {activeSection === 'gazette' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>Official LHDN Gazette &amp; Tax Relief Schedule</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Active statutory tax relief categories and deduction caps for Assessment Year {activeTaxYear}.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                YA {activeTaxYear} Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Medical &amp; Dental Relief</span>
                  <span className="font-mono text-emerald-400 font-bold">RM 10,000 Cap</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Section 46(1)(c) &amp; (g) ITA 1967: Comprehensive medical expenses, complete medical check-ups (RM 1,000 cap), and dental treatment (RM 1,000 cap).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Lifestyle Relief</span>
                  <span className="font-mono text-emerald-400 font-bold">RM 2,500 Cap</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Section 46(1)(p) &amp; (u) ITA 1967: Books, journals, smartphones, personal computers, tablets, and home broadband subscriptions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Sports Equipment &amp; Gym</span>
                  <span className="font-mono text-emerald-400 font-bold">RM 1,000 Cap</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Section 46(1)(q) ITA 1967: Sports equipment, facility rentals, competition fees, and gym memberships under Sports Development Act 1997.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">EV Charging Equipment</span>
                  <span className="font-mono text-emerald-400 font-bold">RM 2,500 Cap</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Section 46(1)(v) ITA 1967: Purchase, installation, or rental of Electric Vehicle (EV) charging equipment and facilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 4: SECURITY & PRIVACY                                         */}
      {/* ===================================================================== */}
      {activeSection === 'governance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Security, Privacy &amp; Access Controls</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              CukaiSmart implements strict user privacy guarantees and role-based access boundaries to keep taxpayer records protected.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Taxpayer Data Privacy</span>
                </div>
                <ul className="space-y-1.5 text-slate-400 text-xs list-disc list-inside">
                  <li>Individual receipts and tax data are private to your authenticated session.</li>
                  <li>Local PIN protection isolates vault contents on shared devices.</li>
                  <li>SHA-256 cryptographic hashes guarantee record integrity during tax filing.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>System Administration</span>
                </div>
                <ul className="space-y-1.5 text-slate-400 text-xs list-disc list-inside">
                  <li>System configuration and administrative monitoring are gated at <code className="text-purple-300 font-mono">/admin</code>.</li>
                  <li>Role-based redirection ensures standard user accounts land on taxpayer dashboards.</li>
                  <li>Authorized administrators manage system users and global compliance settings.</li>
                </ul>
              </div>
            </div>

            {onNavigateToAdmin && (
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isAdmin ? 'Authenticated Administrator' : 'Administrator Portal'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isAdmin
                      ? 'You hold administrative clearance for platform configuration.'
                      : 'Authorized system administrators can log in at /admin.'}
                  </span>
                </div>

                <button
                  onClick={onNavigateToAdmin}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer border border-slate-700"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isAdmin ? 'Open Console (/admin)' : 'Admin Login (/admin)'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

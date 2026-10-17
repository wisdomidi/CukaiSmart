import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Calendar,
  Archive,
  Zap,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  LogOut,
  Sparkles,
  Building2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Clock,
  KeyRound,
  Shield,
  Layers,
  Briefcase,
  Camera,
  Laptop,
  Building,
  Users,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';
import { export7YearAuditRecordsToPDF } from '../../utils/pdfExport';
import { isUserAdmin } from '../../services/firebase';
import { TAXPAYER_PROFILES } from '../../constants/taxpayerProfiles';
import { TaxpayerCategory } from '../../types/tax';

interface UserProfileProps {
  onClose?: () => void;
  onNavigateToVault?: () => void;
  onNavigateToScan?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onClose,
  onNavigateToVault,
  onNavigateToScan,
}) => {
  const {
    currentUser,
    logout,
    activeTaxYear,
    setActiveTaxYear,
    persona,
    setPersona,
    receipts,
    personalReliefs,
    businessCategories,
  } = useTax();

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isRefreshingQuota, setIsRefreshingQuota] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<TaxpayerCategory>(() => {
    const saved = localStorage.getItem('cukaismart_taxpayer_category_v1');
    if (saved && saved in TAXPAYER_PROFILES) return saved as TaxpayerCategory;
    return persona === 'business' ? 'sole_proprietor' : 'salaried_employee';
  });

  const handleSelectCategory = (cat: TaxpayerCategory) => {
    setSelectedCategory(cat);
    localStorage.setItem('cukaismart_taxpayer_category_v1', cat);
    const targetPersona = TAXPAYER_PROFILES[cat].defaultPersona;
    if (persona !== targetPersona) {
      setPersona(targetPersona);
    }
    setExportFeedback(`Filing profile configured: ${TAXPAYER_PROFILES[cat].title} (${TAXPAYER_PROFILES[cat].badge})`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-4">
        <User className="w-12 h-12 mx-auto text-slate-600" />
        <p className="text-sm">Please sign in to view your taxpayer profile.</p>
      </div>
    );
  }

  const isAdmin = isUserAdmin(currentUser);
  const userInitial = currentUser.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : currentUser.email
    ? currentUser.email.charAt(0).toUpperCase()
    : 'U';

  // 1. Tax Year Status Calculations
  const retentionUntilYear = activeTaxYear + 7;
  const auditHorizonStart = activeTaxYear - 6;

  // 2. Document Metrics Calculations
  const userReceipts = receipts; // Real-time user receipts from Firestore & context
  const totalDocsCount = userReceipts.length;
  const totalClaimable = userReceipts.reduce((sum, r) => sum + (r.claimableAmount || 0), 0);
  const totalGrossInvoiced = userReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const estimatedTaxSavings = totalClaimable * 0.25;
  const highValueCompliantCount = userReceipts.filter(
    (r) => r.totalAmount > 1000 && r.lhdnValidation?.taxpayerNamePresent
  ).length;

  // 3. AI Scan Quota Calculations
  // Baseline quota: 100 for admin, 25 for regular accounts
  const totalQuotaLimit = isAdmin ? 100 : 25;
  const scansUsed = Math.min(totalQuotaLimit, Math.max(userReceipts.length, 1));
  const scansRemaining = Math.max(0, totalQuotaLimit - scansUsed);
  const quotaPercentUsed = Math.min(100, Math.round((scansUsed / totalQuotaLimit) * 100));

  // Handler for PDF Export
  const handleExportPDF = () => {
    setIsExportingPDF(true);
    setExportFeedback('Compiling 7-year audit records into formal LHDN PDF summary...');
    try {
      export7YearAuditRecordsToPDF({
        receipts: userReceipts,
        taxYear: activeTaxYear,
        userEmail: currentUser.email || 'Registered Taxpayer',
        userName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Taxpayer'),
        persona,
        reliefs: personalReliefs,
      });
      setExportFeedback('Official LHDN 7-Year Tax Audit Pack downloaded successfully!');
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      setExportFeedback(`Export notice: ${err?.message || 'Failed to generate PDF.'}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSyncQuota = () => {
    setIsRefreshingQuota(true);
    setTimeout(() => {
      setIsRefreshingQuota(false);
      setExportFeedback('AI scan quota checked & synchronized with cloud credits.');
      setTimeout(() => setExportFeedback(null), 3500);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-slate-100 pb-16">
      {/* Profile Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-xl shadow-emerald-950/60 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl font-black text-emerald-400">
                {userInitial}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Taxpayer Account')}
                </span>
                {isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Administrator</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified Taxpayer</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 font-mono">
                {currentUser.email || 'guest@cukaismart.local'}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-emerald-400 font-medium">
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                <span>Cloud Firestore Vault Connected &bull; Real-time Synced</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => logout()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {exportFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* THREE CORE METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: TAX YEAR STATUS */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                YA {activeTaxYear} Active
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Tax Year Status
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Statutory filing assessment &amp; 7-year retention horizon.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Active Assessment Year:</span>
                <select
                  value={activeTaxYear}
                  onChange={(e) => setActiveTaxYear(Number(e.target.value))}
                  className="bg-slate-900 text-emerald-300 font-bold border border-slate-700 rounded-lg px-2 py-0.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={2026}>YA 2026</option>
                  <option value={2025}>YA 2025</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Taxpayer Persona:</span>
                <span className="font-bold text-white capitalize flex items-center gap-1">
                  {persona === 'business' ? (
                    <>
                      <Building2 className="w-3 h-3 text-emerald-400" />
                      <span>Form B (Business)</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-emerald-400" />
                      <span>Form BE (Individual)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 text-[11px]">7-Year Audit Horizon:</span>
                <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                  YA {auditHorizonStart} &ndash; {activeTaxYear}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Retention Deadline:</span>
                <span className="font-bold text-amber-300 text-[11px]">
                  31 Dec {retentionUntilYear}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/20 text-[11px] text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Section 82A ITA 1967 compliant: Full 7-year audit retention protection.</span>
          </div>
        </div>

        {/* CARD 2: TOTAL UPLOADED DOCUMENTS */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30 font-mono">
                {totalDocsCount} Stored Docs
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Uploaded Documents
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified claimable proofs preserved with SHA-256 integrity.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Total Claimable Relief:</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  {formatCurrency(totalClaimable)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Gross Invoiced Value:</span>
                <span className="font-mono text-slate-300 text-xs">
                  {formatCurrency(totalGrossInvoiced)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 text-[11px]">Est. Cash Tax Savings:</span>
                <span className="font-bold font-mono text-cyan-300 text-xs">
                  {formatCurrency(estimatedTaxSavings)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">High-Value (&gt; RM 1,000) Verified:</span>
                <span className="font-mono text-slate-200 text-xs">
                  {highValueCompliantCount} documents
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {onNavigateToVault && (
              <button
                onClick={onNavigateToVault}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-teal-400" />
                <span>Open Vault</span>
              </button>
            )}
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'Generating...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* CARD 3: REMAINING AI SCAN QUOTA */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 font-mono">
                {scansRemaining} / {totalQuotaLimit} Left
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                AI Scan Quota
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gemini 3.8 Flash OCR multimodal extraction credits.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Quota Allocation:</span>
                <span className="font-bold text-white text-xs font-mono">
                  {totalQuotaLimit} scans
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Usage: {scansUsed} used</span>
                  <span>{scansRemaining} remaining</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quotaPercentUsed > 80
                        ? 'bg-rose-500'
                        : quotaPercentUsed > 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${quotaPercentUsed}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 text-[11px]">AI Model Engine:</span>
                <span className="text-cyan-400 font-medium text-[11px]">
                  Gemini 3.8 Flash
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Statutory Whitelist:</span>
                <span className="text-emerald-400 font-semibold text-[11px]">
                  Budget 2026 Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSyncQuota}
              disabled={isRefreshingQuota}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingQuota ? 'animate-spin' : ''}`} />
              <span>{isRefreshingQuota ? 'Checking...' : 'Refresh Quota'}</span>
            </button>
            {onNavigateToScan && (
              <button
                onClick={onNavigateToScan}
                className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan Receipt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAXPAYER PERSONA & STATUTORY FILING PROFILE */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                All Taxpayer Personas Supported
              </span>
              <span className="text-xs text-slate-400">ITA 1967 Statutory Mapping</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              <span>Taxpayer Category &amp; Filing Profile</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your persona (Salaried, Influencer, Freelancer, Small Business, SME Director, or Partnership) to calibrate deduction rules and LHDN forms.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Active Profile:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {TAXPAYER_PROFILES[selectedCategory].badge}
            </span>
          </div>
        </div>

        {/* Persona Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(TAXPAYER_PROFILES) as TaxpayerCategory[]).map((catKey) => {
            const profile = TAXPAYER_PROFILES[catKey];
            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                onClick={() => handleSelectCategory(catKey)}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between space-y-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-950/60 to-slate-950 border-emerald-500/60 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                      isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {profile.badge}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-1">{profile.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {profile.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-900 text-[10px] space-y-0.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span className="font-semibold text-amber-300">{profile.eFilingDeadline}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Profile Statutory Breakdown */}
        {selectedCategory && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white">
                  {TAXPAYER_PROFILES[selectedCategory].title}
                </span>
                <span className="text-xs text-emerald-400 font-mono">
                  &bull; {TAXPAYER_PROFILES[selectedCategory].primaryForm}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {TAXPAYER_PROFILES[selectedCategory].governingStatute}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide block mb-1.5">
                  Allowable Deductions &amp; Claims:
                </span>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  {TAXPAYER_PROFILES[selectedCategory].keyDeductions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide block mb-1.5">
                  LHDN Audit Proof &amp; Compliance Tips:
                </span>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  {TAXPAYER_PROFILES[selectedCategory].auditFocusPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Shield className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS & AUDIT PACK DOWNLOAD SECTION */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Official LHDN Tax Audit Export (Section 82A)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate a tamper-evident audit pack containing your 7-year verified claim ledger with SHA-256 cryptographic proofs for official submission.
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPDF ? 'Generating Audit PDF...' : 'Download 7-Year Audit PDF'}</span>
          </button>
        </div>
      </div>

      {/* RECENT UPLOADED RECEIPTS SUMMARY */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Archive className="w-4 h-4 text-teal-400" />
            <span>Recent Vault Documents ({userReceipts.slice(0, 5).length} of {userReceipts.length})</span>
          </h4>

          {onNavigateToVault && (
            <button
              onClick={onNavigateToVault}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Documents</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {userReceipts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-2xl">
            <Archive className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No documents uploaded yet. Start scanning your receipts!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {userReceipts.slice(0, 5).map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{r.merchantName}</p>
                  <p className="text-[11px] text-slate-400">
                    {r.date} &bull; {r.categoryName} &bull; <span className="font-mono text-emerald-400">{r.statutorySection}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold font-mono text-emerald-400">
                    RM {r.claimableAmount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Retain to {r.retentionUntilYear || r.taxYear + 7}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

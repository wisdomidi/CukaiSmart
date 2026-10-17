import React, { useState, useEffect } from 'react';
import {
  Archive,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Calendar,
  Clock,
  Download,
  Trash2,
  Eye,
  X,
  Building,
  Lock,
  Unlock,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  MoreVertical,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';
import { ReceiptRecord } from '../../types/tax';
import { exportReceiptsToCSV } from '../../utils/exportHelpers';
import { export7YearAuditRecordsToPDF } from '../../utils/pdfExport';
import { exportTaxYearReceiptsAsZip } from '../../utils/zipExport';
import { VaultAuthLockModal } from './VaultAuthLockModal';
import { TaxAuditReadinessReport } from '../dashboard/TaxAuditReadinessReport';
import { TaxYearFilter } from './TaxYearFilter';
import { ReceiptQuickViewModal } from './ReceiptQuickViewModal';
import { SimpleEnglishTaxTipCard } from '../common/SimpleEnglishTaxTipCard';

export const DocumentVault: React.FC = () => {

  const { receipts, deleteReceipt, activeTaxYear, persona, clearDemoReceipts, personalReliefs, currentUser } = useTax();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedAuditStatus, setSelectedAuditStatus] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [showPurgeModal, setShowPurgeConfirm] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPurging) {
        setShowPurgeConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPurging]);

  // Local Privacy Lock State
  const [hasPinSet, setHasPinSet] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('cukaismart_vault_pin_v1'));
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const pin = localStorage.getItem('cukaismart_vault_pin_v1');
    const lockSetting = localStorage.getItem('cukaismart_vault_lock_enabled_v1');
    return Boolean(pin && lockSetting !== 'false');
  });
  const [showLockModal, setShowLockModal] = useState<boolean>(false);

  const handleSetPinSuccess = (newPin: string) => {
    localStorage.setItem('cukaismart_vault_pin_v1', newPin);
    localStorage.setItem('cukaismart_vault_lock_enabled_v1', 'true');
    setHasPinSet(true);
    setIsLocked(false);
  };

  const handleLockVault = () => {
    if (!hasPinSet) {
      setShowLockModal(true);
      return;
    }
    setIsLocked(true);
    localStorage.setItem('cukaismart_vault_lock_enabled_v1', 'true');
  };

  // Filter receipts
  const filteredReceipts = receipts.filter((rcpt) => {
    // Search match
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      rcpt.merchantName.toLowerCase().includes(q) ||
      rcpt.ssmNumber.toLowerCase().includes(q) ||
      rcpt.categoryName.toLowerCase().includes(q) ||
      rcpt.verificationHash.toLowerCase().includes(q);

    // Year filter
    const matchesYear =
      selectedYearFilter === 'all' || String(rcpt.taxYear) === selectedYearFilter;

    // Audit status filter
    const matchesStatus =
      selectedAuditStatus === 'all' || rcpt.lhdnValidation.auditStatus === selectedAuditStatus;

    return matchesSearch && matchesYear && matchesStatus;
  });

  const totalDeductibleInVault = filteredReceipts.reduce((acc, r) => acc + r.claimableAmount, 0);

  // Section 82A Statutory Retention calculations
  const currentRetainUntil = activeTaxYear + 7;

  // Export 7-Year Audit Records to PDF
  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      export7YearAuditRecordsToPDF({
        receipts: filteredReceipts,
        taxYear: activeTaxYear,
        userEmail: currentUser?.email || 'Registered Taxpayer',
        userName: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Taxpayer'),
        persona,
        reliefs: personalReliefs,
      });
      setPurgeMessage({
        type: 'success',
        text: `Official LHDN 7-Year Statutory Audit Pack PDF generated successfully for YA ${activeTaxYear}!`,
      });
      setTimeout(() => setPurgeMessage(null), 5000);
    } catch (err: any) {
      setPurgeMessage({
        type: 'error',
        text: `Could not generate PDF: ${err?.message || 'Error occurred.'}`,
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Export Tax Year Receipts as Compressed ZIP of Individual PDFs
  const handleExportZip = async () => {
    const targetYear = selectedYearFilter === 'all' ? activeTaxYear : Number(selectedYearFilter);
    const targetReceipts = selectedYearFilter === 'all' ? receipts : filteredReceipts;
    if (!targetReceipts || targetReceipts.length === 0) {
      setPurgeMessage({
        type: 'error',
        text: `No receipts available to export for YA ${targetYear}. Upload or tag receipts before creating ZIP audit pack.`,
      });
      return;
    }
    setIsExportingZip(true);
    try {
      const res = await exportTaxYearReceiptsAsZip({
        receipts: targetReceipts,
        taxYear: targetYear,
        userEmail: currentUser?.email || 'taxpayer@cukaismart.my',
        userName: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Malaysian Taxpayer'),
        persona,
        onProgress: (current, total, message) => {
          setZipProgress({ current, total, message });
        },
      });
      setPurgeMessage({
        type: 'success',
        text: `Exported ${res.count} individual LHDN audit PDFs in archive "${res.fileName}". Ready for tax filing!`,
      });
      setTimeout(() => setPurgeMessage(null), 6000);
    } catch (err: any) {
      setPurgeMessage({
        type: 'error',
        text: `Failed to create ZIP audit pack: ${err?.message || 'Error generating archive.'}`,
      });
    } finally {
      setIsExportingZip(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="space-y-6 pb-28 md:pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Header & Section 82A Statutory Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Zero-Pill Text Metadata Discipline */}
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1.5">
            <Archive className="w-4 h-4 text-emerald-400" />
            <span>Section 82A ITA 1967</span>
            <span aria-hidden="true" className="text-slate-600">&bull;</span>
            <span>7-Year Verified Statutory Storage</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Claimable Documents Vault
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Verified tax-deductible invoices and receipts preserved intact with SHA-256 cryptographic proofs for official LHDN audit submission.
          </p>
        </div>

        {/* Action Export Tool Bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Privacy Security Lock Toggle Button */}
          <button
            onClick={() => {
              if (isLocked) setShowLockModal(true);
              else handleLockVault();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 border shadow-sm cursor-pointer ${
              isLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
            }`}
            title={hasPinSet ? (isLocked ? 'Unlock Vault' : 'Lock Vault Now') : 'Set Up Vault Security PIN'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isLocked ? 'Vault Locked' : hasPinSet ? 'Lock Vault' : 'Set PIN'}</span>
          </button>

          <button
            onClick={() => exportReceiptsToCSV(filteredReceipts, activeTaxYear)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs font-semibold transition active:scale-95 cursor-pointer"
            title="Export receipts to structured CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF || isExportingZip}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs font-semibold active:scale-95 transition disabled:opacity-50 cursor-pointer"
            title="Download official Section 82A 7-year PDF audit pack for LHDN submission"
          >
            {isExportingPDF ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isExportingPDF ? 'Generating...' : '7-Year PDF'}</span>
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExportingZip || isExportingPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer"
            title="Export all receipts tagged for this tax year into a compressed ZIP archive"
          >
            {isExportingZip ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderArchive className="w-3.5 h-3.5" />}
            <span>
              {isExportingZip
                ? 'Compressing...'
                : `YA ${selectedYearFilter === 'all' ? activeTaxYear : selectedYearFilter} ZIP Archive`}
            </span>
          </button>

          <button
            onClick={() => setShowAuditReport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition active:scale-95 cursor-pointer"
            title="View 7-Year Audit Readiness Report"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Readiness</span>
          </button>
        </div>
      </div>

      {/* Simple English 7-Year Vault Tip Card */}
      <SimpleEnglishTaxTipCard topic="7_year_vault" />

      {/* Notification Banner */}

      {purgeMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between gap-2 animate-fade-in ${
            purgeMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{purgeMessage.text}</span>
          </div>
          <button
            onClick={() => setPurgeMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Statutory Retention Countdown Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-white">
              Section 82A ITA 1967 Statutory 7-Year Retention Horizon
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Records for Year of Assessment {activeTaxYear} must be preserved intact through{' '}
              <strong className="text-emerald-400 font-mono">31 December {currentRetainUntil}</strong>. Every stored document is cryptographically sealed with SHA-256 proofs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <span className="text-xs text-slate-300 font-mono font-medium">
            {receipts.length} Documents Preserved
          </span>
          <button
            onClick={() => setShowPurgeConfirm(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Reset & Clear Claims Vault"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tax Assessment Year Filter Component */}
      <TaxYearFilter
        receipts={receipts}
        selectedYear={selectedYearFilter}
        onSelectYear={(yr) => setSelectedYearFilter(yr)}
        activeTaxYear={activeTaxYear}
      />

      {/* Search & Filters Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by merchant, SSM, category, or SHA-256 hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none cursor-pointer w-full sm:w-auto"
              title="Filter by assessment tax year"
            >
              <option value="all">All Tax Years (7-Yr Horizon)</option>
              <option value="2026">YA 2026</option>
              <option value="2025">YA 2025</option>
              <option value="2024">YA 2024</option>
              <option value="2023">YA 2023</option>
              <option value="2022">YA 2022</option>
            </select>

            <select
              value={selectedAuditStatus}
              onChange={(e) => setSelectedAuditStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant Only</option>
              <option value="warning">Audit Warnings</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>
            Showing <strong className="text-white font-mono">{filteredReceipts.length}</strong> of {receipts.length} documents
          </span>
          <span>
            Total Validated Claims:{' '}
            <strong className="text-emerald-400 font-mono font-bold">
              {formatCurrency(totalDeductibleInVault)}
            </strong>
          </span>
        </div>
      </div>

      {/* Receipts List */}
      <div className="space-y-3">
        {filteredReceipts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 space-y-3">
            <Archive className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-white">No documents match the search criteria</p>
            <p className="text-xs">
              {selectedYearFilter !== 'all'
                ? `No receipts tagged for YA ${selectedYearFilter}. Upload receipts or adjust filters.`
                : 'Upload or scan a receipt to store it securely in your 7-year audit vault.'}
            </p>
            {selectedYearFilter !== 'all' && (
              <button
                onClick={() => setSelectedYearFilter('all')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition cursor-pointer mt-2"
              >
                <span>View All Tax Years</span>
              </button>
            )}
          </div>
        ) : (
          filteredReceipts.map((rcpt) => (
            <div
              key={rcpt.id}
              onClick={() => setSelectedReceipt(rcpt)}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/90 transition group space-y-3 cursor-pointer shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      rcpt.lhdnValidation.auditStatus === 'compliant'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : rcpt.lhdnValidation.auditStatus === 'warning'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {rcpt.persona === 'business' ? (
                      <Building className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    {/* Zero-Pill Card Title Header */}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                        {rcpt.merchantName}
                      </h4>
                      <span aria-hidden="true" className="text-slate-600 text-xs">&bull;</span>
                      <span className="text-xs text-slate-400 font-mono font-medium">
                        YA {rcpt.taxYear}
                      </span>
                      <span aria-hidden="true" className="text-slate-600 text-xs">&bull;</span>
                      <span
                        className={`text-xs font-semibold ${
                          rcpt.lhdnValidation.auditStatus === 'compliant'
                            ? 'text-emerald-400'
                            : rcpt.lhdnValidation.auditStatus === 'warning'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {rcpt.lhdnValidation.auditStatus === 'compliant' ? 'Verified Compliant' : rcpt.lhdnValidation.auditStatus === 'warning' ? 'Audit Notice' : 'Flagged'}
                      </span>
                    </div>

                    {/* Clean Inline Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <span>{rcpt.date}</span>
                      <span aria-hidden="true" className="text-slate-600">&bull;</span>
                      <span>SSM {rcpt.ssmNumber || 'Registered'}</span>
                      <span aria-hidden="true" className="text-slate-600">&bull;</span>
                      <span>{rcpt.categoryName} ({rcpt.statutorySection})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {formatCurrency(rcpt.claimableAmount)}
                    </span>
                    <p className="text-[11px] text-slate-500">Total: {formatCurrency(rcpt.totalAmount)}</p>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedReceipt(rcpt)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 transition cursor-pointer"
                      title="Quick View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteReceipt(rcpt.id)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-rose-900/40 text-slate-500 hover:text-rose-300 transition cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* SHA-256 and Retention Line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span className="font-mono truncate max-w-sm text-slate-500">
                  SHA-256: {rcpt.verificationHash}
                </span>
                <span className="text-slate-400 font-medium">
                  Retain until 31 Dec {rcpt.retentionUntilYear} (YA {rcpt.taxYear} + 7 yrs under Sec 82A)
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Official LHDN Audit Summary Report Modal */}
      {showAuditReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl relative my-8 print:m-0 print:p-0">
            <button
              onClick={() => setShowAuditReport(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition print:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Report Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    Lembaga Hasil Dalam Negeri Malaysia
                  </h2>
                  <p className="text-xs font-semibold text-slate-600">
                    Official Statutory Tax Record &amp; Claim Statement (ITA 1967)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    Section 82A Compliance
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1">Generated: {new Date().toLocaleDateString('en-MY')}</p>
                </div>
              </div>
            </div>

            {/* Taxpayer Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-100 text-xs mb-6 font-mono">
              <div>
                <span className="text-slate-500 text-[10px]">Assessment Year</span>
                <p className="font-bold text-slate-900">YA {activeTaxYear}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Filing Persona</span>
                <p className="font-bold text-slate-900 uppercase">
                  {persona === 'individual' ? 'Form BE (Sec 46)' : 'Form B (Sec 33/39)'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Validated Invoices</span>
                <p className="font-bold text-slate-900">{filteredReceipts.length} Documents</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Total Deduction</span>
                <p className="font-bold text-emerald-700">{formatCurrency(totalDeductibleInVault)}</p>
              </div>
            </div>

            {/* Invoices Ledger Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-700">
                    <th className="py-1.5 font-bold">Date</th>
                    <th className="py-1.5 font-bold">Merchant Name &amp; SSM</th>
                    <th className="py-1.5 font-bold">Tax Section</th>
                    <th className="py-1.5 font-bold text-right">Total (RM)</th>
                    <th className="py-1.5 font-bold text-right">Claimable (RM)</th>
                    <th className="py-1.5 font-bold text-center">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredReceipts.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 text-slate-600 font-mono">{r.date}</td>
                      <td className="py-2 font-medium text-slate-900">
                        {r.merchantName}
                        <div className="text-[10px] text-slate-500 font-mono">{r.ssmNumber}</div>
                      </td>
                      <td className="py-2 text-slate-700 text-[11px]">{r.statutorySection}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{r.totalAmount.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-700">
                        {r.claimableAmount.toFixed(2)}
                      </td>
                      <td className="py-2 text-center font-mono text-[10px] text-slate-500 truncate max-w-[90px]">
                        {r.verificationHash.slice(0, 10)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Endorsement Block */}
            <div className="border-t-2 border-slate-300 pt-4 grid grid-cols-2 gap-8 text-xs text-slate-600">
              <div>
                <p className="font-bold text-slate-900 mb-1">Taxpayer Declaration</p>
                <p className="text-[11px] leading-relaxed">
                  I hereby declare that this claim statement and digital vault ledger are supported by valid invoices maintained in compliance with Section 82A of the Income Tax Act 1967.
                </p>
                <div className="mt-8 border-b border-slate-400 w-48" />
                <p className="text-[10px] mt-1 font-mono">Taxpayer Signature / Key</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 mb-1">Audit Verification</p>
                <p className="text-[11px] leading-relaxed">
                  Cryptographic hash integrity verified against HASiL MyInvois registry specs.
                </p>
                <div className="mt-8 border-b border-slate-400 w-48" />
                <p className="text-[10px] mt-1 font-mono">Official Assessment Date</p>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => exportReceiptsToCSV(filteredReceipts, activeTaxYear)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition border border-slate-300 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>CSV Ledger</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-800 transition shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official PDF</span>
              </button>
              <button
                onClick={() => setShowAuditReport(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-semibold text-xs hover:bg-slate-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick-View Modal */}
      {selectedReceipt && (
        <ReceiptQuickViewModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onDelete={(id) => {
            deleteReceipt(id);
            setSelectedReceipt(null);
          }}
        />
      )}

      {/* Vault Auth Lock Modal */}
      {(isLocked || showLockModal) && (
        <VaultAuthLockModal
          isLocked={isLocked}
          hasPinSet={hasPinSet}
          onUnlockSuccess={() => {
            setIsLocked(false);
            setShowLockModal(false);
          }}
          onSetPinSuccess={handleSetPinSuccess}
          onClose={hasPinSet ? () => setShowLockModal(false) : undefined}
        />
      )}

      {/* Purge All Claims Confirmation Modal */}
      {showPurgeModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPurging) setShowPurgeConfirm(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Purge All Claims Vault?</h3>
                <p className="text-xs text-rose-300">Reset local and cloud records</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              This will remove all {receipts.length} documents from your vault and reset claimed tax relief totals to RM 0.00.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={async () => {
                  setIsPurging(true);
                  try {
                    await clearDemoReceipts();
                    setShowPurgeConfirm(false);
                    setPurgeMessage({
                      type: 'success',
                      text: 'Claims vault has been reset.',
                    });
                    setTimeout(() => setPurgeMessage(null), 5000);
                  } catch (err: any) {
                    setPurgeMessage({
                      type: 'error',
                      text: `Failed to purge claims: ${err?.message || 'Error occurred.'}`,
                    });
                  } finally {
                    setIsPurging(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {isPurging && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isPurging ? 'Purging Vault...' : 'Confirm Purge'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Audit Readiness Report Modal */}
      {showAuditReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl my-8">
            <TaxAuditReadinessReport
              onNavigateToScan={() => setShowAuditReport(false)}
              onNavigateToVault={() => setShowAuditReport(false)}
              onClose={() => setShowAuditReport(false)}
            />
          </div>
        </div>
      )}

      {/* Real-time ZIP Export Progress Modal */}
      {isExportingZip && zipProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/20">
              <FolderArchive className="w-6 h-6 animate-bounce" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Generating LHDN Audit Archive</h3>
              <p className="text-xs text-slate-400 mt-1">
                Creating Section 82A audit-grade PDFs and compiling archive...
              </p>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300 truncate max-w-[240px]">{zipProgress.message}</span>
                <span className="text-cyan-400 font-mono">
                  {Math.round((zipProgress.current / zipProgress.total) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (zipProgress.current / zipProgress.total) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

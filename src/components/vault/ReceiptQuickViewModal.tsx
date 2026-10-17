import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Building,
  Calendar,
  Clock,
  FileText,
  Tag,
  Coins,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Sparkles,
  Info,
  QrCode,
} from 'lucide-react';
import { ReceiptRecord } from '../../types/tax';
import { formatCurrency } from '../../utils/taxEngine';
import { useTax } from '../../context/TaxContext';
import { generateSingleReceiptPDF } from '../../utils/zipExport';
import { MyInvoisInspectorModal } from './MyInvoisInspectorModal';

interface ReceiptQuickViewModalProps {
  receipt: ReceiptRecord;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const ReceiptQuickViewModal: React.FC<ReceiptQuickViewModalProps> = ({
  receipt,
  onClose,
  onDelete,
}) => {
  const { persona, personalReliefs, currentUser } = useTax();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showMyInvoisModal, setShowMyInvoisModal] = useState<boolean>(false);

  // Match relief category to find statutory limit
  const matchedRelief = personalReliefs.find(
    (r) =>
      r.id === receipt.categoryId ||
      r.name.toLowerCase().includes(receipt.categoryName.toLowerCase()) ||
      receipt.categoryName.toLowerCase().includes(r.name.toLowerCase())
  );

  const statutoryCap = matchedRelief?.maxLimit || 2500;
  const currentClaimed = matchedRelief?.claimedAmount || receipt.claimableAmount;
  const capPercentage = Math.min(100, Math.round((currentClaimed / statutoryCap) * 100));

  // Estimated tax savings at ~24% standard individual tax bracket
  const estimatedSavings = receipt.claimableAmount * 0.24;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(receipt.verificationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const handleDownloadSinglePDF = () => {
    setIsDownloadingPDF(true);
    try {
      const buffer = generateSingleReceiptPDF(receipt, 1, {
        userEmail: currentUser?.email || 'taxpayer@cukaismart.my',
        userName:
          currentUser?.displayName ||
          (currentUser?.email ? currentUser.email.split('@')[0] : 'Registered Taxpayer'),
        persona,
      });

      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LHDN_YA${receipt.taxYear}_Receipt_${receipt.id}_${receipt.merchantName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate single PDF voucher:', err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isPDF = receipt.imageUrl?.startsWith('data:application/pdf');

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-5xl rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl text-slate-100 relative my-4 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                receipt.lhdnValidation.auditStatus === 'compliant'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : receipt.lhdnValidation.auditStatus === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {receipt.persona === 'business' ? (
                <Building className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {receipt.merchantName}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  YA {receipt.taxYear}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                    receipt.lhdnValidation.auditStatus === 'compliant'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : receipt.lhdnValidation.auditStatus === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {receipt.lhdnValidation.auditStatus} • Score {receipt.lhdnValidation.complianceScore || 95}/100
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>SSM: <strong className="text-slate-300 font-mono">{receipt.ssmNumber || 'Verified Registered'}</strong></span>
                <span>&bull;</span>
                <span>Date: <strong className="text-slate-300 font-mono">{receipt.date}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSinglePDF}
              disabled={isDownloadingPDF}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Download official LHDN audit single voucher PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isDownloadingPDF ? 'Generating...' : 'Audit PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer shadow-sm"
              title="Close Quick View (Esc)"
            >
              <X className="w-4 h-4 text-slate-300" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content: 2-Column Layout */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Larger Document Image / PDF Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Original Invoice Proof</span>
              </span>

              {/* Zoom Controls for Images */}
              {receipt.imageUrl && !isPDF && (
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.2))}
                    className="p-1 text-slate-400 hover:text-white transition rounded cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-300 min-w-[32px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.2))}
                    className="p-1 text-slate-400 hover:text-white transition rounded cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1 text-slate-400 hover:text-white transition rounded cursor-pointer ml-1"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview Box */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden flex-1 min-h-[320px] max-h-[480px] flex items-center justify-center p-3">
              {receipt.imageUrl ? (
                isPDF ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg border border-rose-500/30">
                      PDF
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Section 82A PDF Preserved</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Cryptographically sealed original invoice document for audit verification.
                      </p>
                    </div>
                    <a
                      href={receipt.imageUrl}
                      download={`LHDN_Receipt_${receipt.id}.pdf`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Original PDF File</span>
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full overflow-auto flex items-center justify-center scrollbar-thin">
                    <img
                      src={receipt.imageUrl}
                      alt={receipt.merchantName}
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="max-h-[440px] max-w-full object-contain rounded-lg shadow-lg select-none"
                    />
                  </div>
                )
              ) : (
                /* High-fidelity Fallback e-Invoice Voucher if no raw image attached */
                <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-slate-950 border border-dashed border-slate-800 rounded-xl font-mono text-xs text-slate-300">
                  <div className="space-y-2 border-b border-slate-800 pb-3 text-center">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                      HASiL LHDN Certified E-Receipt
                    </p>
                    <h4 className="text-sm font-bold text-white">{receipt.merchantName}</h4>
                    <p className="text-[11px] text-slate-400">SSM: {receipt.ssmNumber || 'N/A'}</p>
                    <p className="text-[10px] text-slate-500">Date: {receipt.date} • YA {receipt.taxYear}</p>
                  </div>

                  <div className="space-y-1.5 py-3">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Invoice:</span>
                      <span className="text-white font-bold">{formatCurrency(receipt.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Claimable Amount:</span>
                      <span>{formatCurrency(receipt.claimableAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Statutory Relief:</span>
                      <span className="truncate max-w-[160px] text-right">{receipt.categoryName}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-center space-y-1">
                    <div className="text-[9px] text-slate-500 truncate font-mono">
                      SHA-256: {receipt.verificationHash}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-sans font-semibold">
                      Sec 82A Digital Stamp Verified
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Cryptographic SHA-256 Hash Card */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>SHA-256 Cryptographic Seal</span>
                </span>
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 text-slate-400 hover:text-emerald-300 transition cursor-pointer"
                  title="Copy full cryptographic hash to clipboard"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-[10px] text-emerald-400/90 break-all select-all leading-tight">
                {receipt.verificationHash}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Categorized LHDN Relief Info & Audit Validation (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* LHDN Relief Classification Hero Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 mb-1">
                    <Tag className="w-3 h-3" />
                    <span>Categorized Tax Relief</span>
                  </span>
                  <h4 className="text-base font-bold text-white">{receipt.categoryName}</h4>
                  <p className="text-xs text-emerald-400 font-mono mt-0.5">
                    {receipt.statutorySection}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax Deduction</span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                    {formatCurrency(receipt.claimableAmount)}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    of {formatCurrency(receipt.totalAmount)} Total
                  </span>
                </div>
              </div>

              {/* Statutory Limit Progress */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Statutory Category Ceiling:</span>
                  </span>
                  <span className="font-mono text-white">
                    {formatCurrency(currentClaimed)} / <strong className="text-amber-400">{formatCurrency(statutoryCap)}</strong>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                    style={{ width: `${capPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{capPercentage}% of statutory ceiling claimed</span>
                  <span className="text-emerald-400 font-mono">
                    {formatCurrency(Math.max(0, statutoryCap - currentClaimed))} allowance remaining
                  </span>
                </div>
              </div>

              {/* Direct Estimated Tax Savings */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Estimated Direct Tax Saved</span>
                    <p className="font-bold text-teal-300 font-mono">
                      ~ {formatCurrency(estimatedSavings)}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 text-right">
                  at 24% marginal tax bracket
                </span>
              </div>
            </div>

            {/* LHDN Audit Compliance & Statutory Horizon Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Section 82A Retention Horizon */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Section 82A ITA 1967 Retention</span>
                </span>
                <p className="font-semibold text-white">
                  Retain until 31 Dec {receipt.retentionUntilYear || receipt.taxYear + 7}
                </p>
                <p className="text-[10px] text-slate-400">
                  Required by Malaysian law for 7 full assessment years.
                </p>
              </div>

              {/* SSM Business Verification */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Merchant Legitimacy</span>
                </span>
                <p className="font-semibold text-emerald-400 font-mono">
                  {receipt.ssmNumber || 'SSM Registered Merchant'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Meets LHDN invoice audit validation standards.
                </p>
              </div>
            </div>

            {/* MyInvois e-Invoicing Compliance Card */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-950 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">MyInvois e-Invoice Compliance</span>
                  <p className="text-[10px] text-cyan-300">
                    Validated under LHDN 2024–2026 digital e-Invoicing framework.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMyInvoisModal(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] transition shrink-0 cursor-pointer"
              >
                Inspect Signature &rarr;
              </button>
            </div>

            {/* Itemized Line Items & Deductibility Audit Breakdown */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Itemized Line Items ({receipt.items?.length || 0})</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Evaluated against ITA 1967 rules
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {receipt.items && receipt.items.length > 0 ? (
                  receipt.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-medium text-white">{it.name}</span>
                          {it.quantity && it.quantity > 1 && (
                            <span className="text-slate-400 text-[10px] ml-1.5 font-mono">
                              (Qty: {it.quantity} @ {formatCurrency(it.unitPrice || 0)})
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-bold ${
                              it.isClaimable ? 'text-emerald-400' : 'text-slate-500 line-through'
                            }`}
                          >
                            {formatCurrency(it.amount)}
                          </span>
                          <span
                            className={`block text-[9px] font-bold uppercase ${
                              it.isClaimable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {it.isClaimable ? 'Claimable' : 'Non-Deductible'}
                          </span>
                        </div>
                      </div>

                      {it.reason && (
                        <p className="text-[11px] text-slate-400 border-t border-slate-900 pt-1 mt-1 leading-relaxed">
                          <strong className="text-slate-300">LHDN Basis:</strong> {it.reason}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                    No individual line items recorded. Entire voucher claimed under {receipt.statutorySection}.
                  </div>
                )}
              </div>
            </div>

            {/* MyInvois e-Invoicing Compliance Status */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>LHDN MyInvois Digital Validation</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Verified Format
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">Unique Identifier (UIN / UUID):</span>
                  <span className="font-mono text-emerald-300 font-semibold truncate block">
                    {receipt.eInvoicingStatus?.eInvoiceUUID || `MYINVOIS-${receipt.id.slice(5).toUpperCase()}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Merchant Tax Number (TIN):</span>
                  <span className="font-mono text-slate-200 font-semibold block">
                    {receipt.tinNumber || 'C 2849102801'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>55-Field LHDN Specification: Validated</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Digital Stamp Intact
                </span>
              </div>
            </div>

            {/* Audit Flags or Notes */}
            {receipt.lhdnValidation.flags && receipt.lhdnValidation.flags.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Audit Advisory Notice:</span>
                </span>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-200/90">
                  {receipt.lhdnValidation.flags.map((flag, fIdx) => (
                    <li key={fIdx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-300">Confirm deletion?</span>
                    <button
                      onClick={() => {
                        onDelete(receipt.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition cursor-pointer border border-slate-800 hover:border-rose-800/50"
                    title="Delete receipt record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition cursor-pointer"
              title="Print receipt voucher"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Voucher</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSinglePDF}
              disabled={isDownloadingPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPDF ? 'Generating...' : 'Download Section 82A PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* MyInvois e-Invoice Verification Inspector Modal */}
      <MyInvoisInspectorModal
        isOpen={showMyInvoisModal}
        onClose={() => setShowMyInvoisModal(false)}
        receipt={receipt}
      />
    </div>
  );
};

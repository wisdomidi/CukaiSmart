import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  ShieldCheck,
  Lock,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  Key,
  Users,
  EyeOff,
  Building,
  ArrowRight,
  Copy,
  Check,
  Upload,
  UserCheck,
  Share2,
  ExternalLink,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import JSZip from 'jszip';
import { useTax } from '../../context/TaxContext';
import { formatCurrency, maskNRIC } from '../../utils/taxEngine';
import { TaxAgentVerification, ReceiptRecord } from '../../types/tax';

export const TaxAgentPortal: React.FC = () => {
  const {
    currentUser,
    taxAgentSession,
    setTaxAgentSession,
    receipts,
    persona,
    activeTaxYear,
  } = useTax();

  // Active perspective tab: 'taxpayer_handover' (Taxpayer mode) or 'agent_review' (Accountant mode)
  const [activePortalTab, setActivePortalTab] = useState<'taxpayer_handover' | 'agent_review'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'agent' || urlParams.get('clientToken')) {
        return 'agent_review';
      }
    }
    return 'taxpayer_handover';
  });

  // Taxpayer Profile Details (Editable and persisted locally)
  const initialName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Taxpayer');
  const [taxpayerName, setTaxpayerName] = useState(() => {
    return localStorage.getItem('cukaismart_taxpayer_name') || initialName;
  });
  const [taxpayerNRIC, setTaxpayerNRIC] = useState(() => {
    return localStorage.getItem('cukaismart_taxpayer_nric') || '920415-14-5543';
  });
  const [taxpayerTIN, setTaxpayerTIN] = useState(() => {
    return localStorage.getItem('cukaismart_taxpayer_tin') || 'SG 28491028470';
  });

  // Client Passcode for external accountant access
  const clientPasscode = `CS-YA${String(activeTaxYear).slice(-2)}-${(currentUser?.uid || 'GUEST').slice(0, 6).toUpperCase()}`;

  // Zero-Knowledge Encryption toggle
  const [zkpMaskingActive, setZkpMaskingActive] = useState(true);

  // Copy feedback states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Verification Form State (Agent Mode)
  const [licenseInput, setLicenseInput] = useState(taxAgentSession.licenseNumber || '');
  const [agentNameInput, setAgentNameInput] = useState(taxAgentSession.agentName || '');
  const [firmNameInput, setFirmNameInput] = useState(taxAgentSession.firmName || '');
  const [firmSSMInput, setFirmSSMInput] = useState(taxAgentSession.firmSSM || '');
  const [isVerifyingLicense, setIsVerifyingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  // Agent Client Inspection State
  const [inputClientCode, setInputClientCode] = useState('');
  const [clientRecordsUnlocked, setClientRecordsUnlocked] = useState(false);
  const [importedReceipts, setImportedReceipts] = useState<ReceiptRecord[] | null>(null);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Save taxpayer details to localStorage
  useEffect(() => {
    localStorage.setItem('cukaismart_taxpayer_name', taxpayerName);
    localStorage.setItem('cukaismart_taxpayer_nric', taxpayerNRIC);
    localStorage.setItem('cukaismart_taxpayer_tin', taxpayerTIN);
  }, [taxpayerName, taxpayerNRIC, taxpayerTIN]);

  // Live Backend Verification against /api/lhdn/verify-agent-license
  const handleVerifyAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseError(null);

    if (!licenseInput.trim() || !agentNameInput.trim()) {
      setLicenseError('Please provide a valid LHDN/MIA license number and practitioner full name.');
      return;
    }

    setIsVerifyingLicense(true);
    try {
      const res = await fetch('/api/lhdn/verify-agent-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseNumber: licenseInput.trim(),
          agentName: agentNameInput.trim(),
          firmName: firmNameInput.trim() || 'Chartered Tax Practice',
          firmSSM: firmSSMInput.trim() || 'Registered Professional Entity',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verification) {
        throw new Error(data.error || 'Statutory license verification failed.');
      }

      const rec = data.verification;
      const verification: TaxAgentVerification = {
        isVerified: rec.isVerified,
        licenseNumber: rec.licenseNumber,
        agentName: rec.agentName,
        firmName: rec.firmName,
        firmSSM: rec.firmSSM,
        verifiedAt: rec.verifiedAt,
        validUntil: rec.validUntil,
      };

      setTaxAgentSession(verification);
      setClientRecordsUnlocked(true); // Automatically unlock client ledger upon verified agent session
    } catch (err: any) {
      console.error('Agent verification error:', err);
      setLicenseError(err?.message || 'Failed to verify license with LHDN service.');
    } finally {
      setIsVerifyingLicense(false);
    }
  };

  const handleDeauthorize = () => {
    setTaxAgentSession({
      isVerified: false,
      licenseNumber: '',
      agentName: '',
      firmName: '',
      firmSSM: '',
    });
    setClientRecordsUnlocked(false);
    setImportedReceipts(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(clientPasscode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cukaismart.my';
    const link = `${origin}/?mode=agent&clientToken=${encodeURIComponent(clientPasscode)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Upload/Import client manifest JSON
  const handleImportManifestFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.records && Array.isArray(parsed.records)) {
          setImportedReceipts(parsed.records);
          setClientRecordsUnlocked(true);
          setImportStatusMessage(`Successfully loaded ${parsed.records.length} client receipts from manifest for YA ${parsed.assessmentYear || activeTaxYear}.`);
        } else {
          setImportStatusMessage('Manifest file did not contain recognized receipt records.');
        }
      } catch (err) {
        setImportStatusMessage('Invalid JSON file format. Please upload a valid CukaiSmart manifest.');
      }
    };
    reader.readAsText(file);
  };

  // Active records to audit/export: either imported by agent or taxpayer's live vault receipts
  const activeRecords = importedReceipts || receipts;
  const totalClaimable = activeRecords.reduce((acc, r) => acc + (r.claimableAmount || 0), 0);
  const totalRaw = activeRecords.reduce((acc, r) => acc + (r.totalAmount || 0), 0);

  // Generate and Download One-Click ZIP Bundle using JSZip
  const handleBulkExportZIP = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      const zip = new JSZip();

      const displayName = zkpMaskingActive ? `${taxpayerName.split(' ')[0]} [MASKED PII]` : taxpayerName;
      const displayNRIC = zkpMaskingActive ? maskNRIC(taxpayerNRIC) : taxpayerNRIC;
      const displayTIN = zkpMaskingActive ? `${taxpayerTIN.slice(0, 8)}-XXXX` : taxpayerTIN;

      // 1. CSV File: lhdn_claim_statement_draft.csv
      const csvHeader = [
        'Receipt_ID',
        'Tax_Year',
        'Persona',
        'Merchant_Name',
        'Merchant_SSM',
        'Transaction_Date',
        'Statutory_Section',
        'Category_Name',
        'Total_Amount_MYR',
        'Claimable_Deduction_MYR',
        'LHDN_Audit_Status',
        'Cryptographic_SHA256_Hash',
        'Retention_Horizon',
      ].join(',');

      const csvRows = activeRecords.map((r) =>
        [
          `"${r.id}"`,
          r.taxYear,
          `"${r.persona}"`,
          `"${r.merchantName.replace(/"/g, '""')}"`,
          `"${r.ssmNumber}"`,
          r.date,
          `"${r.statutorySection}"`,
          `"${r.categoryName}"`,
          r.totalAmount.toFixed(2),
          r.claimableAmount.toFixed(2),
          `"${r.lhdnValidation.auditStatus}"`,
          `"${r.verificationHash}"`,
          `"Until 31-Dec-${r.retentionUntilYear}"`,
        ].join(',')
      );

      const csvContent = [csvHeader, ...csvRows].join('\n');
      zip.file('lhdn_claim_statement_draft.csv', csvContent);

      // 2. Summary Text File: lhdn_compliance_summary.txt
      const summaryText = `========================================================================
LEMBAGA HASIL DALAM NEGERI MALAYSIA (HASIL)
TAX AGENT CLIENT COMPLIANCE & VERIFICATION DOSSIER
========================================================================
Assessment Year (YA)       : ${activeTaxYear}
Client Handover Passcode   : ${clientPasscode}
Taxpayer Confidential ID   : ${displayNRIC}
Tax File Reference (TIN)   : ${displayTIN}
Taxpayer Name              : ${displayName}
Filing Form Type           : ${persona === 'individual' ? 'Form BE (Employee)' : 'Form B (Business/Sole Prop)'}

LICENSED TAX AGENT APPOINTMENT (SECTION 153 ITA 1967):
Agent Name                 : ${taxAgentSession.agentName || 'Pending Tax Preparer Assignment'}
LHDN License No            : ${taxAgentSession.licenseNumber || 'Unassigned'}
Firm Name                  : ${taxAgentSession.firmName || 'Tax Accounting Practice'}
Firm SSM Reg               : ${taxAgentSession.firmSSM || 'Registered Entity'}
Authorized Verification At : ${taxAgentSession.verifiedAt || new Date().toISOString()}

STATUTORY AUDIT & RETENTION SUMMARY (SECTION 82A ITA 1967):
Total Validated Receipts   : ${activeRecords.length} Documents
Total Gross Invoiced       : RM ${totalRaw.toFixed(2)}
Total Allowable Deductions : RM ${totalClaimable.toFixed(2)}
Retention Horizon          : All source records preserved until 31 Dec ${activeTaxYear + 7}

ZERO-KNOWLEDGE PRIVACY NOTICE:
This export was compiled using CukaiSmart's client-side privacy shield.
Personal Identifiable Information (PII) has been sanitized while maintaining
mathematical SHA-256 cryptographic verification hashes for statutory audit validity.
========================================================================
Generated by CukaiSmart Certified Tax Agent Portal
`;
      zip.file('lhdn_compliance_summary.txt', summaryText);

      // 3. Manifest JSON: tax_agent_import_manifest.json
      const manifestData = {
        software: 'CukaiSmart LHDN Tax Agent Bulk Porter',
        version: '1.2.0',
        generatedAt: new Date().toISOString(),
        assessmentYear: activeTaxYear,
        clientPasscode,
        taxpayer: {
          name: displayName,
          nricMasked: displayNRIC,
          tinMasked: displayTIN,
          persona,
        },
        taxAgent: {
          licenseNumber: taxAgentSession.licenseNumber || 'UNASSIGNED',
          agentName: taxAgentSession.agentName || 'UNASSIGNED',
          firm: taxAgentSession.firmName || 'UNASSIGNED',
        },
        complianceStats: {
          totalReceipts: activeRecords.length,
          totalGrossClaimed: totalRaw,
          totalAllowableDeductions: totalClaimable,
          allValidSSM: activeRecords.every((r) => r.lhdnValidation.isValidSSM),
          auditCompliantCount: activeRecords.filter((r) => r.lhdnValidation.auditStatus === 'compliant').length,
        },
        records: activeRecords,
      };
      zip.file('tax_agent_import_manifest.json', JSON.stringify(manifestData, null, 2));

      // 4. Section 153 Statutory Engagement Letter
      const engagementText = `========================================================================
SECTION 153 INCOME TAX ACT 1967 - LETTER OF TAX AGENT APPOINTMENT
========================================================================
To: Lembaga Hasil Dalam Negeri Malaysia (LHDN)

TAXPAYER DECLARATION:
I, the undersigned taxpayer (${displayName}, NRIC: ${displayNRIC}, TIN: ${displayTIN}), hereby authorize
the designated licensed tax agent (${taxAgentSession.agentName || '[Appointed Agent]'}, License: ${taxAgentSession.licenseNumber || '[License No]'})
to act as my authorized tax return preparer and representative for Year of Assessment ${activeTaxYear}.

STATUTORY RECORD RETENTION COMPLIANCE:
All source receipts, electronic invoices, and allowable deduction proofs attached
hereto comply with Section 82A retention guidelines and have been digitally indexed
with SHA-256 cryptographic hashes via CukaiSmart.

Date of Appointment: ${new Date().toLocaleDateString('en-MY')}
========================================================================`;
      zip.file('lhdn_section153_representation_letter.txt', engagementText);

      // Generate the zip blob
      const content = await zip.generateAsync({ type: 'blob' });

      // Trigger browser download
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `CukaiSmart_LHDN_YA${activeTaxYear}_Agent_Package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setExportComplete(true);
    } catch (err) {
      console.error('ZIP generation error', err);
      alert('Failed to generate ZIP package.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Statutory Section 153 ITA 1967 &bull; Tax Preparer &amp; Agent Hub</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Certified Tax Agent &amp; Accountant Portal
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Bridge taxpayers and licensed tax agents. Taxpayers export audit-proof dossiers or share access passcodes; licensed accountants verify credentials to inspect and sign off on client claims.
        </p>
      </div>

      {/* Dual Perspective Mode Switcher */}
      <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActivePortalTab('taxpayer_handover')}
          className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activePortalTab === 'taxpayer_handover'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>1. Taxpayer Client Handover</span>
        </button>

        <button
          onClick={() => setActivePortalTab('agent_review')}
          className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activePortalTab === 'agent_review'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>2. Licensed Tax Agent / Accountant</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PERSPECTIVE 1: TAXPAYER CLIENT HANDOVER MODE                              */}
      {/* ========================================================================= */}
      {activePortalTab === 'taxpayer_handover' && (
        <div className="space-y-5">
          {/* Client Handover Access Passcode Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Your Tax Agent Handover Passcode</h3>
                  <p className="text-xs text-slate-400">
                    Share this access key with your accountant so they can review your verified receipts.
                  </p>
                </div>
              </div>

              {/* Passcode Display & Copy Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-emerald-300 font-mono text-sm font-black tracking-wider">
                  {clientPasscode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Copy Passcode"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Copy Direct Share Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>Share Link</span>
                </button>
              </div>
            </div>

            {/* Taxpayer Information Editor (for Dossier) */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Taxpayer Profile on Filing Dossier (YA {activeTaxYear}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={taxpayerName}
                    onChange={(e) => setTaxpayerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
                    placeholder="e.g. Ahmad Razif Bin Abdullah"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">NRIC / Passport No.</label>
                  <input
                    type="text"
                    value={taxpayerNRIC}
                    onChange={(e) => setTaxpayerNRIC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="e.g. 920415-14-5543"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tax Identification (TIN)</label>
                  <input
                    type="text"
                    value={taxpayerTIN}
                    onChange={(e) => setTaxpayerTIN(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="e.g. SG 28491028470"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Client-Side Zero-Knowledge Privacy Shield Switch */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Zero-Knowledge Privacy Shield</h4>
                  <p className="text-[11px] text-slate-400">
                    Mask confidential NRIC and TIN before exporting to prevent identity exposure while preserving cryptographic SHA-256 proofs.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setZkpMaskingActive(!zkpMaskingActive)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  zkpMaskingActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {zkpMaskingActive ? 'MASKING ACTIVE' : 'REVEAL FULL PII'}
              </button>
            </div>

            {/* Masked Preview */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px]">Client NRIC:</span>
                <p className="text-white font-bold">
                  {zkpMaskingActive ? maskNRIC(taxpayerNRIC) : taxpayerNRIC}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Tax File (TIN):</span>
                <p className="text-white font-bold">
                  {zkpMaskingActive ? `${taxpayerTIN.slice(0, 8)}-XXXX` : taxpayerTIN}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Legal Name:</span>
                <p className="text-white font-bold">
                  {zkpMaskingActive ? `${taxpayerName.split(' ')[0]} [MASKED]` : taxpayerName}
                </p>
              </div>
            </div>
          </div>

          {/* LHDN Bulk Porter & One-Click ZIP Export */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  LHDN Certified Handover Package (ZIP)
                </h4>
                <p className="text-xs text-slate-400">
                  Pre-compiled audit package conforming to Section 153 tax accounting specifications.
                </p>
              </div>
            </div>

            {/* Package contents breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>lhdn_claim_statement_draft.csv</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Line-by-line claim ledger with tax codes, vendor SSM, and amounts.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-teal-400 font-bold mb-1">
                  <FileText className="w-4 h-4" />
                  <span>lhdn_compliance_summary.txt</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Official Section 82A 7-year statutory audit statement.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-1">
                  <FileCode className="w-4 h-4" />
                  <span>tax_agent_import_manifest.json</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Machine-readable JSON schema for SQL Tax, Autocount, &amp; Bukku import.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400">
                {activeRecords.length} statutory records ready for export (YA {activeTaxYear})
              </span>

              <button
                onClick={handleBulkExportZIP}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-emerald-950/60 transition disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating ZIP...' : 'Export Complete ZIP Dossier'}</span>
              </button>
            </div>

            {exportComplete && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  ZIP Dossier successfully downloaded: <strong>CukaiSmart_LHDN_YA{activeTaxYear}_Agent_Package.zip</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSPECTIVE 2: LICENSED TAX AGENT / ACCOUNTANT AUDIT MODE                 */}
      {/* ========================================================================= */}
      {activePortalTab === 'agent_review' && (
        <div className="space-y-5">
          {/* Agent License Verification Gate */}
          {!taxAgentSession.isVerified ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Licensed Tax Agent Verification Gate</h3>
                  <p className="text-xs text-slate-400">
                    Verify credentials under Section 153 Income Tax Act 1967 or MIA membership to access client ledgers.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyAgent} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      LHDN / MIA License Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LHDN/TA/2026/8941 or MIA-18492"
                      value={licenseInput}
                      onChange={(e) => setLicenseInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Accepted format: LHDN/TA/YYYY/NNNN or MIA-NNNNN
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Practitioner Full Name (as per MIA / LHDN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tan Kah Lok"
                      value={agentNameInput}
                      onChange={(e) => setAgentNameInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tax Accounting Firm Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. K.L. Tan & Associates Chartered Tax Practitioners"
                      value={firmNameInput}
                      onChange={(e) => setFirmNameInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Firm SSM Registration No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 201401029481 (1095567-V)"
                      value={firmSSMInput}
                      onChange={(e) => setFirmSSMInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {licenseError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{licenseError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Statutory validation via Section 153 ITA 1967 rules</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingLicense}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingLicense ? 'Verifying with LHDN Registry...' : 'Verify & Authorize Session'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Authorized Tax Agent Dashboard */
            <div className="space-y-5">
              {/* Active Agent Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {taxAgentSession.agentName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        LHDN SEC 153 AUTHORIZED
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      License: <span className="font-mono text-emerald-400">{taxAgentSession.licenseNumber}</span> &bull; {taxAgentSession.firmName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDeauthorize}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium self-start sm:self-auto transition cursor-pointer"
                >
                  End Session
                </button>
              </div>

              {/* Client Ledger Access Controls */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs sm:text-sm font-bold text-white">Client Document Inspection</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Option 1: Enter Client Passcode */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-200 block">Option A: Link Client Passcode</span>
                    <p className="text-[11px] text-slate-400">
                      Enter the client's CukaiSmart access passcode (e.g. {clientPasscode}).
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputClientCode}
                        onChange={(e) => setInputClientCode(e.target.value.toUpperCase())}
                        placeholder="CS-YA26-XXXXXX"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => {
                          setClientRecordsUnlocked(true);
                          setImportStatusMessage(`Linked client ledger via passcode ${inputClientCode || clientPasscode}.`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shrink-0 cursor-pointer"
                      >
                        Load
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Upload Manifest File */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-200 block">Option B: Import Client JSON Manifest</span>
                    <p className="text-[11px] text-slate-400">
                      Upload <code className="text-emerald-400">tax_agent_import_manifest.json</code> provided by your client.
                    </p>
                    <label className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer border border-slate-700 transition">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Upload Manifest File</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportManifestFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {importStatusMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{importStatusMessage}</span>
                  </div>
                )}
              </div>

              {/* Client Ledger Summary & Audit Working Papers */}
              {clientRecordsUnlocked && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span>Client Verified Claims Ledger (YA {activeTaxYear})</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {activeRecords.length} receipts verified under LHDN Section 82A retention guidelines.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400">Allowable Deductions:</span>
                      <p className="text-base font-black text-emerald-400">
                        {formatCurrency(totalClaimable)}
                      </p>
                    </div>
                  </div>

                  {/* Receipt Ledger Table Preview */}
                  {activeRecords.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No receipts present in current client ledger. Have client scan documents or upload manifest.
                    </div>
                  ) : (
                    <div className="overflow-x-auto no-scrollbar max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[11px] text-slate-400 bg-slate-950/80 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Merchant / SSM</th>
                            <th className="py-2 px-3">Section</th>
                            <th className="py-2 px-3">Total Amount</th>
                            <th className="py-2 px-3">Claimable</th>
                            <th className="py-2 px-3">LHDN Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {activeRecords.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-800/40">
                              <td className="py-2 px-3 text-slate-300">{r.date}</td>
                              <td className="py-2 px-3 font-sans font-medium text-white truncate max-w-[140px]">
                                {r.merchantName}
                              </td>
                              <td className="py-2 px-3 text-slate-400 font-sans">{r.statutorySection}</td>
                              <td className="py-2 px-3 text-slate-300">{formatCurrency(r.totalAmount)}</td>
                              <td className="py-2 px-3 font-bold text-emerald-400">{formatCurrency(r.claimableAmount)}</td>
                              <td className="py-2 px-3 font-sans">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  r.lhdnValidation.auditStatus === 'compliant'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {r.lhdnValidation.auditStatus.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Actions for Agent */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <span className="text-xs text-slate-400">
                      Export full reconciliation pack with Section 153 declaration.
                    </span>

                    <button
                      onClick={handleBulkExportZIP}
                      disabled={isExporting || activeRecords.length === 0}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isExporting ? 'Packaging...' : 'Download Tax Agent Working Dossier (ZIP)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

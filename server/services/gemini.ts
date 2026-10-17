import { GoogleGenAI } from '@google/genai';
import type { LHDNRegulationRule } from '../types.ts';

// Initialize Google GenAI client (Server-side only)
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// =========================================================================
// ACTIVE LHDN STATUTORY REGULATIONS STORE (DYNAMIC & EDITABLE BY ADMIN)
// =========================================================================
export let activeLhdnRegulations: LHDNRegulationRule[] = [
  {
    id: 'relief-individual-dependent',
    title: 'Individual & Dependent Relatives',
    category: 'personal',
    statutorySection: 'Sec 46(1)(a) ITA 1967',
    maxLimit: 9000,
    description: 'Automatic statutory tax relief for individual taxpayer and supporting dependents.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-medical',
    title: 'Medical Expenses for Self, Spouse & Child',
    category: 'medical',
    statutorySection: 'Sec 46(1)(g) & (h) ITA 1967',
    maxLimit: 10000,
    description: 'Medical treatment for serious diseases, dental treatment (up to RM1,000), complete medical checkup (up to RM1,000), autism/ADHD therapy (up to RM4,000).',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-disabled-individual',
    title: 'Disabled Individual Relief',
    category: 'disability',
    statutorySection: 'Sec 46(1)(d) ITA 1967',
    maxLimit: 7000,
    description: 'Increased relief for disabled individuals certified by the Department of Social Welfare (JKM).',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-disabled-spouse',
    title: 'Disabled Husband / Wife Relief',
    category: 'disability',
    statutorySection: 'Sec 47(1) & (2) ITA 1967',
    maxLimit: 6000,
    description: 'Increased statutory relief for disabled spouse.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-lifestyle',
    title: 'Lifestyle Relief (Books, Computers, Smartphones, Internet)',
    category: 'lifestyle',
    statutorySection: 'Sec 46(1)(p) & 46(1)(u) ITA 1967',
    maxLimit: 2500,
    description: 'Purchase of books, journals, personal computers, smartphones, tablets, and home internet broadband subscriptions.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-sports',
    title: 'Sports Equipment, Facilities & Gym Fees',
    category: 'lifestyle',
    statutorySection: 'Sec 46(1)(q) ITA 1967',
    maxLimit: 1000,
    description: 'Purchase of sports equipment, rental of sports facilities, and gym membership fees under Sports Development Act 1997.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-ev',
    title: 'EV Charging Equipment & Installation Facilities',
    category: 'environmental',
    statutorySection: 'Sec 46(1)(v) ITA 1967',
    maxLimit: 2500,
    description: 'Purchase, installation, rental, or subscription fees for Electric Vehicle (EV) charging hardware and facilities.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-education',
    title: 'Self Education Fees (Approved Courses & Upskilling)',
    category: 'education',
    statutorySection: 'Sec 46(1)(f) ITA 1967',
    maxLimit: 7000,
    description: 'Degree/Master/PhD courses or upskilling/professional qualifications certified by DSD/KPKT.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-childcare',
    title: 'Childcare Centre (TASKA) & Kindergarten (TADIKA)',
    category: 'family',
    statutorySection: 'Sec 46(1)(r) ITA 1967',
    maxLimit: 3000,
    description: 'Fees paid to registered child care centers (TASKA) or kindergartens (TADIKA) for children aged 6 and below.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-sspn',
    title: 'SSPN-i Net Savings Deposit (National Education Savings)',
    category: 'education',
    statutorySection: 'Sec 46(1)(k) ITA 1967',
    maxLimit: 8000,
    description: 'Net deposit into SSPN-i or SSPN-i Plus account for dependent children.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-epf-life',
    title: 'Life Insurance Premium & Voluntary EPF Contributions',
    category: 'financial',
    statutorySection: 'Sec 49(1) ITA 1967',
    maxLimit: 7000,
    description: 'EPF contributions (up to RM4,000) and Life Insurance premiums (up to RM3,000).',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-prs',
    title: 'Private Retirement Scheme (PRS) & Deferred Annuity',
    category: 'financial',
    statutorySection: 'Sec 49A ITA 1967',
    maxLimit: 3000,
    description: 'Contributions to approved Private Retirement Scheme (PRS) or deferred annuity premiums.',
    isActive: true,
    lastUpdatedYear: 2026,
  },
  {
    id: 'relief-socso',
    title: 'SOCSO / PERKESO & EIS Scheme Contributions',
    category: 'financial',
    statutorySection: 'Sec 46(1)(kn) ITA 1967',
    maxLimit: 350,
    description: 'Employee contributions to Employees Social Security Act 1969 and Employment Insurance System (EIS).',
    isActive: true,
    lastUpdatedYear: 2026,
  },
];

export function updateActiveRegulations(newRegulations: LHDNRegulationRule[]): void {
  activeLhdnRegulations = newRegulations;
}

// PDPA Privacy Shield Helper - Sanitizes sensitive identification before AI processing
export function pdpaShield(text: string): string {
  let sanitized = text.replace(/\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[REDACTED_NRIC]');
  sanitized = sanitized.replace(/(\+?60|0)1[0-9][- ]?[0-9]{7,8}/g, '[REDACTED_PHONE]');
  sanitized = sanitized.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_PAYMENT_CARD]');
  return sanitized;
}

// Dynamically construct system instructions incorporating active LHDN regulations & MyInvois rules
export function buildSystemInstruction(persona: string, activeTaxYear: number): string {
  const activeReliefsText = activeLhdnRegulations
    .filter((r) => r.isActive)
    .map((r, idx) => `${idx + 1}. ${r.title} (${r.statutorySection}, max RM ${r.maxLimit.toLocaleString()}): ${r.description}`)
    .join('\n');

  return `You are "CukaiSmart LHDN Tax Assessor AI", an elite Malaysian tax expert specializing in the Income Tax Act 1967 (ITA 1967) and LHDN (Lembaga Hasil Dalam Negeri) compliance rules, including the Malaysian MyInvois e-Invoicing mandate.
Analyze this Malaysian receipt or invoice image with forensic precision for tax year ${activeTaxYear} (Assessment Year ${activeTaxYear}).
The user is currently filing under: ${persona === 'business' ? 'Form B (Business / Sole Proprietorship / SME - Sections 33 & 39 ITA 1967)' : 'Form BE (Salaried Individual - Section 46 ITA 1967 statutory personal reliefs)'}.

CRITICAL REQUIREMENTS:
1. You MUST evaluate whether the document contains valid tax-deductible expenses under Malaysian ITA 1967 LHDN rules.
2. Determine documentType accurately: e.g. "Tax Invoice", "Official Cash Receipt", "Medical / Hospital Bill", "Education / Course Invoice", "Broadband & Tech Bill", "Sports Gear / Gym Receipt", "EPF / Insurance Statement", "MyInvois e-Invoice (QR/XML/PDF)", or "Non-Tax Document / Disallowed".
3. Check for MyInvois e-Invoicing markers:
   - Unique Identifier No (UIN) / UUID
   - Supplier TIN & Buyer TIN
   - QR validation code or digital signature confirmation
4. If the image is a personal photo, selfie, landscape, animal, meme, random object, non-financial picture, unreadable image, or non-deductible expense:
   - "isTaxDeductible" MUST be false.
   - "isClaimableOutcome" MUST be "no".
   - "confidenceScore" MUST be between 80 and 100 representing confidence in rejection.
   - "category" MUST be "Unclaimable Non-Tax Document".
   - "documentType" MUST be "Non-Tax Document / Disallowed".
   - "reason" MUST clearly explain why the file/image is blocked from upload (e.g. "Personal photo or non-financial document detected. LHDN Section 82 ITA 1967 requires official tax invoices or itemized receipts.").

CURRENT OFFICIAL LHDN STATUTORY REGULATIONS (UPDATED BY ADMIN & GAZETTE):
${activeReliefsText}

Statutory Rules for Form B (Business):
1. Wholly and exclusively incurred in the production of gross income (Sec 33(1)).
2. Client Entertainment & Meals (Sec 39(1)(l)): Strictly 50% statutory limitation deduction! (Only 50% is deductible; 50% is disallowable).
3. Office rent, utilities, internet broadband, SaaS, business tools: 100% deductible.
4. Business travel, petrol, tolls, parking: 100% deductible if for business purposes.
5. Equipment & Assets: Subject to Capital Allowance.

LHDN Compliance Requirements:
- SSM Registration Number: Look for format like "202001012345 (1234567-X)" or registered business number.
- Tax Identification Number (TIN): Look for TIN / No. Cukai e.g. "C 1234567890" or "IG 12345678".
- High-Value Invoice Mandate (> RM 1,000): Check if the amount exceeds RM 1,000. If > RM 1,000, LHDN audits require the taxpayer's legal name on the invoice.

You MUST return a valid JSON object matching EXACTLY this schema:
{
  "isTaxDeductible": boolean,
  "documentType": string,
  "category": string,
  "confidenceScore": number,
  "isClaimableOutcome": "yes" | "no" | "partial",
  "aiConfidence": number,
  "confidenceLevel": "high" | "medium" | "needs_clarification",
  "clarificationQuestions": [],
  "merchantName": string,
  "ssmNumber": string,
  "tinNumber": string,
  "date": string,
  "taxYear": number,
  "totalAmount": number,
  "currency": "MYR",
  "categoryId": string,
  "reason": string,
  "statutoryRule": string,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "amount": number,
      "isClaimable": boolean,
      "taxCode": string,
      "statutorySection": string,
      "reason": string,
      "claimableAmount": number
    }
  ],
  "claimableTotal": number,
  "exceedsHighValueInvoiceMandate": boolean,
  "taxpayerNamePresent": boolean,
  "auditRiskScore": "LOW" | "MEDIUM" | "HIGH",
  "lhdnComplianceNotes": string,
  "eInvoicingStatus": {
    "isCompliant": boolean,
    "eInvoiceUUID": string,
    "msicCode": string
  }
}`;
}

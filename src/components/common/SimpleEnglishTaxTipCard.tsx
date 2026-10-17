import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2, DollarSign, Lightbulb } from 'lucide-react';

interface SimpleEnglishTaxTipCardProps {
  topic: 'how_tax_works' | 'payday_optimizer' | 'scanner_ocr' | '7_year_vault' | 'copilot_ai';
  title?: string;
  defaultExpanded?: boolean;
}

export const SimpleEnglishTaxTipCard: React.FC<SimpleEnglishTaxTipCardProps> = ({
  topic,
  title,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const topicContents = {
    how_tax_works: {
      header: title || 'How Your Malaysian Tax Refund Works in Simple English',
      badge: 'Tax Basics 101',
      tips: [
        {
          heading: '1. What is Tax Relief?',
          text: 'A tax relief lowers the total income LHDN calculates your tax on. For example, if you earn RM 60,000 a year and claim RM 10,000 in reliefs, LHDN only taxes you on RM 50,000!',
        },
        {
          heading: '2. How much cash do I actually get back?',
          text: 'If your tax rate is 24%, every RM 1,000 of tax relief you claim puts RM 240 of cold hard cash back into your bank account as a tax refund!',
        },
        {
          heading: '3. What happens if I lose my receipt?',
          text: 'Without a verified receipt photo or tax invoice, LHDN will reject your claim during an audit and charge a late penalty. CukaiSmart stores your receipt photos safely for 7 years.',
        },
      ],
    },
    payday_optimizer: {
      header: title || 'How Payday Relief Allocation Saves You Money Automatically',
      badge: 'Monthly Payday Tip',
      tips: [
        {
          heading: '1. Small Monthly Amounts = Zero Year-End Rush',
          text: 'Instead of rushing to spend RM 3,000 on Private Retirement (PRS) or SSPN education savings in December, put RM 250/month from your salary.',
        },
        {
          heading: '2. Direct Monthly Tax Deductions (Form TP1)',
          text: 'Submit Form TP1 to your HR company payroll to reduce monthly PCB tax deductions right away, giving you higher take-home pay each month!',
        },
        {
          heading: '3. High ROI Reliefs First',
          text: 'We prioritize Lifestyle (books/broadband/tech), Sports gear, Medical checkups, and EPF/Insurance because they deliver the highest instant cash returns.',
        },
      ],
    },
    scanner_ocr: {
      header: title || 'How AI Receipt Scanning Works in Plain English',
      badge: 'Scanner & OCR Tip',
      tips: [
        {
          heading: '1. Instant Line-by-Line Item Splitting',
          text: 'When you snap a picture of a store receipt (e.g. Popular Bookstore or Harvey Norman), our AI reads each item and separates claimable books/laptops from non-claimable food or toys.',
        },
        {
          heading: '2. SSM & e-Invoicing Compliance Check',
          text: 'Our AI checks the store’s SSM registration number and flags receipts above RM 1,000 that require buyer name validation under LHDN MyInvois rules.',
        },
        {
          heading: '3. Duplicate Receipt Prevention',
          text: 'Every receipt gets a digital SHA-256 fingerprint hash so you never accidentally upload or claim the same receipt twice.',
        },
      ],
    },
    '7_year_vault': {
      header: title || 'Why You Must Keep Receipt Photos for 7 Years (Section 82A)',

      badge: 'LHDN Audit Rule',
      tips: [
        {
          heading: '1. The 7-Year Statutory Audit Horizon',
          text: 'Malaysian tax law (Section 82A Income Tax Act 1967) requires every taxpayer to keep original purchase receipts for 7 full years after filing.',
        },
        {
          heading: '2. Fading Thermal Receipts',
          text: 'Paper receipts printed on thermal paper (from supermarkets or cafes) fade completely within 6 months. A digital cloud photo in CukaiSmart is 100% accepted by LHDN auditors.',
        },
        {
          heading: '3. One-Click PDF Audit Export',
          text: 'If LHDN sends an audit letter, click "Export 7-Year Audit Pack" in your User Profile to download a neat PDF report with all receipt images attached.',
        },
      ],
    },
    copilot_ai: {
      header: title || 'How Ask Copilot Answers Your Tax Questions Safely',
      badge: 'AI Copilot Tip',
      tips: [
        {
          heading: '1. Powered by Budget 2026 Statutory Rules',
          text: 'Copilot searches official LHDN public gazettes and acts (Income Tax Act 1967) to give accurate answers about what is claimable for influencers, employees, and businesses.',
        },
        {
          heading: '2. Zero Guesswork or Halucinations',
          text: 'If a category is restricted (like 50% entertainment limits for business or RM 1,000 dental cap for individual), Copilot explicitly quotes the legal cap.',
        },
        {
          heading: '3. Anonymous & Private',
          text: 'Your questions are answered in real-time. No personal tax numbers or bank passwords are ever requested.',
        },
      ],
    },
  };

  const content = topicContents[topic];

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/30 overflow-hidden shadow-lg transition-all animate-fade-in">
      {/* Header Bar Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-slate-900 hover:bg-slate-850 flex items-center justify-between text-left cursor-pointer transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <Lightbulb className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{content.header}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {content.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click to {isExpanded ? 'hide' : 'view'} quick simple English tax tips &amp; examples
            </p>
          </div>
        </div>

        <div className="text-slate-400 hover:text-white p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Tips Content */}
      {isExpanded && (
        <div className="p-4 pt-2 border-t border-slate-800 bg-slate-950/80 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {content.tips.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs"
              >
                <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item.heading}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

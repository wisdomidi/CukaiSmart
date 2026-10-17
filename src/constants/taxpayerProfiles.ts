import { TaxpayerCategory, TaxpayerProfileDefinition } from '../types/tax';

export const TAXPAYER_PROFILES: Record<TaxpayerCategory, TaxpayerProfileDefinition> = {
  salaried_employee: {
    id: 'salaried_employee',
    title: 'Salaried Employee / Executive',
    badge: 'Form BE',
    defaultPersona: 'individual',
    primaryForm: 'Form BE (e-BE via MyTax)',
    eFilingDeadline: '15 May annually',
    governingStatute: 'Section 4(b) & Section 46 Income Tax Act 1967',
    description:
      'For individuals earning formal salary, allowances, bonuses, and commission from an employer with monthly PCB/MTD tax deductions.',
    keyDeductions: [
      'Automatic basic relief (RM 9,000)',
      'EPF & Life Insurance (up to RM 7,000)',
      'Lifestyle & broadband (RM 2,500)',
      'Sports equipment & gym (RM 1,000)',
      'Medical, dental & health checks (RM 10,000)',
      'First home housing loan interest (up to RM 7,000 under Budget 2026)',
      'SOCSO & EIS contribution (RM 350)',
    ],
    auditFocusPoints: [
      'Compare EA Form (Section B) gross income vs MyTax declaration',
      'Retain physical/e-receipts for all Section 46 lifestyle, sports, and medical claims for 7 years',
      'Verify childcare centre has valid JKM registration license',
    ],
  },

  influencer_creator: {
    id: 'influencer_creator',
    title: 'Content Creator / Influencer / Streamer',
    badge: 'Form B (Creator)',
    defaultPersona: 'business',
    primaryForm: 'Form B (e-B via MyTax)',
    eFilingDeadline: '15 July annually',
    governingStatute: 'Section 4(a) Business Income & Section 33(1) ITA 1967',
    description:
      'For YouTubers, TikTokers, Instagram influencers, live streamers, and podcast hosts earning from brand sponsorships, ad revenue, affiliate links, and gifting.',
    keyDeductions: [
      'Studio rental & dedicated home recording space apportionment',
      'Camera gear, lighting, microphones & PC (Capital Allowance Schedule 3)',
      'Video editing software subscriptions (Adobe Creative Cloud, CapCut Pro, Midjourney)',
      'Travel & accommodation directly incurred for on-location content shoots',
      'Agency management commission & subcontractor video editor fees',
      'Client meals & collaboration entertainment (Strict 50% limit under Sec 39(1)(l))',
    ],
    auditFocusPoints: [
      'LHDN PR 1/2018: Free sponsored items & gifts with monetary value must be declared as gross income',
      'Home studio expenses must be reasonably apportioned (e.g. square footage calculation)',
      'Maintain separate business bank account for affiliate payouts & AdSense receipts',
      'Retain booking contracts, campaign briefs, and proof of publication for 7 years',
    ],
  },

  freelancer_consultant: {
    id: 'freelancer_consultant',
    title: 'Freelancer / Independent Consultant',
    badge: 'Form B (Consultant)',
    defaultPersona: 'business',
    primaryForm: 'Form B (e-B via MyTax)',
    eFilingDeadline: '15 July annually',
    governingStatute: 'Section 4(a) Profession/Gains & Section 33(1) ITA 1967',
    description:
      'For gig workers, software developers, independent accountants, legal advisors, translators, architects, and freelance consultants with project billing.',
    keyDeductions: [
      'Professional indemnity & certification membership fees',
      'Work laptop, monitors & peripherals (Capital Allowance Schedule 3)',
      'Cloud hosting, domain fees, GitHub, AWS, and SaaS tool subscriptions',
      'Business travel, client site mileage (Touch ‘n Go & RON95 logbook)',
      'Client business development dinners (50% deductible under Sec 39(1)(l))',
      'Self-employed i-Saraan voluntary EPF contributions (up to RM 4,000 relief)',
    ],
    auditFocusPoints: [
      'Issue formal tax invoices with serial numbering and keep payment receipts',
      'Ensure client withholding tax (if cross-border) is documented',
      'Keep trip logbooks matching Google Calendar or invoices for travel deductions',
    ],
  },

  sole_proprietor: {
    id: 'sole_proprietor',
    title: 'Small Business Owner / Sole Proprietor',
    badge: 'Form B (Sole Prop)',
    defaultPersona: 'business',
    primaryForm: 'Form B (e-B via MyTax)',
    eFilingDeadline: '15 July annually',
    governingStatute: 'Section 4(a) Trade/Business & Section 33(1) ITA 1967',
    description:
      'For registered SSM Enterprise, retail shops, F&B cafes, trading businesses, e-commerce stores (Shopee/Lazada), and personal service firms.',
    keyDeductions: [
      'Shop lot, commercial kitchen, or warehouse commercial rental',
      'Utilities (TNB commercial tariff, commercial broadband, water)',
      'Staff wages, bonuses & mandatory employer EPF (deductible up to 19% cap)',
      'Cost of Goods Sold (inventory purchases with supplier invoices)',
      'Marketing, flyers, Meta/Google ad spend, and signage licenses',
      'Trade machinery, POS systems, and renovation capital allowance',
    ],
    auditFocusPoints: [
      'Maintain full general ledger, sales ledger, and annual inventory stock count',
      'Comply with LHDN e-Invoicing phased mandate via MyInvois portal',
      'CP500 bi-monthly tax installment payments compliance',
    ],
  },

  sme_director: {
    id: 'sme_director',
    title: 'Medium-Sized SME / Sdn Bhd Director',
    badge: 'Form C & Form E',
    defaultPersona: 'business',
    primaryForm: 'Form C (Corporate) + Form E (Employer) + Form BE (Director)',
    eFilingDeadline: '7 months after FY end (Form C) / 30 April (Form E)',
    governingStatute: 'Section 77A (Company), Section 83 (Employer) ITA 1967',
    description:
      'For directors and shareholders of Sendirian Berhad companies managing payroll, corporate tax tiers (15% for first RM 150k for qualifying SMEs), and dividend distribution.',
    keyDeductions: [
      'SME corporate headline rate: 15% on first RM 150,000, 17% on next RM 450,000, 24% balance',
      'Director remuneration, salaries & employer statutory EPF contributions',
      'Audit fees, secretarial fees, and tax agent advisory fees (Section 33)',
      'Depreciation add-backs & Schedule 3 capital allowances claims',
      'Double deduction incentives (approved training, R&D, internships)',
    ],
    auditFocusPoints: [
      'Submit Form E & CP8D by 30 April to avoid Section 120 prosecution',
      'Ensure Form CP204 tax estimate is filed within statutory 30-day window',
      'Keep audited financial statements signed by certified chartered accountant',
    ],
  },

  partnership_partner: {
    id: 'partnership_partner',
    title: 'Partnership & Joint Venture Partner',
    badge: 'Form P & Form B',
    defaultPersona: 'business',
    primaryForm: 'Form P (Firm) & Form B (Individual Partner)',
    eFilingDeadline: '30 June (Form P) / 15 July (Form B)',
    governingStatute: 'Section 86 & Section 55-59 Partnership Allocation ITA 1967',
    description:
      'For law firms, accounting practices, medical clinics, and joint venture partnerships sharing divisible business revenue and expenses.',
    keyDeductions: [
      'Precedent partner lodges Form P declaring divisible partnership profit',
      'Individual partners declare their respective divisible profit share in Form B',
      'Partnership capital allowances allocated based on profit-sharing ratio',
      'Common practice operating overheads, clinic supplies, and office rent',
    ],
    auditFocusPoints: [
      'Lodge Form P CP30 allocation certificates to all partners on time',
      'Maintain partnership agreement outlining exact profit/loss sharing ratios',
      'Reconcile private partner drawings vs allowable partnership expenses',
    ],
  },
};

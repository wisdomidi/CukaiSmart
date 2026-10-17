import { TaxRelief, BusinessDeductionCategory } from '../types/tax';

/**
 * Official LHDN Malaysia Tax Relief Categories & Statutory Limits (ITA 1967 - YA 2025 / YA 2026)
 * Updated with latest Ministry of Finance Budget relief revisions.
 */

export interface LHDNReliefCategoryDefinition {
  id: string;
  category: 'lifestyle' | 'sports' | 'medical' | 'education' | 'retirement' | 'family' | 'green';
  name: string;
  section: string;
  maxLimit: number;
  description: string;
  eligibleItems: string[];
  ineligibleItems: string[];
}

export const LHDN_STATUTORY_RELIEFS_MAPPING: LHDNReliefCategoryDefinition[] = [
  {
    id: 'relief-individual-basic',
    category: 'lifestyle',
    name: 'Basic Individual & Dependent Relief',
    section: 'Sec 46(1)(a) ITA 1967',
    maxLimit: 9000,
    description: 'Automatic statutory personal relief granted to every Malaysian resident individual taxpayer.',
    eligibleItems: ['Statutory allowance for resident individual taxpayers'],
    ineligibleItems: ['Non-resident status taxpayers'],
  },
  {
    id: 'relief-lifestyle',
    category: 'lifestyle',
    name: 'Lifestyle Relief (Books, Tech & Internet)',
    section: 'Sec 46(1)(p) & 46(1)(u) ITA 1967',
    maxLimit: 2500,
    description: 'Purchase of reading books, journals, personal computer, smartphone, tablet, and home internet subscriptions.',
    eligibleItems: ['Books, e-Books & magazines', 'Laptops & MacBooks', 'Smartphones & Tablets', 'Home Fibre & Broadband Wi-Fi bills'],
    ineligibleItems: ['Stationery / Pens', 'Food & snacks bought at bookstores', 'Gaming consoles', 'Smartwatches (claim under Sports)'],
  },
  {
    id: 'relief-sports',
    category: 'sports',
    name: 'Sports Equipment, Gym & Events',
    section: 'Sec 46(1)(q) ITA 1967',
    maxLimit: 1000,
    description: 'Purchase of sports equipment, gym memberships, court rentals, and sports competition registration fees (extended to parents).',
    eligibleItems: ['Gym memberships & passes', 'Sports shoes & athletic gear', 'Court fees (Badminton, Futsal, Tennis)', 'Fitness trackers & smartwatches', 'Marathon entry fees'],
    ineligibleItems: ['Motorized sports equipment', 'Casual street fashion shoes', 'Spa / sauna entrance'],
  },
  {
    id: 'relief-medical',
    category: 'medical',
    name: 'Medical Treatment & Serious Illnesses',
    section: 'Sec 46(1)(g) & 46(1)(h) ITA 1967',
    maxLimit: 10000,
    description: 'Medical expenses for serious illnesses for self/spouse/child (RM 10k max), Dental care (RM 1k cap), Medical checkup (RM 1k cap), Vaccination (RM 1k cap), and Child Learning Disability therapy (increased to RM 6k cap).',
    eligibleItems: ['Hospitalization & surgeries', 'Complete physical health checkup (up to RM 1k)', 'Dental scaling & fillings (up to RM 1k)', 'Vaccinations (up to RM 1k)', 'Autism / ADHD / Down Syndrome therapy (up to RM 6k cap)', 'Fertility treatments'],
    ineligibleItems: ['Cosmetic surgery & teeth whitening', 'General over-the-counter vitamins', 'Gym protein powders'],
  },
  {
    id: 'relief-parents-medical',
    category: 'medical',
    name: 'Parents Medical & Special Care',
    section: 'Sec 46(1)(o) ITA 1967',
    maxLimit: 8000,
    description: 'Medical treatment, special needs, nursing, and carer expenses for parents certified by registered medical practitioner.',
    eligibleItems: ['Parents hospital treatment', 'Nursing home fees', 'Full-time carer fees', 'Special needs medical equipment for parents'],
    ineligibleItems: ['General living allowance', 'Non-medical housemaid salaries'],
  },
  {
    id: 'relief-housing-loan',
    category: 'lifestyle',
    name: 'First Home Housing Loan Interest',
    section: 'Sec 46(1)(w) ITA 1967 (Budget Update)',
    maxLimit: 7000,
    description: 'Tax relief on housing loan interest for first residential home purchase (Up to RM 7,000 for homes ≤ RM 500k; RM 5,000 for homes RM 500k-RM 750k).',
    eligibleItems: ['Housing loan interest bank statement for first home purchase (SPA executed 2025-2027)'],
    ineligibleItems: ['Second property loans', 'Refinancing cash-out interest', 'Commercial property loans'],
  },
  {
    id: 'relief-education',
    category: 'education',
    name: 'Education & Professional Course Fees',
    section: 'Sec 46(1)(f) ITA 1967',
    maxLimit: 7000,
    description: 'Fees for approved courses of study (degree/master/doctorate or upskilling/technical courses recognized by DSD up to RM 2k).',
    eligibleItems: ['Recognized Degree / Master / PhD fees', 'Professional certifications (CPA, ACCA, CFA, AWS, PMP)', 'DSD recognized upskilling courses (up to RM 2,000)'],
    ineligibleItems: ['Hobby classes without accredited certificate', 'Children school tuition fees'],
  },
  {
    id: 'relief-sspn',
    category: 'family',
    name: 'SSPN-i Education Net Savings',
    section: 'Sec 46(1)(k) ITA 1967',
    maxLimit: 8000,
    description: 'Net deposit into Skim Simpanan Pendidikan Nasional (SSPN-Prime / SSPN-Plus) for taxpayer’s children.',
    eligibleItems: ['Net annual deposit into SSPN-Prime', 'Net deposit into SSPN-Plus account for legitimate child'],
    ineligibleItems: ['Withdrawals exceeding deposits', 'Accounts not in parent/guardian name'],
  },
  {
    id: 'relief-epf-life',
    category: 'retirement',
    name: 'EPF Contributions & Life Insurance',
    section: 'Sec 46(1)(b) & 46(1)(t) ITA 1967',
    maxLimit: 7000,
    description: 'Statutory or voluntary contributions to EPF (up to RM 4,000) and Life Insurance / Family Takaful premiums (up to RM 3,000).',
    eligibleItems: ['Mandatory employee EPF monthly deductions', 'Self-employed i-Saraan voluntary EPF', 'Life insurance & family takaful premiums'],
    ineligibleItems: ['Motor vehicle insurance', 'Fire / home property insurance'],
  },
  {
    id: 'relief-prs',
    category: 'retirement',
    name: 'Private Retirement Scheme (PRS)',
    section: 'Sec 46(1)(m) ITA 1967',
    maxLimit: 3000,
    description: 'Contributions to Private Retirement Schemes (PRS) approved by Securities Commission Malaysia.',
    eligibleItems: ['Approved PRS fund contributions', 'Deferred annuity approved schemes'],
    ineligibleItems: ['Non-PRS unit trust equity funds', 'Cryptocurrency or stocks'],
  },
  {
    id: 'relief-ev',
    category: 'green',
    name: 'EV Charging Equipment & Facilities',
    section: 'Sec 46(1)(v) ITA 1967',
    maxLimit: 2500,
    description: 'Expenses for installation, rental, purchase including hire-purchase of equipment or subscription fees for EV charging facilities.',
    eligibleItems: ['Home EV Wallbox charger purchase & installation', 'Public EV charging subscription fees'],
    ineligibleItems: ['Purchase price of electric car', 'Petrol or engine oils'],
  },
  {
    id: 'relief-childcare',
    category: 'family',
    name: 'Childcare Centre & Kindergarten Fees',
    section: 'Sec 46(1)(r) ITA 1967',
    maxLimit: 3000,
    description: 'Fees paid to registered child care centres (TASKA JKM) or kindergartens (TADIKA MOE) for children aged ≤ 6.',
    eligibleItems: ['JKM-registered TASKA nursery fees', 'MOE-registered TADIKA kindergarten fees'],
    ineligibleItems: ['Unregistered informal babysitter', 'Primary school fees'],
  },
  {
    id: 'relief-disabled-indiv',
    category: 'family',
    name: 'Disabled Individual Relief',
    section: 'Sec 46(1)(d) ITA 1967 (Updated)',
    maxLimit: 7000,
    description: 'Statutory deduction for a resident individual taxpayer registered with JKM as a person with disabilities (OKU). Increased to RM 7,000.',
    eligibleItems: ['JKM OKU registration cardholder'],
    ineligibleItems: ['Unregistered disability'],
  },
  {
    id: 'relief-socso',
    category: 'retirement',
    name: 'SOCSO / PERKESO & EIS Contribution',
    section: 'Sec 46(1)(n) ITA 1967',
    maxLimit: 350,
    description: 'Statutory employee contribution to Social Security Organization (SOCSO / PERKESO) and Employment Insurance System (EIS).',
    eligibleItems: ['Monthly pay-slip SOCSO deductions', 'Monthly EIS deductions', 'Self-employed SOCSO SPS scheme'],
    ineligibleItems: ['Employer portion of SOCSO'],
  },
];

/**
 * Utility: Calculates overall tax relief summary statistics.
 */
export function calculateReliefSummary(reliefs: TaxRelief[]) {
  const totalCap = reliefs.reduce((acc, r) => acc + r.maxLimit, 0);
  const totalClaimed = reliefs.reduce((acc, r) => acc + Math.min(r.claimedAmount, r.maxLimit), 0);
  const totalRemaining = Math.max(0, totalCap - totalClaimed);
  const utilizationPercentage = totalCap > 0 ? Math.round((totalClaimed / totalCap) * 100) : 0;

  return {
    totalCap,
    totalClaimed,
    totalRemaining,
    utilizationPercentage,
    categoriesCount: reliefs.length,
    fullyUtilizedCount: reliefs.filter((r) => r.claimedAmount >= r.maxLimit).length,
  };
}

/**
 * Utility: Find relief definition by ID.
 */
export function getLHDNReliefById(reliefId: string): LHDNReliefCategoryDefinition | undefined {
  return LHDN_STATUTORY_RELIEFS_MAPPING.find((r) => r.id === reliefId);
}

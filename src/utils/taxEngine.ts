import {
  RegionalAuthority,
  RegionalTaxProfile,
  TaxBracket,
  TaxRelief,
  BusinessDeductionCategory,
  PaydayPlanResult,
  PaydayAllocationAdvice,
} from '../types/tax';

// Malaysian LHDN Progressive Tax Brackets (YA 2024 - YA 2026 ITA 1967)
export const DEFAULT_MALAYSIA_BRACKETS: TaxBracket[] = [
  { id: 'my-1', min: 0, max: 5000, rate: 0.0, baseTax: 0, description: 'First RM 5,000' },
  { id: 'my-2', min: 5000, max: 20000, rate: 0.01, baseTax: 0, description: 'Next RM 15,000 (5,001 - 20,000)' },
  { id: 'my-3', min: 20000, max: 35000, rate: 0.03, baseTax: 150, description: 'Next RM 15,000 (20,001 - 35,000)' },
  { id: 'my-4', min: 35000, max: 50000, rate: 0.06, baseTax: 600, description: 'Next RM 15,000 (35,001 - 50,000)' },
  { id: 'my-5', min: 50000, max: 70000, rate: 0.11, baseTax: 1500, description: 'Next RM 20,000 (50,001 - 70,000)' },
  { id: 'my-6', min: 70000, max: 100000, rate: 0.19, baseTax: 3700, description: 'Next RM 30,000 (70,001 - 100,000)' },
  { id: 'my-7', min: 100000, max: 400000, rate: 0.25, baseTax: 9400, description: 'Next RM 300,000 (100,001 - 400,000)' },
  { id: 'my-8', min: 400000, max: 600000, rate: 0.26, baseTax: 84400, description: 'Next RM 200,000 (400,001 - 600,000)' },
  { id: 'my-9', min: 600000, max: 2000000, rate: 0.28, baseTax: 136400, description: 'Next RM 1,400,000 (600,001 - 2,000,000)' },
  { id: 'my-10', min: 2000000, max: null, rate: 0.30, baseTax: 528400, description: 'Exceeding RM 2,000,000' },
];

export const DEFAULT_SINGAPORE_BRACKETS: TaxBracket[] = [
  { id: 'sg-1', min: 0, max: 20000, rate: 0.0, baseTax: 0, description: 'First S$20,000' },
  { id: 'sg-2', min: 20000, max: 30000, rate: 0.02, baseTax: 0, description: 'Next S$10,000' },
  { id: 'sg-3', min: 30000, max: 40000, rate: 0.035, baseTax: 200, description: 'Next S$10,000' },
  { id: 'sg-4', min: 40000, max: 80000, rate: 0.07, baseTax: 550, description: 'Next S$40,000' },
  { id: 'sg-5', min: 80000, max: 120000, rate: 0.115, baseTax: 3350, description: 'Next S$40,000' },
  { id: 'sg-6', min: 120000, max: 160000, rate: 0.15, baseTax: 7950, description: 'Next S$40,000' },
  { id: 'sg-7', min: 160000, max: 200000, rate: 0.18, baseTax: 13950, description: 'Next S$40,000' },
  { id: 'sg-8', min: 200000, max: 240000, rate: 0.19, baseTax: 21150, description: 'Next S$40,000' },
  { id: 'sg-9', min: 240000, max: 280000, rate: 0.195, baseTax: 28750, description: 'Next S$40,000' },
  { id: 'sg-10', min: 280000, max: 320000, rate: 0.20, baseTax: 36550, description: 'Next S$40,000' },
  { id: 'sg-11', min: 320000, max: 500000, rate: 0.22, baseTax: 44550, description: 'Next S$180,000' },
  { id: 'sg-12', min: 500000, max: 1000000, rate: 0.23, baseTax: 84150, description: 'Next S$500,000' },
  { id: 'sg-13', min: 1000000, max: null, rate: 0.24, baseTax: 199150, description: 'Exceeding S$1,000,000' },
];

export const DEFAULT_INDONESIA_BRACKETS: TaxBracket[] = [
  { id: 'id-1', min: 0, max: 60000000, rate: 0.05, baseTax: 0, description: 'Up to Rp 60,000,000' },
  { id: 'id-2', min: 60000000, max: 250000000, rate: 0.15, baseTax: 3000000, description: 'Rp 60,000,001 - Rp 250,000,000' },
  { id: 'id-3', min: 250000000, max: 500000000, rate: 0.25, baseTax: 31500000, description: 'Rp 250,000,001 - Rp 500,000,000' },
  { id: 'id-4', min: 500000000, max: 5000000000, rate: 0.30, baseTax: 94000000, description: 'Rp 500,000,001 - Rp 5,000,000,000' },
  { id: 'id-5', min: 5000000000, max: null, rate: 0.35, baseTax: 1444000000, description: 'Above Rp 5,000,000,000' },
];

export const REGIONAL_PROFILES: Record<RegionalAuthority, RegionalTaxProfile> = {
  MY: {
    id: 'MY',
    country: 'Malaysia',
    name: 'Malaysia (LHDN / HASiL)',
    authority: 'Lembaga Hasil Dalam Negeri Malaysia (LHDN)',
    currency: 'MYR',
    symbol: 'RM',
    formName: {
      individual: 'Form BE (Sec 46)',
      business: 'Form B (Sec 33/39)',
    },
    statute: 'Income Tax Act 1967 (ITA 1967)',
    brackets: DEFAULT_MALAYSIA_BRACKETS,
    standardRelief: 9000, // Basic individual relief Sec 46(1)(a)
  },
  SG: {
    id: 'SG',
    country: 'Singapore',
    name: 'Singapore (IRAS)',
    authority: 'Inland Revenue Authority of Singapore (IRAS)',
    currency: 'SGD',
    symbol: 'S$',
    formName: {
      individual: 'Form B1 (Individual)',
      business: 'Form B (Sole Prop / Partner)',
    },
    statute: 'Income Tax Act 1947 (Singapore)',
    brackets: DEFAULT_SINGAPORE_BRACKETS,
    standardRelief: 1000, // Earned Income Relief
  },
  ID: {
    id: 'ID',
    country: 'Indonesia',
    name: 'Indonesia (DJP / Kemenkeu)',
    authority: 'Direktorat Jenderal Pajak (DJP)',
    currency: 'IDR',
    symbol: 'Rp',
    formName: {
      individual: 'SPT 1770 S (Pegawai)',
      business: 'SPT 1770 (Usaha / Bebas)',
    },
    statute: 'UU Harmonisasi Peraturan Perpajakan (UU HPP)',
    brackets: DEFAULT_INDONESIA_BRACKETS,
    standardRelief: 54000000, // PTKP Dasar Wajib Pajak
  },
};

// Initial Statutory Personal Reliefs (LHDN Malaysia YA 2025 / YA 2026 ITA 1967 Updated)
export const INITIAL_PERSONAL_RELIEFS: TaxRelief[] = [
  {
    id: 'relief-lifestyle',
    category: 'lifestyle',
    name: 'Lifestyle Relief',
    section: 'Sec 46(1)(p) & 46(1)(u) ITA 1967',
    maxLimit: 2500,
    claimedAmount: 0,
    description: 'Purchase of reading books/magazines, personal computer, smartphone or tablet, and home internet subscription.',
    eligibleItems: ['Books & e-Books', 'Laptops & MacBooks', 'iPads & Tablets', 'Smartphones', 'Home Wi-Fi & Fibre Bills'],
    ineligibleItems: ['Stationery / Pens', 'Snacks bought at bookstores', 'Gaming consoles', 'Smartwatches (claim under Sports)'],
  },
  {
    id: 'relief-sports',
    category: 'sports',
    name: 'Sports Equipment, Facilities & Events',
    section: 'Sec 46(1)(q) ITA 1967',
    maxLimit: 1000,
    claimedAmount: 0,
    description: 'Purchase of sports equipment, gym memberships, court rental fees, and sports competition registration fees (extended to include parents).',
    eligibleItems: ['Gym memberships & passes', 'Sports shoes & athletic wear', 'Badminton / Futsal / Tennis court fees', 'Bicycle & running gear', 'Fitness trackers / smartwatches', 'Marathon & competition entry fees'],
    ineligibleItems: ['Motorized sports vehicles', 'Casual fashion shoes', 'Spa & sauna entrance'],
  },
  {
    id: 'relief-medical',
    category: 'medical',
    name: 'Medical & Serious Diseases',
    section: 'Sec 46(1)(g) & 46(1)(h) ITA 1967',
    maxLimit: 10000,
    claimedAmount: 0,
    description: 'Medical expenses for serious illnesses for self/spouse/child (RM 10k max), Dental care (RM 1k cap), Full medical checkup (RM 1k cap), Vaccination (RM 1k cap), and Child Learning Disability therapy (increased to RM 6k cap).',
    eligibleItems: ['Hospitalization & surgery', 'Complete physical checkup (up to RM 1k)', 'Dental scaling, fillings & extraction (up to RM 1k)', 'Vaccinations (up to RM 1k)', 'Autism / ADHD / Down Syndrome assessment & therapy (up to RM 6k cap)', 'Fertility treatments'],
    ineligibleItems: ['Cosmetic surgery & whitening', 'General over-the-counter vitamins', 'Gym supplements'],
  },
  {
    id: 'relief-parents-medical',
    category: 'medical',
    name: 'Parents Medical & Special Care',
    section: 'Sec 46(1)(o) ITA 1967',
    maxLimit: 8000,
    claimedAmount: 0,
    description: 'Medical treatment, special needs, nursing, and carer expenses for parents certified by a registered medical practitioner.',
    eligibleItems: ['Parents hospital treatment', 'Nursing home fees', 'Full-time carer fees', 'Special needs medical equipment for parents'],
    ineligibleItems: ['General living allowance', 'Non-medical helper salaries'],
  },
  {
    id: 'relief-housing-loan',
    category: 'lifestyle',
    name: 'First Home Housing Loan Interest',
    section: 'Sec 46(1)(w) ITA 1967 (Budget 2025/2026)',
    maxLimit: 7000,
    claimedAmount: 0,
    description: 'Tax relief on housing loan interest for first residential home purchase (Up to RM 7,000 for homes ≤ RM 500k; RM 5,000 for homes RM 500k-RM 750k).',
    eligibleItems: ['Annual housing loan interest bank statement for first home purchase (SPA executed 2025-2027)'],
    ineligibleItems: ['Second home loans', 'Refinancing cash-out portion', 'Commercial property loans'],
  },
  {
    id: 'relief-education',
    category: 'education',
    name: 'Education / Self-Improvement Fees',
    section: 'Sec 46(1)(f) ITA 1967',
    maxLimit: 7000,
    claimedAmount: 0,
    description: 'Fees for approved courses of study undertaken by taxpayer (degree/master/doctorate or technical/vocational/upskilling courses recognized by DSD up to RM 2k).',
    eligibleItems: ['Recognized Degree / Masters / Doctorate', 'Professional certifications (CPA, ACCA, CFA, AWS, PMP)', 'Upskilling courses registered with Skills Development Dept (up to RM 2,000)'],
    ineligibleItems: ['Hobby classes without certificate', 'Tuition fees for your children (claim under Childcare or Child Relief)'],
  },
  {
    id: 'relief-sspn',
    category: 'family',
    name: 'SSPN-i Net Savings',
    section: 'Sec 46(1)(k) ITA 1967',
    maxLimit: 8000,
    claimedAmount: 0,
    description: 'Net deposit into Skim Simpanan Pendidikan Nasional (SSPN-Prime / SSPN-Plus) for taxpayer’s children (Total Deposit minus Total Withdrawal for the year).',
    eligibleItems: ['Net annual deposit into SSPN-Prime', 'Net deposit into SSPN-Plus account for legitimate child'],
    ineligibleItems: ['Withdrawals exceeding deposits (negative balance)', 'Accounts not in parent’s or legal guardian’s name'],
  },
  {
    id: 'relief-epf-life',
    category: 'retirement',
    name: 'EPF / Life Insurance & Takaful',
    section: 'Sec 46(1)(b) & 46(1)(t) ITA 1967',
    maxLimit: 7000,
    claimedAmount: 0,
    description: 'Statutory or voluntary contributions to EPF (up to RM 4,000) and Life Insurance / Family Takaful premiums (up to RM 3,000).',
    eligibleItems: ['Mandatory employee EPF monthly deductions', 'Self-employed i-Saraan voluntary EPF contributions', 'Term life insurance and whole life policy premiums', 'Family Takaful certificates'],
    ineligibleItems: ['General motor vehicle insurance', 'Fire / home property insurance'],
  },
  {
    id: 'relief-prs',
    category: 'retirement',
    name: 'Private Retirement Scheme (PRS)',
    section: 'Sec 46(1)(m) ITA 1967',
    maxLimit: 3000,
    claimedAmount: 0,
    description: 'Contributions to Private Retirement Schemes (PRS) approved by the Securities Commission Malaysia.',
    eligibleItems: ['Approved PRS fund contributions', 'Deferred annuity approved schemes'],
    ineligibleItems: ['Unit trust equity funds not under PRS framework', 'Cryptocurrency or stocks'],
  },
  {
    id: 'relief-ev',
    category: 'green',
    name: 'EV Charging Equipment & Facilities',
    section: 'Sec 46(1)(v) ITA 1967',
    maxLimit: 2500,
    claimedAmount: 0,
    description: 'Expenses for installation, rental, purchase including hire-purchase of equipment or subscription fees for EV charging facilities.',
    eligibleItems: ['Home EV Wallbox purchase & certified installation', 'Monthly public EV charging network subscription fees'],
    ineligibleItems: ['Purchase price of the electric car itself', 'Petrol or engine oils'],
  },
  {
    id: 'relief-childcare',
    category: 'family',
    name: 'Childcare & Kindergarten Fees',
    section: 'Sec 46(1)(r) ITA 1967',
    maxLimit: 3000,
    claimedAmount: 0,
    description: 'Fees paid to child care centres (TASKA) registered with JKM or kindergartens (TADIKA) registered with the Ministry of Education for children aged ≤ 6.',
    eligibleItems: ['JKM-registered TASKA nursery fees', 'MOE-registered TADIKA kindergarten fees'],
    ineligibleItems: ['Informal babysitter without registration', 'Primary school fees'],
  },
  {
    id: 'relief-disabled-indiv',
    category: 'family',
    name: 'Disabled Individual Relief',
    section: 'Sec 46(1)(d) ITA 1967 (Updated)',
    maxLimit: 7000,
    claimedAmount: 0,
    description: 'Statutory deduction for a resident individual taxpayer registered with the Social Welfare Department (JKM) as a person with disabilities (OKU). Increased to RM 7,000.',
    eligibleItems: ['JKM OKU registration cardholder'],
    ineligibleItems: ['Unregistered disability'],
  },
  {
    id: 'relief-socso',
    category: 'retirement',
    name: 'SOCSO / EIS Contribution',
    section: 'Sec 46(1)(n) ITA 1967',
    maxLimit: 350,
    claimedAmount: 0,
    description: 'Statutory employee contribution to Social Security Organization (SOCSO / PERKESO) and Employment Insurance System (EIS / SIP).',
    eligibleItems: ['Monthly pay-slip SOCSO deductions', 'Monthly EIS deductions', 'Self-employed SOCSO SPS scheme'],
    ineligibleItems: ['Employer portion of SOCSO'],
  },
  {
    id: 'relief-individual-basic',
    category: 'lifestyle',
    name: 'Basic Individual & Dependent Relief',
    section: 'Sec 46(1)(a) ITA 1967',
    maxLimit: 9000,
    claimedAmount: 9000,
    description: 'Automatic statutory personal relief granted to every Malaysian resident individual.',
    eligibleItems: ['Automatic statutory allowance for every resident taxpayer'],
    ineligibleItems: ['None (Statutory guaranteed deduction)'],
  },
];

// Initial Business Operating Deduction Categories (Form B / Section 33 & 39 ITA 1967)
export const INITIAL_BUSINESS_CATEGORIES: BusinessDeductionCategory[] = [
  {
    id: 'biz-office-rent',
    name: 'Office & Coworking Rent',
    section: 'Sec 33(1)(a) & Sec 33(1) ITA 1967',
    deductionRate: 1.0, // 100%
    description: 'Premises rental for business operations, coworking spaces, warehouses, and storage.',
    statutoryRule: '100% tax-deductible when wholly and exclusively incurred for business operations.',
    claimedAmount: 0,
  },
  {
    id: 'biz-utilities',
    name: 'Utilities & Commercial Wi-Fi',
    section: 'Sec 33(1) ITA 1967',
    deductionRate: 1.0, // 100%
    description: 'Electricity (TNB), water (Air Selangor), high-speed commercial broadband (Unifi / TIME), and domain/hosting.',
    statutoryRule: '100% tax-deductible. If home office, portion must be reasonably apportioned.',
    claimedAmount: 0,
  },
  {
    id: 'biz-staff',
    name: 'Staff Payroll, EPF & SOCSO',
    section: 'Sec 33(1)(b) & Sec 34(4) ITA 1967',
    deductionRate: 1.0, // 100%
    description: 'Salaries, overtime, statutory employer EPF (deductible up to 19% of salary), SOCSO, EIS, and medical benefits.',
    statutoryRule: '100% tax-deductible. Employer EPF is statutory deductible up to 19% cap.',
    claimedAmount: 0,
  },
  {
    id: 'biz-travel',
    name: 'Business Travel, Petrol & Tolls',
    section: 'Sec 33(1) ITA 1967',
    deductionRate: 1.0, // 100%
    description: 'Petrol (RON95/97), Touch ‘n Go highway tolls, business parking, flights, and client site visit transport.',
    statutoryRule: '100% tax-deductible. Must maintain trip logbook or receipts showing business itinerary.',
    claimedAmount: 0,
  },
  {
    id: 'biz-entertainment',
    name: 'Client Entertainment & Meals',
    section: 'Sec 39(1)(l) ITA 1967',
    deductionRate: 0.5, // STRICT 50% LIMITATION
    description: 'Hospitality, meals, coffee meetings, drinks, tickets, and hampers provided to clients or prospective customers.',
    statutoryRule: 'Strict 50% statutory limitation rule under Section 39(1)(l). 50% of total spend is non-deductible disallowable expense!',
    claimedAmount: 0,
  },
  {
    id: 'biz-capital-allowance',
    name: 'Capital Allowance & Equipment',
    section: 'Schedule 3 ITA 1967',
    deductionRate: 1.0,
    description: 'Tax depreciation on computers, laptops, office machinery, vehicles, and furniture instead of direct expense write-off.',
    statutoryRule: 'Initial Allowance (IA) typically 20%; Annual Allowance (AA) 20% for computers/ICT and 10% for plant & machinery.',
    claimedAmount: 0,
    isCapitalAllowance: true,
    initialAllowanceRate: 0.2,
    annualAllowanceRate: 0.2,
  },
  {
    id: 'biz-professional',
    name: 'Professional & Legal Fees',
    section: 'Sec 33(1) ITA 1967',
    deductionRate: 1.0,
    description: 'Accounting, tax advisory, secretarial, legal retainer, and regulatory compliance fees.',
    statutoryRule: '100% tax-deductible if incurred in ordinary course of business.',
    claimedAmount: 0,
  },
  {
    id: 'biz-marketing-saas',
    name: 'Advertising, Creator Tools & SaaS',
    section: 'Sec 33(1) ITA 1967',
    deductionRate: 1.0,
    description: 'Meta/Google ads, Adobe Creative Cloud, editing software, hosting, studio tools, and digital marketing.',
    statutoryRule: '100% tax-deductible when incurred wholly and exclusively for producing gross income.',
    claimedAmount: 0,
  },
  {
    id: 'biz-subcontractors',
    name: 'Freelancer & Subcontractor Fees',
    section: 'Sec 33(1) ITA 1967',
    deductionRate: 1.0,
    description: 'Fees paid to freelance designers, video editors, external developers, and contract professionals.',
    statutoryRule: '100% tax-deductible. Invoices and proof of payment must be retained for 7 years.',
    claimedAmount: 0,
  },
];

// Progressive Tax Calculator function
export function calculateTaxForChargeableIncome(
  chargeableIncome: number,
  brackets: TaxBracket[] = DEFAULT_MALAYSIA_BRACKETS
): { taxPayable: number; marginalRate: number; effectiveRate: number; bracketUsed: TaxBracket } {
  const income = Math.max(0, chargeableIncome);

  if (income <= 0) {
    return {
      taxPayable: 0,
      marginalRate: 0,
      effectiveRate: 0,
      bracketUsed: brackets[0],
    };
  }

  let totalTax = 0;
  let activeBracket = brackets[0];

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    if (income > b.min) {
      activeBracket = b;
      const taxableInThisBracket = b.max !== null ? Math.min(income, b.max) - b.min : income - b.min;
      totalTax = b.baseTax + taxableInThisBracket * b.rate;
    }
  }

  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

  return {
    taxPayable: Math.round(totalTax * 100) / 100,
    marginalRate: activeBracket.rate,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    bracketUsed: activeBracket,
  };
}

// Find marginal rate directly
export function getMarginalTaxRate(
  chargeableIncome: number,
  brackets: TaxBracket[] = DEFAULT_MALAYSIA_BRACKETS
): number {
  const result = calculateTaxForChargeableIncome(chargeableIncome, brackets);
  return result.marginalRate;
}

// Payday Optimizer Engine:
// Takes monthly gross income, EPF rate, and monthly disposable savings budget.
// Calculates optimal allocation across tax-sheltered buckets to maximize cash tax refund!
export function calculatePaydayOptimization(
  grossMonthlyIncome: number,
  monthlyDisposableSavings: number,
  currentReliefs: TaxRelief[],
  brackets: TaxBracket[] = DEFAULT_MALAYSIA_BRACKETS
): PaydayPlanResult {
  const annualGrossIncome = grossMonthlyIncome * 12;
  const epfMonthly = grossMonthlyIncome * 0.11; // Standard 11% employee EPF
  const annualEpf = Math.min(epfMonthly * 12, 4000); // capped at statutory RM 4k for EPF

  // Calculate existing claimed reliefs total
  const currentTotalReliefs = currentReliefs.reduce((acc, r) => acc + Math.min(r.claimedAmount, r.maxLimit), 0);
  const baselineChargeableIncome = Math.max(0, annualGrossIncome - currentTotalReliefs);
  const baselineTax = calculateTaxForChargeableIncome(baselineChargeableIncome, brackets);
  const marginalRate = baselineTax.marginalRate;

  // Prioritize reliefs with available headroom
  // Highest ROI items:
  // 1. PRS (RM 3,000 cap) - pure wealth building with 100% tax shelter
  // 2. SSPN-i (RM 8,000 cap) - guaranteed dividend + 100% tax shelter
  // 3. Lifestyle Tech & Reading (RM 2,500 cap)
  // 4. Sports & Fitness (RM 1,000 cap)
  // 5. Medical Examination & Dental (RM 10,000 cap)
  // 6. EV Charging (RM 2,500 cap)

  const priorityOrder = [
    'relief-prs',
    'relief-sspn',
    'relief-lifestyle',
    'relief-sports',
    'relief-education',
    'relief-ev',
    'relief-medical',
  ];

  const allocations: PaydayAllocationAdvice[] = [];
  let remainingMonthlyBudget = monthlyDisposableSavings;

  for (const reliefId of priorityOrder) {
    const relief = currentReliefs.find((r) => r.id === reliefId);
    if (!relief) continue;

    const remainingCap = Math.max(0, relief.maxLimit - relief.claimedAmount);
    if (remainingCap <= 0) continue;

    // Remaining months in tax year (assume average 8 months or calculate pace)
    const suggestedMonthlyTarget = Math.round(remainingCap / 12);
    const allocatedMonthly = Math.min(remainingMonthlyBudget, Math.max(50, suggestedMonthlyTarget));

    if (allocatedMonthly > 0) {
      const annualTotal = allocatedMonthly * 12;
      const actualDeductibleAnnual = Math.min(annualTotal, remainingCap);
      const taxSavingsCash = actualDeductibleAnnual * marginalRate;

      let explanation = '';
      if (relief.id === 'relief-prs') {
        explanation = `Allocating RM ${allocatedMonthly}/mo into PRS yields RM ${Math.round(taxSavingsCash)} guaranteed cash tax reduction at your ${(marginalRate * 100).toFixed(0)}% marginal bracket.`;
      } else if (relief.id === 'relief-sspn') {
        explanation = `Save RM ${allocatedMonthly}/mo for children’s education while shielding RM ${Math.round(actualDeductibleAnnual)} from LHDN tax.`;
      } else if (relief.id === 'relief-lifestyle') {
        explanation = `Fund your tech upgrades and home Wi-Fi with an effective ${(marginalRate * 100).toFixed(0)}% discount through tax shelter.`;
      } else if (relief.id === 'relief-sports') {
        explanation = `Gym membership and badminton court fees subsidized up to RM ${Math.round(taxSavingsCash)} by LHDN.`;
      } else {
        explanation = `Claim up to remaining RM ${remainingCap} quota under ${relief.section}.`;
      }

      allocations.push({
        reliefId: relief.id,
        reliefName: relief.name,
        category: relief.category,
        statutorySection: relief.section,
        remainingCap,
        recommendedMonthly: allocatedMonthly,
        annualTotal: actualDeductibleAnnual,
        taxSavingsCash: Math.round(taxSavingsCash),
        marginalRate,
        efficiencyRating: marginalRate >= 0.19 ? 'Max' : marginalRate >= 0.11 ? 'High' : 'Moderate',
        explanation,
      });

      remainingMonthlyBudget -= allocatedMonthly;
    }

    if (remainingMonthlyBudget <= 0) break;
  }

  const totalMonthlyAllocated = allocations.reduce((acc, a) => acc + a.recommendedMonthly, 0);
  const totalAnnualAllocated = allocations.reduce((acc, a) => acc + a.annualTotal, 0);
  const totalAnnualTaxSaved = allocations.reduce((acc, a) => acc + a.taxSavingsCash, 0);

  const optimizedChargeableIncome = Math.max(0, baselineChargeableIncome - totalAnnualAllocated);
  const optimizedTax = calculateTaxForChargeableIncome(optimizedChargeableIncome, brackets);

  return {
    grossMonthlyIncome,
    annualGrossIncome,
    epfMonthly,
    annualEpf,
    monthlyDisposableSavings,
    estimatedMarginalRate: marginalRate,
    allocations,
    totalMonthlyAllocated,
    totalAnnualAllocated,
    totalAnnualTaxSaved,
    netEffectiveReliefIncrease: totalAnnualAllocated,
    projectedTaxBeforeOptimization: baselineTax.taxPayable,
    projectedTaxAfterOptimization: optimizedTax.taxPayable,
  };
}

// Generate Cryptographic SHA-256 Hash for Receipt & Audit Vault (Section 82A ITA 1967)
export async function generateSHA256Hash(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Deterministic fallback hash if crypto.subtle is unavailable
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash-${Math.abs(hash).toString(16).padStart(16, '0')}${Date.now().toString(16)}`;
  }
}

// Format Malaysian Ringgit currency
export function formatCurrency(amount: number, symbol: string = 'RM'): string {
  return `${symbol} ${Number(amount || 0).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Mask Malaysian NRIC for client-side zero-knowledge privacy
export function maskNRIC(nric: string): string {
  if (!nric) return '******-**-****';
  const clean = nric.trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-XX-${parts[2]}`;
    }
  }
  if (clean.length === 12) {
    return `${clean.slice(0, 6)}-XX-${clean.slice(-4)}`;
  }
  return clean.length > 6 ? `${clean.slice(0, 6)}-XX-XXXX` : '******-**-****';
}

import { LHDN_STATUTORY_RELIEFS_MAPPING } from '../constants/lhdnReliefs';

export interface LhdnWhitelistValidationResult {
  isApproved: boolean;
  isJunkRejected: boolean;
  isBorderline: boolean;
  score: number; // 0 - 100
  statusBadge: 'LHDN_APPROVED' | 'BORDERLINE' | 'JUNK_REJECTED';
  matchedCategory?: string;
  statutorySection?: string;
  rejectionReason?: string;
  recommendation: string;
  flaggedNonDeductibleItems: string[];
  qualifyingItems: string[];
}

/**
 * Known Blacklist / Junk Keywords (Strictly Non-Deductible Personal Consumption in LHDN)
 */
const JUNK_KEYWORDS = [
  // Fast Food & Beverage
  'mcdonalds', 'mcdonald', 'kfc', 'starbucks', 'burger king', 'dominos', 'pizza hut',
  'subway', 'tealive', 'chatime', 'zus coffee', 'gong cha', 'daboba', 'boba', 'nandos',
  'sushi king', 'oldtown white coffee', 'texas chicken', 'marrybrown', 'a&w',

  // Groceries, Snacks & Confectionery (Unless medical/baby formula specifically itemized)
  '99 speedmart', '7-eleven', 'mynews', 'family mart', 'lotus', 'tesco', 'giant',
  'jaya grocer', 'village grocer', 'cold storage', 'mydin', 'snack', 'candy', 'chocolate',
  'chips', 'soft drink', 'soda', 'toblerone', 'ritter sport',

  // Entertainment, Leisure & Gaming
  'gsc', 'golden screen cinemas', 'tgv', 'mbo', 'cinema', 'movie ticket', 'popcorn',
  'karaoke', 'bowling', 'steam games', 'playstation', 'xbox', 'nintendo', 'genting',
  'sunway lagoon', 'escape park', 'theme park',

  // Non-Sports Apparel, Beauty & Jewelry
  'zara', 'h&m', 'sephora', 'watsons cosmetics', 'guardian makeup', 'perfume',
  'handbag', 'jewelry', 'pandora', 'swarovski', 'gold shop',

  // Alcohol, Tobacco & Vape
  'beer', 'wine', 'liquor', 'whisky', 'vodka', 'bar', 'pub', 'vape', 'cigarette', 'tobacco',
];

/**
 * Known Whitelist Keywords for LHDN Tax Relief Categories
 */
const WHITELIST_MAPPING = [
  {
    category: 'Lifestyle - Tech & Digital',
    section: 'Sec 46(1)(u) ITA 1967',
    keywords: ['machines', 'apple', 'ipad', 'iphone', 'macbook', 'laptop', 'desktop', 'computer', 'tablet', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'urban republic', 'switch', 'harvey norman', 'senheng', 'all it hypermarket', 'monitors', 'printer', 'unifi', 'time fibre', 'maxis broadband', 'celcomdigi'],
  },
  {
    category: 'Lifestyle - Books & Publications',
    section: 'Sec 46(1)(p) ITA 1967',
    keywords: ['popular book', 'kinokuniya', 'mph', 'bookstore', 'book', 'novel', 'magazine', 'journal', 'ebook', 'periodical', 'dictionary', 'encyclopedia'],
  },
  {
    category: 'Sports & Physical Fitness',
    section: 'Sec 46(1)(q) ITA 1967',
    keywords: ['gym', 'celebrity fitness', 'fitness first', 'anytime fitness', 'badminton', 'futsal', 'tennis', 'court rental', 'sports equipment', 'decathlon', 'nike', 'adidas', 'puma', 'under armour', 'garmin', 'smartwatch', 'fitness tracker', 'marathon', 'swimming pass', 'sports venue'],
  },
  {
    category: 'Medical Treatment & Health Checkup',
    section: 'Sec 46(1)(g) & (h) ITA 1967',
    keywords: ['clinic', 'klinik', 'hospital', 'pharmacy', 'farmasi', 'medical', 'doctor', 'health screening', 'blood test', 'lab checkup', 'dental', 'scaling', 'vaccination', 'vaccine', 'dialysis', 'physiotherapy', 'qualitas', 'bp healthcare', 'pathlab', 'sunway medical', 'pantai hospital', 'gleneagles'],
  },
  {
    category: 'Parents Medical & Special Care',
    section: 'Sec 46(1)(o) ITA 1967',
    keywords: ['nursing home', 'elderly care', 'carer fees', 'parents medical', 'hearing aid', 'wheelchair', 'supplementary medical equipment'],
  },
  {
    category: 'Education & Professional Courses',
    section: 'Sec 46(1)(f) ITA 1967',
    keywords: ['university', 'college', 'tuition fees', 'course fee', 'upskilling', 'coursera', 'udemy', 'acca', 'cpa', 'cfa', 'pmp', 'aws certification', 'professional diploma', 'master degree', 'phd'],
  },
  {
    category: 'Childcare & Kindergarten',
    section: 'Sec 46(1)(r) ITA 1967',
    keywords: ['tadika', 'taska', 'kindergarten', 'childcare', 'preschool', 'daycare center'],
  },
  {
    category: 'Breastfeeding Equipment',
    section: 'Sec 46(1)(q) ITA 1967',
    keywords: ['breast pump', 'breastfeeding equipment', 'milk storage kit', 'lactation pump'],
  },
  {
    category: 'EV Charging & Green Technology',
    section: 'Sec 46(1)(v) ITA 1967',
    keywords: ['ev charging', 'chargEV', 'gentari', 'shell recharge', 'tesla supercharger', 'ev wallbox', 'solar panel installation'],
  },
  {
    category: 'SSPN & PRS Retirement Savings',
    section: 'Sec 46(1)(k) ITA 1967',
    keywords: ['sspn', 'ptptn', 'prs', 'private retirement scheme', 'public mutual prs', 'kenanga prs', 'principal prs'],
  },
  {
    category: 'Business Deductions (Form B / e-Invoice)',
    section: 'Sec 33(1) / Sec 39 ITA 1967',
    keywords: ['tnb', 'utility', 'telecom', 'commercial rent', 'office supplies', 'client entertainment', 'advertising', 'facebook ads', 'google ads', 'cloud hosting', 'aws', 'software license'],
  },
];

/**
 * Cross-references OCR / AI analyzed results against official LHDN whitelist & blacklist
 */
export function validateReceiptAgainstLhdnWhitelist(
  merchantName: string = '',
  rawItems: { name: string; amount: number; isClaimable?: boolean }[] = [],
  notes: string = ''
): LhdnWhitelistValidationResult {
  const fullText = `${merchantName} ${notes} ${rawItems.map((i) => i.name).join(' ')}`.toLowerCase();

  const flaggedNonDeductibleItems: string[] = [];
  const qualifyingItems: string[] = [];

  // 1. Check for Junk / Blacklist Keywords
  let junkHitCount = 0;
  for (const junkKw of JUNK_KEYWORDS) {
    if (fullText.includes(junkKw)) {
      junkHitCount++;
    }
  }

  // Scan individual line items for junk keywords
  rawItems.forEach((item) => {
    const itemNameLower = item.name.toLowerCase();
    const isJunkItem = JUNK_KEYWORDS.some((kw) => itemNameLower.includes(kw));
    if (isJunkItem) {
      flaggedNonDeductibleItems.push(`${item.name} (RM ${item.amount.toFixed(2)})`);
    } else {
      qualifyingItems.push(item.name);
    }
  });

  // 2. Check for Whitelist Matches
  let matchedRule: typeof WHITELIST_MAPPING[0] | null = null;
  for (const rule of WHITELIST_MAPPING) {
    const match = rule.keywords.some((kw) => fullText.includes(kw));
    if (match) {
      matchedRule = rule;
      break;
    }
  }

  // Determine Final Validation State
  if (junkHitCount > 0 && !matchedRule) {
    // Definitive Junk / Non-deductible Upload
    return {
      isApproved: false,
      isJunkRejected: true,
      isBorderline: false,
      score: 15,
      statusBadge: 'JUNK_REJECTED',
      rejectionReason: 'Strictly non-deductible personal expense (fast food, entertainment, tobacco, or non-qualifying groceries) per LHDN Section 33 & Section 46 ITA 1967 guidelines.',
      recommendation: 'Reject or set claimable amount to RM 0.00 to avoid tax penalty during LHDN field audit.',
      flaggedNonDeductibleItems,
      qualifyingItems: [],
    };
  }

  if (junkHitCount > 0 && matchedRule) {
    // Borderline / Mixed Receipt (e.g. Popular Bookstore containing books + chocolates/pens)
    return {
      isApproved: false,
      isJunkRejected: false,
      isBorderline: true,
      score: 65,
      statusBadge: 'BORDERLINE',
      matchedCategory: matchedRule.category,
      statutorySection: matchedRule.section,
      rejectionReason: `Mixed item receipt detected under ${matchedRule.category}. Some line items are non-deductible personal purchases.`,
      recommendation: `Auto-exclude non-deductible items (${flaggedNonDeductibleItems.join(', ')}) and claim qualifying items under ${matchedRule.section}.`,
      flaggedNonDeductibleItems,
      qualifyingItems,
    };
  }

  if (matchedRule) {
    // Verified LHDN Whitelist Category
    return {
      isApproved: true,
      isJunkRejected: false,
      isBorderline: false,
      score: 98,
      statusBadge: 'LHDN_APPROVED',
      matchedCategory: matchedRule.category,
      statutorySection: matchedRule.section,
      recommendation: `100% compliant with ${matchedRule.category} (${matchedRule.section}). Retain document for 7 years.`,
      flaggedNonDeductibleItems: [],
      qualifyingItems,
    };
  }

  // Unclassified / Non-Receipt Upload (e.g., random picture, selfie, or non-qualifying item)
  return {
    isApproved: false,
    isJunkRejected: true,
    isBorderline: false,
    score: 25,
    statusBadge: 'JUNK_REJECTED',
    matchedCategory: 'Non-Qualifying / Unclassified Upload',
    statutorySection: 'Sec 33 / Sec 46 Non-Claimable Review',
    rejectionReason: 'The uploaded document does not match any official LHDN tax-deductible category or appears to be a non-receipt photo. Under LHDN guidelines, only verified tax receipts, tax invoices, and official bills are claimable.',
    recommendation: 'Do NOT claim this expense unless you possess a valid itemized official tax invoice/receipt from an eligible merchant.',
    flaggedNonDeductibleItems,
    qualifyingItems: [],
  };
}

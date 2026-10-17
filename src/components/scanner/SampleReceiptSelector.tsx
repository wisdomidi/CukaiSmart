import React from 'react';
import { Sparkles, FileText, Activity, ShieldCheck, Dumbbell, Zap, Baby, AlertCircle } from 'lucide-react';

export interface SampleReceipt {
  id: string;
  title: string;
  category: string;
  amount: string;
  merchant: string;
  icon: React.ElementType;
  color: string;
  description: string;
  badge: string;
  svgContent: string;
}

// Generate authentic visual SVG receipts with Malaysian tax identifiers (SSM, TIN, Tax Invoice format)
function createReceiptSvg(
  merchant: string,
  ssm: string,
  tin: string,
  docType: string,
  date: string,
  items: Array<{ name: string; qty: number; price: string; total: string }>,
  subtotal: string,
  taxSst: string,
  total: string,
  note: string,
  qrCodeText: string = 'MYINVOIS-VERIFIED'
): string {
  const itemRows = items
    .map(
      (it, idx) => `
    <g transform="translate(24, ${180 + idx * 30})">
      <text x="0" y="0" font-family="monospace" font-size="12" fill="#1e293b" font-weight="600">${it.name}</text>
      <text x="210" y="0" font-family="monospace" font-size="12" fill="#475569" text-anchor="middle">${it.qty}</text>
      <text x="280" y="0" font-family="monospace" font-size="12" fill="#475569" text-anchor="end">${it.price}</text>
      <text x="350" y="0" font-family="monospace" font-size="12" fill="#0f172a" font-weight="bold" text-anchor="end">${it.total}</text>
    </g>`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 620" width="400" height="620">
    <!-- Receipt Paper Background -->
    <defs>
      <filter id="paperShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.15"/>
      </filter>
    </defs>
    <rect x="10" y="10" width="380" height="600" rx="12" fill="#fafafa" stroke="#e2e8f0" stroke-width="2" filter="url(#paperShadow)"/>
    
    <!-- Top Header -->
    <rect x="10" y="10" width="380" height="6" fill="#059669" rx="3"/>
    
    <!-- Merchant Title -->
    <text x="200" y="48" font-family="sans-serif" font-size="18" font-weight="800" fill="#0f172a" text-anchor="middle" letter-spacing="1">${merchant}</text>
    <text x="200" y="66" font-family="monospace" font-size="10" fill="#64748b" text-anchor="middle">SSM: ${ssm} | TIN: ${tin}</text>
    <text x="200" y="80" font-family="sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">LEGAL REGISTRATION UNDER COMPANIES ACT MALAYSIA</text>
    
    <!-- Divider -->
    <line x1="24" y1="94" x2="376" y2="94" stroke="#cbd5e1" stroke-dasharray="4,4" stroke-width="1.5"/>
    
    <!-- Metadata -->
    <text x="24" y="114" font-family="monospace" font-size="11" fill="#475569"><tspan font-weight="bold">DOC TYPE:</tspan> ${docType}</text>
    <text x="24" y="132" font-family="monospace" font-size="11" fill="#475569"><tspan font-weight="bold">DATE:</tspan> ${date}</text>
    <text x="376" y="114" font-family="monospace" font-size="11" fill="#475569" text-anchor="end"><tspan font-weight="bold">INV NO:</tspan> MY-${date.replace(/-/g, '')}-889</text>
    <text x="376" y="132" font-family="monospace" font-size="11" fill="#059669" text-anchor="end" font-weight="bold">STATUS: OFFICIAL TAX RECEIPT</text>
    
    <!-- Items Table Header -->
    <line x1="24" y1="146" x2="376" y2="146" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="24" y="162" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a">ITEM DESCRIPTION</text>
    <text x="210" y="162" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">QTY</text>
    <text x="280" y="162" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="end">PRICE</text>
    <text x="376" y="162" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="end">TOTAL (RM)</text>
    <line x1="24" y1="170" x2="376" y2="170" stroke="#cbd5e1" stroke-width="1"/>
    
    <!-- Item Rows -->
    ${itemRows}
    
    <!-- Financial Summary Box -->
    <line x1="24" y1="380" x2="376" y2="380" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="24" y="402" font-family="monospace" font-size="12" fill="#64748b">Subtotal Excl. SST:</text>
    <text x="376" y="402" font-family="monospace" font-size="12" fill="#334155" text-anchor="end">${subtotal}</text>
    
    <text x="24" y="422" font-family="monospace" font-size="12" fill="#64748b">Service Tax / SST (6%/8%):</text>
    <text x="376" y="422" font-family="monospace" font-size="12" fill="#334155" text-anchor="end">${taxSst}</text>
    
    <rect x="24" y="434" width="352" height="42" fill="#f1f5f9" rx="6"/>
    <text x="36" y="460" font-family="sans-serif" font-size="14" font-weight="800" fill="#0f172a">TOTAL PAYABLE (MYR):</text>
    <text x="364" y="462" font-family="sans-serif" font-size="18" font-weight="900" fill="#059669" text-anchor="end">${total}</text>
    
    <!-- Footer Note & MyInvois Stamp -->
    <line x1="24" y1="492" x2="376" y2="492" stroke="#e2e8f0" stroke-width="1"/>
    <text x="200" y="512" font-family="monospace" font-size="10" fill="#64748b" text-anchor="middle">${note}</text>
    
    <!-- Mock QR Code Barcode Representation -->
    <g transform="translate(140, 526)">
      <rect x="0" y="0" width="120" height="48" fill="#ffffff" stroke="#94a3b8" rx="4"/>
      <rect x="8" y="8" width="16" height="16" fill="#0f172a"/>
      <rect x="12" y="12" width="8" height="8" fill="#ffffff"/>
      <rect x="96" y="8" width="16" height="16" fill="#0f172a"/>
      <rect x="100" y="12" width="8" height="8" fill="#ffffff"/>
      <rect x="8" y="28" width="8" height="12" fill="#0f172a"/>
      <rect x="20" y="28" width="12" height="6" fill="#0f172a"/>
      <rect x="36" y="10" width="52" height="4" fill="#0f172a"/>
      <rect x="36" y="18" width="32" height="4" fill="#0f172a"/>
      <rect x="44" y="26" width="44" height="4" fill="#0f172a"/>
      <rect x="36" y="34" width="60" height="4" fill="#0f172a"/>
      <text x="60" y="44" font-family="monospace" font-size="7" fill="#059669" text-anchor="middle" font-weight="bold">${qrCodeText}</text>
    </g>
    
    <text x="200" y="594" font-family="sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">Retain for 7 Years under Section 82A Income Tax Act 1967</text>
  </svg>`;
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'sample-laptop',
    title: 'Harvey Norman Laptop Invoice',
    category: 'Lifestyle Relief (Laptop/Tech)',
    amount: 'RM 2,499.00',
    merchant: 'Harvey Norman Malaysia Sdn Bhd',
    icon: Sparkles,
    color: 'from-blue-600 to-indigo-600',
    badge: 'Sec 46(1)(p) ITA 1967',
    description: 'Personal computer/laptop purchase with itemized warranty and official TIN registration.',
    svgContent: createReceiptSvg(
      'HARVEY NORMAN MALAYSIA',
      '200301019876 (632190-X)',
      'C 28912300041',
      'Official Tax Invoice',
      '2026-03-14',
      [
        { name: 'UltraBook Intel Core Ultra 7 16GB', qty: 1, price: '2,357.55', total: '2,357.55' },
        { name: 'Wireless Bluetooth Mouse M350', qty: 1, price: '89.00', total: '89.00' },
        { name: 'Anti-Glare Screen Protector', qty: 1, price: '52.45', total: '52.45' },
      ],
      'RM 2,357.55',
      'RM 141.45',
      'RM 2,499.00',
      'Eligible under Section 46(1)(p) Personal Computer / Tablet Relief',
      'MYINVOIS-UIN-7890214'
    ),
  },
  {
    id: 'sample-medical',
    title: 'BP Specialist Clinical & Lab Bill',
    category: 'Medical Treatment Relief',
    amount: 'RM 950.00',
    merchant: 'BP Healthcare Group Sdn Bhd',
    icon: Activity,
    color: 'from-rose-600 to-red-600',
    badge: 'Sec 46(1)(g) ITA 1967',
    description: 'Complete comprehensive medical check-up & specialist consultation lab test.',
    svgContent: createReceiptSvg(
      'BP HEALTHCARE CLINICAL LAB',
      '199901012345 (498231-M)',
      'C 1928374650',
      'Official Medical Receipt',
      '2026-04-18',
      [
        { name: 'Comprehensive Health Screening Package', qty: 1, price: '750.00', total: '750.00' },
        { name: 'Specialist Physician Consultation Fee', qty: 1, price: '150.00', total: '150.00' },
        { name: 'HbA1c & Fasting Lipid Panel', qty: 1, price: '50.00', total: '50.00' },
      ],
      'RM 950.00',
      'RM 0.00 (Exempt)',
      'RM 950.00',
      'Registered Healthcare Facility - Qualifying Sec 46(1)(g) Medical Relief',
      'MYINVOIS-MED-449102'
    ),
  },
  {
    id: 'sample-sports',
    title: 'Celebrity Fitness Annual Membership',
    category: 'Sports & Fitness Equipment',
    amount: 'RM 1,000.00',
    merchant: 'Evolution Wellness Fitness MY',
    icon: Dumbbell,
    color: 'from-amber-600 to-orange-600',
    badge: 'Sec 46(1)(q) ITA 1967',
    description: 'Gym membership subscription at registered fitness facility under Sports Development Act.',
    svgContent: createReceiptSvg(
      'CELEBRITY FITNESS (MID VALLEY)',
      '200501034567 (712398-T)',
      'C 8829103948',
      'Official Gym Receipt',
      '2026-02-10',
      [
        { name: 'All-Club Fitness Access (12-Mo)', qty: 1, price: '920.00', total: '920.00' },
        { name: 'Personal Trainer Orientation Session', qty: 1, price: '80.00', total: '80.00' },
      ],
      'RM 920.00',
      'RM 80.00',
      'RM 1,000.00',
      'Sports Development Act 1997 - Section 46(1)(q) Qualifying Relief',
      'MYINVOIS-GYM-991204'
    ),
  },
  {
    id: 'sample-childcare',
    title: 'Tadika Ceria Childcare Fee Receipt',
    category: 'Childcare & TASKA/TADIKA',
    amount: 'RM 1,200.00',
    merchant: 'Pusat Asuhan Tadika Ceria Sdn Bhd',
    icon: Baby,
    color: 'from-emerald-600 to-teal-600',
    badge: 'Sec 46(1)(r) ITA 1967',
    description: 'Registered kindergarten & childcare fees for children aged 6 and below.',
    svgContent: createReceiptSvg(
      'TADIKA CERIA (REGISTERED JKM)',
      '201801045678 (1298456-P)',
      'C 3344556677',
      'Official Fee Receipt',
      '2026-05-02',
      [
        { name: 'Term 1 Early Childhood Education Fee', qty: 1, price: '1,000.00', total: '1,000.00' },
        { name: 'Child Nutrition & Educational Materials', qty: 1, price: '200.00', total: '200.00' },
      ],
      'RM 1,200.00',
      'RM 0.00 (Exempt)',
      'RM 1,200.00',
      'Certified under Child Care Centre Act 1984 - Sec 46(1)(r) Relief',
      'MYINVOIS-TADIKA-0041'
    ),
  },
  {
    id: 'sample-ev',
    title: 'Gentari EV Fast Charging Hardware',
    category: 'Electric Vehicle (EV) Facility',
    amount: 'RM 1,850.00',
    merchant: 'Gentari Green Mobility Sdn Bhd',
    icon: Zap,
    color: 'from-cyan-600 to-blue-600',
    badge: 'Sec 46(1)(v) ITA 1967',
    description: 'Electric Vehicle charging wallbox installation and subscription facility.',
    svgContent: createReceiptSvg(
      'GENTARI GREEN MOBILITY',
      '202201023456 (1467890-W)',
      'C 7788990011',
      'Tax Invoice (EV Facility)',
      '2026-06-20',
      [
        { name: 'Home EV Wallbox Charger 11kW Type 2', qty: 1, price: '1,500.00', total: '1,500.00' },
        { name: 'Certified Electrical Wiring & Breaker', qty: 1, price: '350.00', total: '350.00' },
      ],
      'RM 1,745.28',
      'RM 104.72',
      'RM 1,850.00',
      'Eligible under Section 46(1)(v) Electric Vehicle Charging Equipment Relief',
      'MYINVOIS-EV-981240'
    ),
  },
  {
    id: 'sample-dining-disallowed',
    title: 'Starbucks Coffee & Personal Pastry',
    category: 'Non-Deductible Personal Dining',
    amount: 'RM 38.50',
    merchant: 'Berjaya Starbucks Coffee Co Sdn Bhd',
    icon: AlertCircle,
    color: 'from-slate-600 to-zinc-700',
    badge: 'Disallowed (Form BE)',
    description: 'Personal leisure food & beverage — tests AI rejection rule under Section 82 ITA 1967.',
    svgContent: createReceiptSvg(
      'STARBUCKS COFFEE MALAYSIA',
      '199801007890 (464019-D)',
      'C 0192837461',
      'Cash Register Receipt',
      '2026-06-05',
      [
        { name: 'Caramel Macchiato Venti', qty: 1, price: '21.50', total: '21.50' },
        { name: 'Butter Croissant Warm', qty: 1, price: '9.00', total: '9.00' },
        { name: 'Mineral Water 500ml', qty: 1, price: '8.00', total: '8.00' },
      ],
      'RM 36.32',
      'RM 2.18',
      'RM 38.50',
      'Personal dining / F&B is strictly disallowed for Form BE individual tax relief.',
      'POS-TX-998241'
    ),
  },
];

interface SampleReceiptSelectorProps {
  onSelectSample: (base64Data: string, sample: SampleReceipt) => void;
  disabled?: boolean;
}

export const SampleReceiptSelector: React.FC<SampleReceiptSelectorProps> = ({
  onSelectSample,
  disabled = false,
}) => {
  const handlePickSample = (sample: SampleReceipt) => {
    // Convert SVG to data URI
    const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(sample.svgContent)))}`;
    onSelectSample(svgBase64, sample);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Standard Document Scenarios
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified Presets
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Select any authentic Malaysian tax document scenario below to evaluate Gemini Multimodal OCR and LHDN relief limits immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SAMPLE_RECEIPTS.map((sample) => {
          const Icon = sample.icon;
          return (
            <button
              key={sample.id}
              onClick={() => handlePickSample(sample)}
              disabled={disabled}
              className={`text-left p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-700 transition group relative overflow-hidden cursor-pointer ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${sample.color} flex items-center justify-center text-white shrink-0 shadow-sm`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {sample.title}
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-400 shrink-0">
                  {sample.amount}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                {sample.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                <span className="font-mono text-emerald-400/90">{sample.badge}</span>
                <span className="group-hover:translate-x-0.5 transition-transform text-slate-300 group-hover:text-emerald-300 font-semibold flex items-center gap-1">
                  Run Scan →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import { ReceiptRecord } from '../types/tax';
import { formatCurrency } from './taxEngine';
export { export7YearAuditRecordsToPDF } from './pdfExport';
export { exportTaxYearReceiptsAsZip } from './zipExport';

/**
 * Exports receipt records to a structured CSV file for LHDN tax submission and audit backup.
 */
export function exportReceiptsToCSV(receipts: ReceiptRecord[], taxYear: number | string): void {
  if (!receipts || receipts.length === 0) {
    alert('No receipts found to export.');
    return;
  }

  const headers = [
    'Receipt ID',
    'Tax Year',
    'Date',
    'Merchant Name',
    'SSM / ROC Number',
    'Category Name',
    'Statutory Tax Section',
    'Persona',
    'Total Amount (RM)',
    'Claimable Amount (RM)',
    'Audit Status',
    'Verification Hash (SHA-256)',
    'Retention Horizon (Until 31 Dec)',
    'Itemized Details',
  ];

  const escapeCSV = (str: string | number | undefined | null) => {
    if (str === null || str === undefined) return '""';
    const stringVal = String(str);
    // Replace quotes with double quotes
    return `"${stringVal.replace(/"/g, '""')}"`;
  };

  const rows = receipts.map((r) => {
    const itemSummary = r.items
      .map((it) => `${it.name} (${it.isClaimable ? 'Claimable' : 'Excluded'}: RM${it.amount.toFixed(2)})`)
      .join('; ');

    return [
      escapeCSV(r.id),
      escapeCSV(r.taxYear),
      escapeCSV(r.date),
      escapeCSV(r.merchantName),
      escapeCSV(r.ssmNumber),
      escapeCSV(r.categoryName),
      escapeCSV(r.statutorySection),
      escapeCSV(r.persona),
      escapeCSV(r.totalAmount.toFixed(2)),
      escapeCSV(r.claimableAmount.toFixed(2)),
      escapeCSV(r.lhdnValidation.auditStatus),
      escapeCSV(r.verificationHash),
      escapeCSV(r.retentionUntilYear),
      escapeCSV(itemSummary),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CukaiSmart_LHDN_Claimable_Receipts_YA${taxYear}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

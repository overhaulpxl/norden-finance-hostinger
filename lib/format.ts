import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const RUPIAH_FORMATTER = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | null | undefined): string {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const sign = safeValue < 0 ? '-' : '';
  return `Rp ${sign}${RUPIAH_FORMATTER.format(Math.abs(Math.round(safeValue)))}`;
}

export function formatRupiah(amount: number): string {
  return formatCurrency(amount);
}

export function formatCoverageMonths(value: number | null | undefined): string {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;

  if (safeValue >= 24) return '24+ bulan';
  if (safeValue === 1) return '1 bulan';
  return `${safeValue.toFixed(1)} bulan`;
}

export function formatTanggal(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return format(date, 'd MMM yyyy, HH:mm', { locale: id });
}

// "bni" -> "BNI", "gopay" -> "GOPAY"
export function formatMethodName(method: string): string {
  return method.toUpperCase();
}

// "makan" -> "Makan", "lain-lain" -> "Lain-Lain", "ayam geprek" -> "Ayam Geprek"
export function capitalize(text: string): string {
  if (!text) return '';
  return text
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(text.includes('-') ? '-' : ' ');
}

import { DEFAULT_MONTHLY_PRICE, DEFAULT_PRICING, DEFAULT_TRIAL_DAYS, DEFAULT_YEARLY_PRICE } from './constants';

export type PublicTestimonial = {
  name: string;
  label: string;
  rating: number;
  message: string;
};

export const LANDING_TRIAL_DAYS = DEFAULT_TRIAL_DAYS;

export const LANDING_PRICING = {
  trial: {
    ...DEFAULT_PRICING.trial,
    id: 'static-trial-plan',
    billingType: null,
    source: 'static-fallback',
  },
  monthly: {
    ...DEFAULT_PRICING.monthly,
    id: 'static-pro-monthly',
    durationDays: null,
    source: 'static-fallback',
  },
  yearly: {
    ...DEFAULT_PRICING.yearly,
    id: 'static-pro-yearly',
    durationDays: null,
    source: 'static-fallback',
  },
} as const;

export const LANDING_MONTHLY_PRICE = DEFAULT_MONTHLY_PRICE;
export const LANDING_YEARLY_PRICE = DEFAULT_YEARLY_PRICE;

export const FALLBACK_PUBLIC_TESTIMONIALS: PublicTestimonial[] = [
  {
    name: 'Pengguna Norden',
    label: 'Pengguna Beta',
    rating: 5,
    message: 'Norden membantu saya mencatat pemasukan dan pengeluaran harian tanpa spreadsheet yang ribet.',
  },
  {
    name: 'Pengguna Norden',
    label: 'Pengguna Beta',
    rating: 5,
    message: 'Dashboard saldo dan budget membuat pola pengeluaran bulanan lebih mudah terlihat.',
  },
  {
    name: 'Pengguna Norden',
    label: 'Pengguna Beta',
    rating: 4,
    message: 'Fitur dompet, subscription, dan laporan bulanan terasa praktis untuk rutinitas finansial pribadi.',
  },
];

export function isPublicSafeFeedback(message: string) {
  return !/(whatsapp|chat\s+wa|via\s+wa|\bwa\b|crypto|saham|investasi)/i.test(message);
}

export function clampPublicRating(rating: number) {
  return Math.max(1, Math.min(5, rating));
}

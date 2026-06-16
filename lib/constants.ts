export const METHOD_ALIASES: Record<string, string> = {
  cash: 'cash',
  tunai: 'cash',
  'uang tunai': 'cash',
  bni: 'bni',
  'bank bni': 'bni',
  bca: 'bca',
  'bank bca': 'bca',
  dana: 'dana',
  gopay: 'gopay',
  'go pay': 'gopay',
  'go-pay': 'gopay',
  gojek: 'gopay',
  ovo: 'ovo',
  shopeepay: 'shopeepay',
  'shopee pay': 'shopeepay',
  'shopee-pay': 'shopeepay',
  spay: 'shopeepay',
  seabank: 'seabank',
  'sea bank': 'seabank',
  'sea-bank': 'seabank',
  jago: 'jago',
  'bank jago': 'jago',
  blu: 'blu',
  'bank blu': 'blu',
  paypal: 'paypal',
};

export const TYPE_KEYWORDS = {
  masuk: ['masuk', 'dapet', 'dapat', 'terima', 'refund', 'gaji', 'bonus', 'jual', 'jualan', 'middleman', 'fee', 'topup'],
  keluar: ['keluar', 'beli', 'bayar', 'jajan', 'makan', 'minum', 'bensin', 'langganan', 'parkir', 'ongkir', 'transfer', 'wd', 'tarik'],
};

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  makan: ['ayam', 'geprek', 'nasi', 'minum', 'jajan', 'makan', 'kopi', 'indomie'],
  transport: ['bensin', 'parkir', 'gojek', 'grab', 'tol', 'kereta'],
  langganan: ['netflix', 'spotify', 'youtube', 'internet', 'wifi', 'listrik'],
  middleman: ['middleman', 'mm', 'fee'],
  jualan: ['jual', 'jualan', 'laku'],
  gaji: ['gaji', 'bonus'],
  refund: ['refund'],
  transfer: ['transfer', 'tf'],
  topup: ['topup', 'isi'],
};

export const DEFAULT_METHOD = 'unknown';
export const DEFAULT_CATEGORY = 'lain-lain';
export const DEFAULT_TYPE = 'keluar'; // Default is expense unless stated otherwise

export const DEFAULT_TRIAL_DAYS = 14;
export const DEFAULT_MONTHLY_PRICE = 19000;
export const DEFAULT_YEARLY_PRICE = 149000;
export const MIN_EMERGENCY_MONTHLY_EXPENSE = 100000;

export const DEFAULT_PRICING = {
  trial: {
    name: 'Trial Plan',
    type: 'trial',
    price: 0,
    durationDays: DEFAULT_TRIAL_DAYS,
    isActive: true,
  },
  monthly: {
    name: 'Pro Monthly',
    type: 'pro',
    billingType: 'monthly',
    price: DEFAULT_MONTHLY_PRICE,
    isActive: true,
  },
  yearly: {
    name: 'Pro Yearly',
    type: 'pro',
    billingType: 'yearly',
    price: DEFAULT_YEARLY_PRICE,
    isActive: true,
  },
} as const;

export const MVP_FEATURES = [
  'Unlimited transaksi',
  'Unlimited dompet',
  'Budget per kategori',
  'Subscription manager',
  'Saving goals & debt tracker',
  'Paylater tracker',
  'Financial health score',
  'No-spend calendar',
  'Norden AI Parser',
  'Norden AI Receipt Scanner',
  'Norden AI Insights',
  'PDF Monthly Report',
  'Export CSV & JSON',
  'Monthly Wrapped',
  'Share Card Generator',
  'Budget Forecast',
  'Cashflow Forecast',
];

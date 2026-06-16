// ==========================================
// Norden Finance — Type Definitions
// ==========================================
// These types mirror the Prisma schema for use in client components.
// Import from @prisma/client for server-side; use these for client-side props.

export type TransactionType = 'masuk' | 'keluar' | 'transfer';
export type UserRole = 'user' | 'admin';
export type PlanType = 'trial' | 'pro';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type DebtType = 'piutang' | 'hutang' | string;

// ==========================================
// Core Models
// ==========================================

export interface Profile {
  id: string;
  userId: string;
  fullName: string | null;
  role: UserRole;
  plan: PlanType;
  onboardingCompleted: boolean;
  trialStartedAt: Date | string;
  trialEndsAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Balance {
  id: string;
  userId: string;
  name: string;
  type: string; // bank, ewallet, cash
  currentBalance: number;
  archivedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  createdAt: Date | string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string | null;
  walletId: string | null;
  transferToWalletId?: string | null;
  type: TransactionType;
  amount: number;
  note: string | null;
  rawInput: string | null;
  tags: string[];
  receiptMerchant: string | null;
  receiptItems: unknown | null;
  receiptDate: Date | string | null;
  transactionDate: Date | string;
  deletedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined relations (optional, for display)
  category?: Category | null;
  wallet?: Balance | null;
  transferToWallet?: Balance | null;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined relation
  category?: Category | null;
}

export interface SavingGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  name: string;
  amount: number;
  url: string | null;
  status: 'locked' | 'ready' | 'bought' | string;
  unlockDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Debt {
  id: string;
  userId: string;
  type: DebtType;
  person: string;
  amount: number;
  isSettled: boolean;
  tenorMonths: number | null;
  monthsPaid: number;
  interestRate: number | null;
  note: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Paylater {
  id: string;
  userId: string;
  itemName: string;
  platform: string;
  totalAmount: number;
  installmentAmount: number;
  tenorMonths: number;
  monthsPaid: number;
  isSettled: boolean;
  dueDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AppSubscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  billingDay: number;
  method: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EmergencyFundPlan {
  id: string;
  userId: string;
  monthlyExpense: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TransactionTemplate {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryName: string;
  walletName: string;
  note: string | null;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryName: string;
  walletName: string;
  note: string | null;
  tags: string[];
  interval: string;
  dayOfMonth: number;
  nextRunAt: Date | string;
  lastRunAt: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  channel: string;
  dueAt: Date | string | null;
  completedAt: Date | string | null;
  emailSentAt: Date | string | null;
  emailLastError: string | null;
  emailAttemptCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  unlockedAt: Date | string;
}

// ==========================================
// SaaS Models
// ==========================================

export interface BillingSubscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: string; // trial, active, expired, cancelled
  startedAt: Date | string;
  expiredAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  billingType: string | null; // monthly, yearly
  durationDays: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  plan: PlanType;
  billingType: string; // monthly, yearly
  amount: number;
  paymentMethod: string; // bni, bca, qris
  proofPath: string;
  status: PaymentStatus;
  adminNote: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Feedback {
  id: string;
  userId: string;
  rating: number;
  message: string;
  status: string; // open, reviewed, closed
  createdAt: Date | string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: Date | string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: Date | string;
}

// ==========================================
// Parser Types
// ==========================================

export interface ParseResult {
  isBalanceUpdate: boolean;
  type?: TransactionType;
  category?: string;
  amount: number;
  method: string;
  transferToMethod?: string | null;
  note?: string;
  tags?: string[];
  rawInput: string;
  transactionDate?: Date | string;
}

// ==========================================
// Dashboard Props
// ==========================================

export interface AppUser {
  id: string;
  email: string;
  plan: PlanType;
  fullName: string;
  trialEndsAt: string | null;
}

import 'server-only';

import { PaymentStatus, PlanType, type PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import { syncAchievements } from '../achievements';
import { DEFAULT_MONTHLY_PRICE, DEFAULT_PRICING, DEFAULT_TRIAL_DAYS, DEFAULT_YEARLY_PRICE } from '../constants';
import { tagsFromJson } from '../tags';

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const ADMIN_PAGE_LIMIT = 200;
const EXPORT_ROW_LIMIT = 5000;
const DASHBOARD_TRANSACTION_LIMIT = 50;

export type PaymentSettings = Awaited<ReturnType<typeof getPaymentSettings>>;
export type PricingPlans = Awaited<ReturnType<typeof getPricingPlans>>;
export type MonthlyReportData = Awaited<ReturnType<typeof getMonthlyReportData>>;
export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

type Db = PrismaClient;

type PricingSource = 'plan' | 'settings' | 'fallback';

const balanceSelect = {
  id: true,
  userId: true,
  name: true,
  type: true,
  currentBalance: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const categorySelect = {
  id: true,
  userId: true,
  name: true,
  type: true,
  createdAt: true,
} as const;

const transactionListSelect = {
  id: true,
  userId: true,
  categoryId: true,
  walletId: true,
  transferToWalletId: true,
  type: true,
  amount: true,
  note: true,
  rawInput: true,
  tags: true,
  receiptMerchant: true,
  receiptItems: true,
  receiptDate: true,
  transactionDate: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: categorySelect },
  wallet: { select: balanceSelect },
  transferToWallet: { select: balanceSelect },
} as const;

export interface PricingPlanView {
  id: string;
  name: string;
  type: 'trial' | 'pro';
  price: number;
  billingType: string | null;
  durationDays: number | null;
  isActive: boolean;
  source: PricingSource;
}

function getMonthRange(month: number, year: number) {
  const safeMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
  const safeYear = Number.isInteger(year) && year >= 1970 && year <= 9999 ? year : new Date().getFullYear();
  const periodStart = new Date(safeYear, safeMonth - 1, 1);
  const periodEnd = new Date(safeYear, safeMonth, 0, 23, 59, 59, 999);

  return {
    month: safeMonth,
    year: safeYear,
    periodStart,
    periodEnd,
    monthName: `${INDONESIAN_MONTHS[safeMonth - 1]} ${safeYear}`,
    periodLabel: `1 - ${periodEnd.getDate()} ${INDONESIAN_MONTHS[safeMonth - 1]} ${safeYear}`,
  };
}

function formatGeneratedDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())} WIB`;
}

function calculateFinancialHealthScore(input: {
  totalIncome: number;
  totalExpense: number;
  activeWalletBalance: number;
  savingGoalCount: number;
  debtAmount: number;
}) {
  let score = 50;
  if (input.totalIncome > 0) {
    const savingsRate = (input.totalIncome - input.totalExpense) / input.totalIncome;
    score += Math.max(-25, Math.min(25, savingsRate * 50));
  }
  if (input.activeWalletBalance > 0) score += 10;
  if (input.savingGoalCount > 0) score += 10;
  if (input.debtAmount > input.activeWalletBalance) score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeTransactionTags<T extends { tags: unknown }>(transaction: T): Omit<T, 'tags'> & { tags: string[] } {
  return {
    ...transaction,
    tags: tagsFromJson(transaction.tags),
  };
}

function normalizeTemplateTags<T extends { tags: unknown }>(template: T): Omit<T, 'tags'> & { tags: string[] } {
  return {
    ...template,
    tags: tagsFromJson(template.tags),
  };
}

export async function getUserProfile(userId: string, db: Db = prisma) {
  return db.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      fullName: true,
      role: true,
      plan: true,
      onboardingCompleted: true,
      trialStartedAt: true,
      trialEndsAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getTrialDays(db: Db = prisma) {
  const [plan, setting] = await Promise.all([
    db.plan.findFirst({ where: { type: 'trial', isActive: true } }),
    db.setting.findUnique({ where: { key: 'trial_days' } }),
  ]);
  if (plan?.durationDays && plan.durationDays > 0) return plan.durationDays;
  const parsed = Number.parseInt(setting?.value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TRIAL_DAYS;
}

export async function getDashboardData(userId: string, db: Db = prisma) {
  const profile = await getUserProfile(userId, db);
  if (!profile) {
    throw new Error('Profil tidak ditemukan.');
  }

  const [
    transactions,
    balances,
    categories,
    savingGoals,
    debts,
    wishlist,
    paylaters,
    budgets,
    subscriptions,
    emergencyFundPlan,
    templates,
    recurringTransactions,
    reminders,
  ] = await Promise.all([
    db.transaction.findMany({
      where: { userId, deletedAt: null },
      select: transactionListSelect,
      orderBy: { transactionDate: 'desc' },
      take: DASHBOARD_TRANSACTION_LIMIT,
    }),
    db.balance.findMany({
      where: { userId },
      select: balanceSelect,
      orderBy: [
        { archivedAt: 'asc' },
        { updatedAt: 'desc' },
      ],
    }),
    db.category.findMany({ where: { userId }, select: categorySelect, orderBy: { name: 'asc' } }),
    db.savingGoal.findMany({ where: { userId } }),
    db.debt.findMany({ where: { userId } }),
    db.wishlistItem.findMany({ where: { userId } }),
    db.paylater.findMany({ where: { userId } }),
    db.budget.findMany({ where: { userId }, include: { category: { select: categorySelect } } }),
    db.appSubscription.findMany({ where: { userId } }),
    db.emergencyFundPlan.findUnique({ where: { userId } }),
    db.transactionTemplate.findMany({
      where: { userId },
      orderBy: [
        { isFavorite: 'desc' },
        { lastUsedAt: 'desc' },
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    }),
    db.recurringTransaction.findMany({
      where: { userId },
      orderBy: [
        { isActive: 'desc' },
        { nextRunAt: 'asc' },
      ],
    }),
    db.reminder.findMany({
      where: { userId },
      orderBy: [
        { completedAt: 'asc' },
        { dueAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    }),
  ]);

  const achievements = await syncAchievements(db, userId);

  return {
    transactions: transactions.map(normalizeTransactionTags),
    balances,
    categories,
    savingGoals,
    debts,
    wishlist,
    paylaters,
    budgets,
    subscriptions,
    emergencyFundPlan,
    templates: templates.map(normalizeTemplateTags),
    recurringTransactions: recurringTransactions.map(normalizeTemplateTags),
    reminders,
    achievements,
    profile: {
      role: profile.role,
      plan: profile.plan,
      trialEndsAt: profile.trialEndsAt.toISOString(),
      onboardingCompleted: profile.onboardingCompleted,
      fullName: profile.fullName,
    },
    dataError: null as string | null,
  };
}

export async function getMonthlyReportData(userId: string, month: number, year: number, db: Db = prisma) {
  const range = getMonthRange(month, year);
  const generatedAt = new Date();

  const [
    profile,
    transactions,
    wallets,
    savingGoals,
    debts,
    streak,
    achievements,
  ] = await Promise.all([
    getUserProfile(userId, db),
    db.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: {
          gte: range.periodStart,
          lte: range.periodEnd,
        },
      },
      include: { category: true, wallet: true, transferToWallet: true },
      orderBy: { transactionDate: 'desc' },
      take: EXPORT_ROW_LIMIT,
    }),
    db.balance.findMany({ where: { userId, archivedAt: null }, orderBy: { name: 'asc' } }),
    db.savingGoal.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
    db.debt.findMany({ where: { userId, isSettled: false } }),
    db.streak.findUnique({ where: { userId } }),
    db.achievement.findMany({
      where: {
        userId,
        unlockedAt: {
          gte: range.periodStart,
          lte: range.periodEnd,
        },
      },
      orderBy: { unlockedAt: 'desc' },
    }),
  ]);

  if (!profile) {
    throw new Error('Profil tidak ditemukan.');
  }

  const normalizedTransactions = transactions.map(normalizeTransactionTags);
  const totalTransactions = normalizedTransactions.length;
  const totalIncome = normalizedTransactions.filter((t) => t.type === 'masuk').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = normalizedTransactions.filter((t) => t.type === 'keluar').reduce((sum, t) => sum + t.amount, 0);
  const transferVolume = normalizedTransactions.filter((t) => t.type === 'transfer').reduce((sum, t) => sum + t.amount, 0);
  const cashflow = totalIncome - totalExpense;
  const activeWalletBalance = wallets.reduce((sum, wallet) => sum + wallet.currentBalance, 0);

  const expenseByCategory = new Map<string, number>();
  for (const transaction of normalizedTransactions) {
    if (transaction.type !== 'keluar') continue;
    const name = transaction.category?.name || null;
    if (!name) continue;
    expenseByCategory.set(name, (expenseByCategory.get(name) || 0) + transaction.amount);
  }
  const largestExpense = Array.from(expenseByCategory.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)[0] || null;
  const largestExpenseAmount = largestExpense?.amount || 0;
  const recentTransactions = normalizedTransactions.slice(0, 20).map((transaction) => ({
    id: transaction.id,
    transactionDate: transaction.transactionDate,
    type: transaction.type,
    amount: transaction.amount,
    note: transaction.note,
    category: transaction.category ? { name: transaction.category.name } : null,
    wallet: transaction.wallet ? { name: transaction.wallet.name } : null,
    transferToWallet: transaction.transferToWallet ? { name: transaction.transferToWallet.name } : null,
  }));

  return {
    userFullName: profile.fullName,
    userPlan: profile.plan,
    month: range.month,
    year: range.year,
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
    generatedAt,
    monthName: range.monthName,
    periodLabel: range.periodLabel,
    generatedDateLabel: formatGeneratedDate(generatedAt),
    totalTransactions,
    totalIncome,
    totalExpense,
    transferVolume,
    cashflow,
    activeWalletBalance,
    largestExpenseCategory: largestExpense?.name || null,
    largestExpenseAmount,
    largestExpensePercentage: totalExpense > 0 ? Math.round((largestExpenseAmount / totalExpense) * 100) : 0,
    recentTransactions,
    savingGoals: savingGoals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
    })),
    financialHealthScore: calculateFinancialHealthScore({
      totalIncome,
      totalExpense,
      activeWalletBalance,
      savingGoalCount: savingGoals.length,
      debtAmount: debts.reduce((sum, debt) => sum + debt.amount, 0),
    }),
    streak: {
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      lastInputDate: streak?.lastInputDate || null,
    },
    achievements: achievements.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      unlockedAt: achievement.unlockedAt,
    })),
    topCategoryName: largestExpense?.name || '',
    topCategoryAmount: largestExpenseAmount,
    topCategoryPercent: totalExpense > 0 ? Math.round((largestExpenseAmount / totalExpense) * 100) : 0,
    transactions: recentTransactions,
  };
}

export async function getAdminStats(db: Db = prisma) {
  const [
    paymentRequests,
    feedbacks,
    listedUsers,
    auditLogs,
    totalUsers,
    proUsers,
    trialUsers,
    adminUsers,
    totalTransactions,
    totalBalances,
    totalBudgets,
    totalSavingGoals,
    totalDebts,
    totalPaylaters,
    totalSubscriptions,
    approvedPaymentStats,
    pendingPayments,
    rejectedPayments,
  ] = await Promise.all([
    db.paymentRequest.findMany({ orderBy: { createdAt: 'desc' }, take: ADMIN_PAGE_LIMIT }),
    db.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: ADMIN_PAGE_LIMIT }),
    db.profile.findMany({ orderBy: { createdAt: 'desc' }, take: ADMIN_PAGE_LIMIT }),
    db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    db.profile.count(),
    db.profile.count({ where: { plan: PlanType.pro } }),
    db.profile.count({ where: { plan: PlanType.trial } }),
    db.profile.count({ where: { role: 'admin' } }),
    db.transaction.count({ where: { deletedAt: null } }),
    db.balance.count(),
    db.budget.count(),
    db.savingGoal.count(),
    db.debt.count(),
    db.paylater.count(),
    db.appSubscription.count(),
    db.paymentRequest.aggregate({ where: { status: PaymentStatus.approved }, _sum: { amount: true }, _count: true }),
    db.paymentRequest.count({ where: { status: PaymentStatus.pending } }),
    db.paymentRequest.count({ where: { status: PaymentStatus.rejected } }),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await db.profile.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
    take: 1000,
  });

  const userGrowthMap: Record<string, number> = {};
  recentUsers.forEach((user) => {
    const dateKey = user.createdAt.toISOString().split('T')[0];
    userGrowthMap[dateKey] = (userGrowthMap[dateKey] || 0) + 1;
  });

  return {
    paymentRequests,
    feedbacks,
    listedUsers,
    auditLogs,
    platformStats: {
      totalUsers,
      proUsers,
      trialUsers,
      adminUsers,
      totalTransactions,
      totalBalances,
      totalBudgets,
      totalSavingGoals,
      totalDebts,
      totalPaylaters,
      totalSubscriptions,
      totalRevenue: approvedPaymentStats._sum.amount || 0,
      pendingPayments,
      approvedPayments: approvedPaymentStats._count,
      rejectedPayments,
      userGrowth: Object.entries(userGrowthMap).map(([date, count]) => ({ date, count })),
    },
  };
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toPricingPlanView(
  plan: {
    id: string;
    name: string;
    type: string;
    price: number;
    billingType: string | null;
    durationDays: number | null;
    isActive: boolean;
  },
  source: PricingSource,
): PricingPlanView {
  return {
    id: plan.id,
    name: plan.name,
    type: plan.type === 'trial' ? 'trial' : 'pro',
    price: plan.price,
    billingType: plan.billingType,
    durationDays: plan.durationDays,
    isActive: plan.isActive,
    source,
  };
}

export async function getPricingPlans(db: Db = prisma) {
  const [plans, settings] = await Promise.all([
    db.plan.findMany({
      orderBy: [{ billingType: 'asc' }, { price: 'asc' }],
    }),
    db.setting.findMany({
      where: { key: { in: ['trial_days', 'monthly_price', 'yearly_price'] } },
    }),
  ]);
  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));

  const trialPlan = plans.find((plan) => plan.type === 'trial');
  const monthlyPlan = plans.find((plan) => plan.type !== 'trial' && plan.billingType === 'monthly');
  const yearlyPlan = plans.find((plan) => plan.type !== 'trial' && plan.billingType === 'yearly');

  const trialDays = parsePositiveInt(settingsMap.get('trial_days'), DEFAULT_TRIAL_DAYS);
  const monthlyPrice = parsePositiveNumber(settingsMap.get('monthly_price'), DEFAULT_MONTHLY_PRICE);
  const yearlyPrice = parsePositiveNumber(settingsMap.get('yearly_price'), DEFAULT_YEARLY_PRICE);

  const trial = trialPlan
    ? trialPlan.isActive
      ? toPricingPlanView(trialPlan, 'plan')
      : null
    : toPricingPlanView({
      id: settingsMap.has('trial_days') ? 'settings-trial-plan' : 'fallback-trial-plan',
      name: DEFAULT_PRICING.trial.name,
      type: DEFAULT_PRICING.trial.type,
      price: DEFAULT_PRICING.trial.price,
      billingType: null,
      durationDays: trialDays,
      isActive: true,
    }, settingsMap.has('trial_days') ? 'settings' : 'fallback');

  const monthly = monthlyPlan
    ? monthlyPlan.isActive
      ? toPricingPlanView(monthlyPlan, 'plan')
      : null
    : toPricingPlanView({
      id: settingsMap.has('monthly_price') ? 'settings-pro-monthly' : 'fallback-pro-monthly',
      name: DEFAULT_PRICING.monthly.name,
      type: DEFAULT_PRICING.monthly.type,
      price: monthlyPrice,
      billingType: DEFAULT_PRICING.monthly.billingType,
      durationDays: null,
      isActive: true,
    }, settingsMap.has('monthly_price') ? 'settings' : 'fallback');

  const yearly = yearlyPlan
    ? yearlyPlan.isActive
      ? toPricingPlanView(yearlyPlan, 'plan')
      : null
    : toPricingPlanView({
      id: settingsMap.has('yearly_price') ? 'settings-pro-yearly' : 'fallback-pro-yearly',
      name: DEFAULT_PRICING.yearly.name,
      type: DEFAULT_PRICING.yearly.type,
      price: yearlyPrice,
      billingType: DEFAULT_PRICING.yearly.billingType,
      durationDays: null,
      isActive: true,
    }, settingsMap.has('yearly_price') ? 'settings' : 'fallback');

  const all = [trial, monthly, yearly].filter((plan): plan is PricingPlanView => Boolean(plan));

  return {
    trial,
    monthly,
    yearly,
    all,
  };
}

export async function getPaymentSettings(db: Db = prisma) {
  const settings = await db.setting.findMany();
  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const bcaNumber = settingsMap.get('bca_number') || '';
  const bcaHolder = settingsMap.get('bca_holder') || '';
  const bniNumber = settingsMap.get('bni_number') || '';
  const bniHolder = settingsMap.get('bni_holder') || '';
  const qrisImage = settingsMap.get('qris_image') || '';

  return {
    bca_number: bcaNumber,
    bca_holder: bcaHolder,
    bca_active: bcaNumber && bcaHolder ? settingsMap.get('bca_active') || 'true' : 'false',
    bni_number: bniNumber,
    bni_holder: bniHolder,
    bni_active: bniNumber && bniHolder ? settingsMap.get('bni_active') || 'true' : 'false',
    qris_image: qrisImage,
    qris_active: qrisImage ? settingsMap.get('qris_active') || 'true' : 'false',
  };
}

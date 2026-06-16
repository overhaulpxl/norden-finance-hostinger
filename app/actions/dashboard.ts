'use server';

import { getCurrentUser } from '../../lib/auth';
import { getDashboardData as loadDashboardData, getUserProfile } from '../../lib/data/loaders';

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Anda harus login terlebih dahulu.');
  }

  try {
    return await loadDashboardData(user.uid);
  } catch (error) {
    console.error('Dashboard data unavailable:', error);
    const fallbackProfile = await getUserProfile(user.uid).catch(() => null);
    return {
      transactions: [],
      balances: [],
      categories: [],
      savingGoals: [],
      debts: [],
      wishlist: [],
      paylaters: [],
      budgets: [],
      subscriptions: [],
      emergencyFundPlan: null,
      templates: [],
      recurringTransactions: [],
      reminders: [],
      achievements: [],
      profile: {
        role: fallbackProfile?.role || 'user',
        plan: fallbackProfile?.plan || 'trial',
        trialEndsAt: fallbackProfile?.trialEndsAt.toISOString() || '',
        onboardingCompleted: fallbackProfile?.onboardingCompleted ?? true,
        fullName: fallbackProfile?.fullName || null,
      },
      dataError: 'Data dashboard sedang tidak lengkap karena database tidak dapat dibaca.',
    };
  }
}

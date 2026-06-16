import { getDashboardData } from '../actions';
import { getCurrentUser } from '../../lib/auth';
import { redirect } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { getPricingPlans, getTrialDays } from '../../lib/data/loaders';
import { DEFAULT_MONTHLY_PRICE, DEFAULT_TRIAL_DAYS, DEFAULT_YEARLY_PRICE } from '../../lib/constants';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  let data: Awaited<ReturnType<typeof getDashboardData>>;

  try {
    data = await getDashboardData();
  } catch (error) {
    console.error('Dashboard unavailable:', error);
    data = {
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
        role: 'user',
        plan: 'trial',
        trialEndsAt: '',
        onboardingCompleted: true,
        fullName: null,
      },
      dataError: 'Dashboard sedang tidak tersedia. Coba muat ulang beberapa saat lagi.',
    };
  }

  if (!data.profile.onboardingCompleted) {
    redirect('/onboarding');
  }

  const [trialDays, pricingPlans] = await Promise.all([
    getTrialDays().catch((error) => {
      console.error('Trial days unavailable:', error);
      return DEFAULT_TRIAL_DAYS;
    }),
    getPricingPlans().catch((error) => {
      console.error('Pricing plans unavailable:', error);
      return {
        trial: null,
        monthly: { name: 'Pro Monthly', price: DEFAULT_MONTHLY_PRICE },
        yearly: { name: 'Pro Yearly', price: DEFAULT_YEARLY_PRICE },
        all: [],
      };
    }),
  ]);
  const clientPricingPlans = {
    monthly: pricingPlans.monthly ? { name: pricingPlans.monthly.name, price: pricingPlans.monthly.price } : null,
    yearly: pricingPlans.yearly ? { name: pricingPlans.yearly.name, price: pricingPlans.yearly.price } : null,
  };

  const appUser = {
    id: user.uid,
    email: user.email || '',
    plan: data.profile.plan as 'trial' | 'pro',
    fullName: data.profile.fullName || undefined,
    trialEndsAt: data.profile.trialEndsAt || null,
    role: data.profile.role,
  };

  return (
    <AppLayout
      user={appUser}
      transactions={data.transactions}
      balances={data.balances}
      savingGoals={data.savingGoals}
      debts={data.debts}
      wishlist={data.wishlist}
      paylaters={data.paylaters}
      budgets={data.budgets}
      subscriptions={data.subscriptions}
      emergencyFundPlan={data.emergencyFundPlan}
      templates={data.templates}
      recurringTransactions={data.recurringTransactions}
      reminders={data.reminders}
      achievements={data.achievements}
      trialDays={trialDays}
      pricingPlans={clientPricingPlans}
      dataError={data.dataError}
    />
  );
}

import type { PrismaClient } from '@prisma/client';

type Db = PrismaClient;

type AchievementDefinition = {
  title: string;
  description: string;
  complete: boolean;
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function bestTransactionStreak(dates: Date[]) {
  const days = Array.from(new Set(dates.map(dayKey))).sort();
  if (days.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    const current = new Date(`${days[index]}T12:00:00`);
    const previous = new Date(`${days[index - 1]}T12:00:00`);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / 86_400_000);
    if (diffDays === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export async function syncAchievements(prisma: Db, userId: string) {
  const [
    transactions,
    balances,
    goals,
    emergencyFundPlan,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      select: { transactionDate: true },
      orderBy: { transactionDate: 'asc' },
      take: 1000,
    }),
    prisma.balance.findMany({
      where: { userId, archivedAt: null },
      select: { currentBalance: true },
    }),
    prisma.savingGoal.findMany({
      where: { userId },
      select: { targetAmount: true, currentAmount: true },
    }),
    prisma.emergencyFundPlan.findUnique({
      where: { userId },
      select: { monthlyExpense: true },
    }),
  ]);

  const transactionCount = transactions.length;
  const bestStreak = bestTransactionStreak(transactions.map((transaction) => transaction.transactionDate));
  const totalBalance = balances.reduce((sum, balance) => sum + balance.currentBalance, 0);
  const emergencyMonths = emergencyFundPlan?.monthlyExpense
    ? totalBalance / emergencyFundPlan.monthlyExpense
    : 0;

  const definitions: AchievementDefinition[] = [
    {
      title: 'First Transaction',
      description: 'Recorded the first transaction.',
      complete: transactionCount >= 1,
    },
    {
      title: '100 Transactions',
      description: 'Recorded 100 transactions.',
      complete: transactionCount >= 100,
    },
    {
      title: '7 Day Streak',
      description: 'Recorded transactions across a 7 day streak.',
      complete: bestStreak >= 7,
    },
    {
      title: '30 Day Streak',
      description: 'Recorded transactions across a 30 day streak.',
      complete: bestStreak >= 30,
    },
    {
      title: 'Million Balance',
      description: 'Reached Rp1.000.000 active wallet balance.',
      complete: totalBalance >= 1_000_000,
    },
    {
      title: 'Saving Goal Reached',
      description: 'Completed at least one saving goal.',
      complete: goals.some((goal) => goal.currentAmount >= goal.targetAmount),
    },
    {
      title: 'Emergency Fund 3 Months',
      description: 'Built an emergency fund covering 3 months.',
      complete: emergencyMonths >= 3,
    },
  ];

  for (const achievement of definitions.filter((item) => item.complete)) {
    await prisma.achievement.upsert({
      where: { userId_title: { userId, title: achievement.title } },
      update: {},
      create: {
        userId,
        title: achievement.title,
        description: achievement.description,
      },
    });
  }

  return prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
  });
}

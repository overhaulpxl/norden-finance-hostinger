'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { syncAchievements } from '../../lib/achievements';
import { formatCurrency } from '../../lib/format';

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(left: Date, right: Date) {
  return Math.round((startOfDay(left).getTime() - startOfDay(right).getTime()) / 86_400_000);
}

function calculateStreaks(transactions: { transactionDate: Date | string }[], referenceDate: Date) {
  const days = Array.from(new Set(transactions.map((transaction) => dayKey(new Date(transaction.transactionDate)))))
    .sort()
    .map((key) => new Date(`${key}T12:00:00`));

  if (days.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    const current = new Date(`${dayKey(days[index])}T12:00:00`);
    const previous = new Date(`${dayKey(days[index - 1])}T12:00:00`);
    const diff = Math.round((current.getTime() - previous.getTime()) / 86_400_000);
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  const today = startOfDay(referenceDate);
  const daySet = new Set(days.map(dayKey));
  const latest = days[days.length - 1];
  const latestGap = latest ? daysBetween(today, latest) : 999;
  let current = 0;

  if (latestGap <= 1 && latest) {
    const cursor = new Date(latest);
    while (daySet.has(dayKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return { current, best };
}

export async function syncNotifications(userId: string) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Fetch profile, transactions, budgets, goals, paylaters, debts, subscriptions, payments
  const [
    profile,
    transactions,
    budgets,
    goals,
    paylaters,
    debts,
    subscriptions,
    paymentRequests,
    achievements,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      include: { category: true },
      orderBy: { transactionDate: 'desc' },
    }),
    prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    }),
    prisma.savingGoal.findMany({ where: { userId } }),
    prisma.paylater.findMany({ where: { userId, isSettled: false } }),
    prisma.debt.findMany({ where: { userId, isSettled: false } }),
    prisma.appSubscription.findMany({ where: { userId, isActive: true } }),
    prisma.paymentRequest.findMany({ where: { userId } }),
    syncAchievements(prisma, userId),
  ]);

  if (!profile) return;

  const createNotificationIfUnique = async (title: string, body: string, type: string) => {
    const existing = await prisma.notification.findFirst({
      where: { userId, title, body, type },
    });
    if (!existing) {
      await prisma.notification.create({
        data: { userId, title, body, type, isRead: false },
      });
    }
  };

  // 1. Trial Status Notifications
  if (profile.plan === 'trial') {
    const daysLeft = Math.ceil((new Date(profile.trialEndsAt).getTime() - now.getTime()) / 86_400_000);
    if (daysLeft <= 0) {
      await createNotificationIfUnique(
        'Trial berakhir',
        'Trial gratis Anda sudah berakhir. Upgrade sekarang agar fitur premium tetap aktif.',
        'TRIAL_WARNING'
      );
    } else if (daysLeft <= 3) {
      await createNotificationIfUnique(
        'Trial akan berakhir',
        `Trial Anda akan berakhir dalam ${daysLeft} hari. Upgrade ke Pro sekarang.`,
        'TRIAL_WARNING'
      );
    } else if (daysLeft <= 7) {
      await createNotificationIfUnique(
        'Trial akan berakhir',
        `Trial Anda akan berakhir dalam ${daysLeft} hari. Nikmati terus fitur premium Norden.`,
        'TRIAL_WARNING'
      );
    }
  }

  // 2. Budget Alerts
  for (const budget of budgets) {
    const spent = transactions
      .filter((tx) => {
        const d = new Date(tx.transactionDate);
        return (
          tx.type === 'keluar' &&
          tx.categoryId === budget.categoryId &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const ratio = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
    if (ratio >= 0.9) {
      await createNotificationIfUnique(
        'Budget hampir habis',
        `Budget ${budget.category.name} sudah terpakai ${Math.round(ratio * 100)}% bulan ini.`,
        'BUDGET_ALERT'
      );
    } else if (ratio >= 0.75) {
      await createNotificationIfUnique(
        'Budget terpakai 75%',
        `Budget ${budget.category.name} sudah terpakai ${Math.round(ratio * 100)}% bulan ini.`,
        'BUDGET_ALERT'
      );
    } else if (ratio >= 0.5) {
      await createNotificationIfUnique(
        'Budget terpakai 50%',
        `Budget ${budget.category.name} sudah terpakai ${Math.round(ratio * 100)}% bulan ini.`,
        'BUDGET_ALERT'
      );
    }
  }

  // 3. Saving Goals
  for (const goal of goals) {
    if (goal.currentAmount >= goal.targetAmount) {
      await createNotificationIfUnique(
        'Target tabungan tercapai',
        `🎉 Selamat! Target "${goal.title}" berhasil dicapai.`,
        'GOAL_REACHED'
      );
    }
  }

  // 4. Paylaters
  for (const paylater of paylaters) {
    if (paylater.dueDate) {
      const dueIn = Math.ceil((new Date(paylater.dueDate).getTime() - now.getTime()) / 86_400_000);
      if (dueIn >= 0 && dueIn <= 3) {
        await createNotificationIfUnique(
          'Jatuh tempo paylater',
          `Cicilan ${paylater.itemName} di ${paylater.platform} jatuh tempo dalam ${dueIn === 0 ? 'hari ini' : `${dueIn} hari`}.`,
          'PAYLATER_DUE'
        );
      }
    }
  }

  // 5. Debts
  for (const debt of debts) {
    const daysSinceCreation = Math.ceil((now.getTime() - new Date(debt.createdAt).getTime()) / 86_400_000);
    if (daysSinceCreation > 0 && daysSinceCreation % 30 === 0) {
      await createNotificationIfUnique(
        'Jatuh tempo utang',
        `Utang/Piutang dengan ${debt.person} sebesar ${formatCurrency(debt.amount)} belum dilunasi.`,
        'DEBT_DUE'
      );
    }
  }

  // 6. Subscriptions
  for (const sub of subscriptions) {
    const targetDate = new Date(currentYear, currentMonth, Math.min(sub.billingDay, 31));
    if (targetDate < startOfDay(now)) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    const dueIn = daysBetween(targetDate, now);
    if (dueIn >= 0 && dueIn <= 3) {
      await createNotificationIfUnique(
        'Jatuh tempo subscription',
        `Tagihan ${sub.name} sebesar ${formatCurrency(sub.amount)} jatuh tempo dalam ${dueIn === 0 ? 'hari ini' : `${dueIn} hari`}.`,
        'SUBSCRIPTION_DUE'
      );
    }
  }

  // 7. Payment Requests status approved/rejected
  for (const req of paymentRequests) {
    if (req.status === 'approved') {
      await createNotificationIfUnique(
        'Payment approved',
        `Pembayaran upgrade Norden Pro sebesar ${formatCurrency(req.amount)} telah disetujui!`,
        'PAYMENT_APPROVED'
      );
    } else if (req.status === 'rejected') {
      await createNotificationIfUnique(
        'Payment rejected',
        `Pembayaran upgrade Norden Pro ditolak. Catatan: ${req.adminNote || 'Silakan unggah ulang bukti yang benar.'}`,
        'PAYMENT_REJECTED'
      );
    }
  }

  // 8. Achievements
  for (const ach of achievements) {
    await createNotificationIfUnique(
      'Achievement unlocked',
      `🏆 Selamat! Anda membuka pencapaian "${ach.title}": ${ach.description}`,
      'ACHIEVEMENT'
    );
  }

  // 9. Streak Milestones
  const streaks = calculateStreaks(transactions, now);
  if (streaks.current >= 3) {
    await createNotificationIfUnique(
      'Streak milestone',
      `🔥 Keren! Anda mempertahankan streak mencatat keuangan selama ${streaks.current} hari berturut-turut.`,
      'STREAK'
    );
  }
}

export async function getNotifications() {
  const { user } = await requireUser(false);
  const userId = user.uid;

  await syncNotifications(userId);

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function markNotificationAsRead(id: string) {
  const { user } = await requireUser(false);
  const userId = user.uid;

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const { user } = await requireUser(false);
  const userId = user.uid;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function clearAllNotifications() {
  const { user } = await requireUser(false);
  const userId = user.uid;

  await prisma.notification.deleteMany({
    where: { userId },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function addCustomNotification(title: string, body: string, type: string) {
  const { user } = await requireUser(false);
  const userId = user.uid;

  await prisma.notification.create({
    data: { userId, title, body, type, isRead: false },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

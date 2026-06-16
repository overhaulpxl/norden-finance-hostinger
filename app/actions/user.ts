'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { buildShortcutEndpoint, getShortcutEndpointForUser, signShortcutToken } from '../../lib/shortcutToken';

export async function completeOnboarding(data: {
  fullName: string;
  walletName: string;
  openingBalance: number;
}) {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;
    const walletName = data.walletName.trim().toUpperCase();

    if (!data.fullName.trim()) throw new Error('Nama wajib diisi');
    if (!walletName) throw new Error('Nama wallet wajib diisi');
    if (!Number.isFinite(data.openingBalance) || data.openingBalance < 0) {
      throw new Error('Saldo awal tidak valid');
    }

    await prisma.$transaction([
      prisma.profile.update({
        where: { userId },
        data: {
          fullName: data.fullName.trim(),
          onboardingCompleted: true,
        },
      }),
      prisma.balance.upsert({
        where: { userId_name: { userId, name: walletName } },
        update: { currentBalance: data.openingBalance },
        create: {
          userId,
          name: walletName,
          type: walletName === 'CASH' ? 'cash' : 'bank',
          currentBalance: data.openingBalance,
        },
      }),
    ]);

    revalidatePath('/dashboard');
    revalidatePath('/onboarding');

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyelesaikan onboarding';
    return { success: false, error: message };
  }
}

export async function deleteUserAccountData() {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;

    // Delete everything in a secure transaction
    await prisma.$transaction(async (tx) => {
      // Delete child models referencing Category / Balance first
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      await tx.balance.deleteMany({ where: { userId } });
      
      // Delete other client models
      await tx.savingGoal.deleteMany({ where: { userId } });
      await tx.wishlistItem.deleteMany({ where: { userId } });
      await tx.debt.deleteMany({ where: { userId } });
      await tx.paylater.deleteMany({ where: { userId } });
      await tx.appSubscription.deleteMany({ where: { userId } });
      await tx.emergencyFundPlan.deleteMany({ where: { userId } });
      await tx.transactionTemplate.deleteMany({ where: { userId } });
      await tx.recurringTransaction.deleteMany({ where: { userId } });
      await tx.reminder.deleteMany({ where: { userId } });
      await tx.streak.deleteMany({ where: { userId } });
      await tx.achievement.deleteMany({ where: { userId } });
      await tx.paymentRequest.deleteMany({ where: { userId } });
      await tx.billingSubscription.deleteMany({ where: { userId } });
      await tx.feedback.deleteMany({ where: { userId } });
      await tx.auditLog.deleteMany({ where: { userId } });
      
      // Finally delete user profile
      await tx.profile.deleteMany({ where: { userId } });
    });

    // Clear session cookie on server
    const cookieStore = await cookies();
    cookieStore.set('__session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus data akun';
    return { success: false, error: message };
  }
}

export async function submitFeedback(data: {
  rating: number;
  message: string;
}) {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;

    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      throw new Error('Rating harus bernilai 1 sampai 5');
    }
    if (!data.message || !data.message.trim()) {
      throw new Error('Pesan ulasan wajib diisi');
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        rating: data.rating,
        message: data.message.trim(),
        status: 'open',
      },
    });

    return { success: true, data: { id: feedback.id } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirimkan ulasan';
    return { success: false, error: message };
  }
}

export async function getShortcutEndpoint() {
  try {
    const { user } = await requireUser(false);
    const endpoint = await getShortcutEndpointForUser(user.uid);

    return { success: true, endpoint };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat endpoint shortcut';
    return { success: false, error: message };
  }
}

export async function regenerateShortcutToken() {
  try {
    const { user } = await requireUser(false);
    const profile = await prisma.profile.update({
      where: { userId: user.uid },
      data: { shortcutTokenVersion: { increment: 1 } },
      select: { shortcutTokenVersion: true },
    });
    const token = signShortcutToken(user.uid, profile.shortcutTokenVersion);

    return { success: true, endpoint: buildShortcutEndpoint(token) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal reset token shortcut';
    return { success: false, error: message };
  }
}

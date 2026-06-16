'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { MIN_EMERGENCY_MONTHLY_EXPENSE } from '../../lib/constants';
import { assertPositiveInt } from '../../lib/validators';

export async function updateEmergencyFundPlan(monthlyExpense: number) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertPositiveInt(monthlyExpense, 'Pengeluaran bulanan');
    if (monthlyExpense < MIN_EMERGENCY_MONTHLY_EXPENSE) {
      throw new Error('Masukkan pengeluaran bulanan yang realistis.');
    }
    if (monthlyExpense > 1_000_000_000) {
      throw new Error('Pengeluaran bulanan terlalu besar');
    }

    const plan = await prisma.emergencyFundPlan.upsert({
      where: { userId },
      update: { monthlyExpense },
      create: { userId, monthlyExpense },
    });

    await createAuditLog(userId, 'UPDATE_EMERGENCY_FUND_PLAN', 'emergencyFundPlan', plan.id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan dana darurat';
    return { success: false, error: message };
  }
}

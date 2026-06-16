'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertNonNegativeInt, assertPositiveInt, assertValidDate } from '../../lib/validators';

export async function addSavingGoal(title: string, targetAmount: number, deadline?: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(title, 'Nama goal');
    assertPositiveInt(targetAmount, 'Target');
    assertValidDate(deadline, 'Deadline');

    const goal = await prisma.savingGoal.create({
      data: {
        userId,
        title,
        targetAmount,
        currentAmount: 0,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    await createAuditLog(userId, 'CREATE_SAVING_GOAL', 'savingGoal', goal.id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan saving goal';
    return { success: false, error: message };
  }
}

export async function updateSavingGoal(id: string, data: { title?: string; targetAmount?: number; currentAmount?: number; deadline?: string }) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    if (data.title !== undefined) assertNonEmpty(data.title, 'Nama goal');
    if (data.targetAmount !== undefined) assertPositiveInt(data.targetAmount, 'Target');
    if (data.currentAmount !== undefined) assertNonNegativeInt(data.currentAmount, 'Saldo goal');
    assertValidDate(data.deadline, 'Deadline');

    const existing = await prisma.savingGoal.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Saving goal tidak ditemukan');

    await prisma.savingGoal.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        targetAmount: data.targetAmount ?? existing.targetAmount,
        currentAmount: data.currentAmount ?? existing.currentAmount,
        deadline: data.deadline ? new Date(data.deadline) : existing.deadline,
      },
    });

    await createAuditLog(userId, 'UPDATE_SAVING_GOAL', 'savingGoal', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah saving goal';
    return { success: false, error: message };
  }
}

export async function deleteSavingGoal(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.savingGoal.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Saving goal tidak ditemukan');

    await prisma.savingGoal.delete({ where: { id } });

    await createAuditLog(userId, 'DELETE_SAVING_GOAL', 'savingGoal', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus saving goal';
    return { success: false, error: message };
  }
}

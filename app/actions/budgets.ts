'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertPositiveInt } from '../../lib/validators';

export async function addBudget(categoryInput: string, monthlyLimit: number) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    assertNonEmpty(categoryInput, 'Kategori');
    assertPositiveInt(monthlyLimit, 'Limit bulanan');

    let category = await prisma.category.findFirst({
      where: { id: categoryInput, userId },
    });

    if (!category) {
      const name = categoryInput.charAt(0).toUpperCase() + categoryInput.slice(1).toLowerCase();
      category = await prisma.category.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name, type: 'keluar' },
      });
    }

    const budget = await prisma.budget.upsert({
      where: { userId_categoryId: { userId, categoryId: category.id } },
      update: { monthlyLimit },
      create: { userId, categoryId: category.id, monthlyLimit },
    });

    await createAuditLog(userId, 'CREATE_BUDGET', 'budget', budget.id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan budget';
    return { success: false, error: message };
  }
}

export async function updateBudget(id: string, monthlyLimit: number) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertPositiveInt(monthlyLimit, 'Limit bulanan');

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Budget tidak ditemukan');

    await prisma.budget.update({
      where: { id },
      data: { monthlyLimit },
    });

    await createAuditLog(userId, 'UPDATE_BUDGET', 'budget', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah budget';
    return { success: false, error: message };
  }
}

export async function deleteBudget(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Budget tidak ditemukan');

    await prisma.budget.delete({ where: { id } });

    await createAuditLog(userId, 'DELETE_BUDGET', 'budget', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus budget';
    return { success: false, error: message };
  }
}

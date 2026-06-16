'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertPositiveInt } from '../../lib/validators';

export async function addDebt(data: {
  type: string;
  person: string;
  amount: number;
  tenorMonths?: number;
  interestRate?: number;
  note?: string;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    if (!['hutang', 'piutang'].includes(data.type)) {
      throw new Error('Jenis hutang tidak valid');
    }
    assertNonEmpty(data.person, 'Nama');
    assertPositiveInt(data.amount, 'Nominal');
    if (data.tenorMonths !== undefined) assertPositiveInt(data.tenorMonths, 'Tenor');
    if (data.interestRate !== undefined && (!Number.isFinite(data.interestRate) || data.interestRate < 0)) {
      throw new Error('Bunga tidak valid');
    }

    const debt = await prisma.debt.create({
      data: {
        userId,
        type: data.type,
        person: data.person,
        amount: data.amount,
        tenorMonths: data.tenorMonths || null,
        interestRate: data.interestRate || null,
        note: data.note || null,
      },
    });

    await createAuditLog(userId, 'CREATE_DEBT', 'debt', debt.id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan hutang';
    return { success: false, error: message };
  }
}

export async function toggleDebtSettled(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.debt.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Hutang tidak ditemukan');

    await prisma.debt.update({
      where: { id },
      data: { isSettled: !existing.isSettled },
    });

    await createAuditLog(userId, 'UPDATE_DEBT', 'debt', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah status hutang';
    return { success: false, error: message };
  }
}

export async function deleteDebt(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.debt.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Hutang tidak ditemukan');

    await prisma.debt.delete({ where: { id } });

    await createAuditLog(userId, 'DELETE_DEBT', 'debt', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus hutang';
    return { success: false, error: message };
  }
}

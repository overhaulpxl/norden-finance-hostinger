'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertPositiveInt } from '../../lib/validators';
import { addRecurringRule } from './recurring';
import type { TransactionType } from '../../types';

export async function addSubscription(data: {
  name: string;
  amount: number;
  billingDay: number;
  method: string;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(data.name, 'Nama subscription');
    assertNonEmpty(data.method, 'Metode pembayaran');
    assertPositiveInt(data.amount, 'Nominal');
    if (!Number.isInteger(data.billingDay) || data.billingDay < 1 || data.billingDay > 31) {
      throw new Error('Tanggal tagihan harus 1-31');
    }

    const sub = await prisma.appSubscription.create({
      data: {
        userId,
        name: data.name,
        amount: data.amount,
        billingDay: data.billingDay,
        method: data.method,
        isActive: true,
      },
    });

    await createAuditLog(userId, 'CREATE_SUBSCRIPTION', 'appSubscription', sub.id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan subscription';
    return { success: false, error: message };
  }
}

export async function addRecurringTransaction(data: {
  type: string;
  amount: number;
  category: string;
  method: string;
  note?: string;
  tags?: string[];
}) {
  assertPositiveInt(data.amount, 'Nominal');
  assertNonEmpty(data.method, 'Metode pembayaran');
  const recurring = await addRecurringRule({
    name: data.note || data.category || 'Transaksi berulang',
    type: data.type as TransactionType,
    amount: data.amount,
    categoryName: data.category,
    walletName: data.method,
    note: data.note,
    tags: data.tags,
  });
  if (!recurring.success) return recurring;

  await addSubscription({
    name: data.note || data.category || 'Recurring Bill',
    amount: data.amount,
    billingDay: new Date().getDate(),
    method: data.method,
  });

  return recurring;
}

export async function toggleSubscriptionActive(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.appSubscription.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Subscription tidak ditemukan');

    await prisma.appSubscription.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await createAuditLog(userId, 'UPDATE_SUBSCRIPTION', 'appSubscription', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah status subscription';
    return { success: false, error: message };
  }
}

export async function deleteSubscription(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.appSubscription.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Subscription tidak ditemukan');

    await prisma.appSubscription.delete({ where: { id } });

    await createAuditLog(userId, 'DELETE_SUBSCRIPTION', 'appSubscription', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus subscription';
    return { success: false, error: message };
  }
}

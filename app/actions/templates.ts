'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertPositiveInt } from '../../lib/validators';
import type { TransactionType } from '../../types';
import { addExplicitTransaction } from './transactions';
import { tagsFromJson, tagsToJson } from '../../lib/tags';

function assertTemplateType(type: TransactionType) {
  if (!['masuk', 'keluar'].includes(type)) {
    throw new Error('Template hanya mendukung pemasukan atau pengeluaran');
  }
}

export async function upsertTransactionTemplate(data: {
  id?: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryName: string;
  walletName: string;
  note?: string;
  tags?: string[];
  isFavorite?: boolean;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(data.name, 'Nama template');
    assertTemplateType(data.type);
    assertPositiveInt(data.amount, 'Nominal template');
    assertNonEmpty(data.categoryName, 'Kategori template');
    assertNonEmpty(data.walletName, 'Dompet template');

    const payload = {
      name: data.name.trim().slice(0, 80),
      type: data.type,
      amount: data.amount,
      categoryName: data.categoryName.trim().slice(0, 80),
      walletName: data.walletName.trim().toUpperCase().slice(0, 80),
      note: data.note?.trim().slice(0, 240) || null,
      tags: tagsToJson(data.tags),
      isFavorite: Boolean(data.isFavorite),
    };

    let template;
    if (data.id) {
      const existing = await prisma.transactionTemplate.findFirst({
        where: { id: data.id, userId },
      });
      if (!existing) throw new Error('Template tidak ditemukan');
      template = await prisma.transactionTemplate.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      template = await prisma.transactionTemplate.upsert({
        where: { userId_name: { userId, name: payload.name } },
        update: payload,
        create: { userId, ...payload },
      });
    }

    await createAuditLog(userId, data.id ? 'UPDATE_TEMPLATE' : 'CREATE_TEMPLATE', 'transactionTemplate', template.id);
    revalidatePath('/dashboard');
    return { success: true, data: template };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan template';
    return { success: false, error: message };
  }
}

export async function useTransactionTemplate(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const template = await prisma.transactionTemplate.findFirst({
      where: { id, userId },
    });
    if (!template) throw new Error('Template tidak ditemukan');

    const result = await addExplicitTransaction({
      type: template.type as TransactionType,
      amount: template.amount,
      category: template.categoryName,
      wallet: template.walletName,
      note: template.note || undefined,
      tags: tagsFromJson(template.tags),
    });
    if (!result.success) return result;

    await prisma.transactionTemplate.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    await createAuditLog(userId, 'USE_TEMPLATE', 'transactionTemplate', id);
    revalidatePath('/dashboard');
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memakai template';
    return { success: false, error: message };
  }
}

export async function toggleTemplateFavorite(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const template = await prisma.transactionTemplate.findFirst({
      where: { id, userId },
    });
    if (!template) throw new Error('Template tidak ditemukan');

    await prisma.transactionTemplate.update({
      where: { id },
      data: { isFavorite: !template.isFavorite },
    });
    await createAuditLog(userId, 'TOGGLE_TEMPLATE_FAVORITE', 'transactionTemplate', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah favorit template';
    return { success: false, error: message };
  }
}

export async function deleteTransactionTemplate(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const existing = await prisma.transactionTemplate.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Template tidak ditemukan');

    await prisma.transactionTemplate.delete({ where: { id } });
    await createAuditLog(userId, 'DELETE_TEMPLATE', 'transactionTemplate', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus template';
    return { success: false, error: message };
  }
}

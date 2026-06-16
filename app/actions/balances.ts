'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertNonNegativeInt } from '../../lib/validators';

/**
 * Create or update a wallet/balance.
 */
export async function updateBalance(name: string, amount: number, id?: string) {
  try {
    assertNonEmpty(name, 'Nama dompet');
    assertNonNegativeInt(amount, 'Saldo');
    const { user } = await requireUser(true);
    const userId = user.uid;
    const walletName = name.toUpperCase();

    // Determine wallet type
    const ewallets = ['DANA', 'GOPAY', 'OVO', 'SHOPEEPAY', 'LINKAJA'];
    const cashNames = ['CASH', 'TUNAI'];
    let type = 'bank';
    if (ewallets.includes(walletName)) type = 'ewallet';
    if (cashNames.includes(walletName)) type = 'cash';

    if (id) {
      // Update existing wallet
      const existing = await prisma.balance.findFirst({
        where: { id, userId },
      });

      if (!existing) throw new Error('Dompet tidak ditemukan');

      const wallet = await prisma.balance.update({
        where: { id },
        data: {
          name: walletName,
          type,
          currentBalance: amount,
          archivedAt: null,
        },
      });

      await createAuditLog(userId, 'UPDATE_BALANCE', 'balance', id);
      revalidatePath('/dashboard');
      return { success: true, wallet };
    } else {
      // Upsert wallet by name
      const wallet = await prisma.balance.upsert({
        where: { userId_name: { userId, name: walletName } },
        update: { currentBalance: amount, archivedAt: null },
        create: { userId, name: walletName, type, currentBalance: amount },
      });

      await createAuditLog(userId, 'UPDATE_BALANCE', 'balance', wallet.id);
      revalidatePath('/dashboard');
      return { success: true, wallet };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan dompet';
    return { success: false, error: message };
  }
}

/**
 * Archive a wallet/balance while preserving transaction history.
 */
export async function deleteBalance(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    // Verify ownership
    const existing = await prisma.balance.findFirst({
      where: { id, userId },
    });

    if (!existing) throw new Error('Dompet tidak ditemukan');

    const wallet = await prisma.balance.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    await createAuditLog(userId, 'ARCHIVE_BALANCE', 'balance', id);
    revalidatePath('/dashboard');
    return { success: true, wallet };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus dompet';
    return { success: false, error: message };
  }
}

export async function restoreBalance(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.balance.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Dompet tidak ditemukan');

    const wallet = await prisma.balance.update({
      where: { id },
      data: { archivedAt: null },
    });

    await createAuditLog(userId, 'RESTORE_BALANCE', 'balance', id);
    revalidatePath('/dashboard');
    return { success: true, wallet };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memulihkan dompet';
    return { success: false, error: message };
  }
}

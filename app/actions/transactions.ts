'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { parseTransactionWithAI } from '../../lib/aiParser';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import type { TransactionType } from '../../types';
import { assertNonEmpty, assertPositiveInt, assertValidDate } from '../../lib/validators';
import { Prisma, type Balance } from '@prisma/client';
import { tagsFromJson, tagsToJson } from '../../lib/tags';
import {
  detectKnownWalletAliasesFromInput,
  detectWalletsFromInput,
  normalizeWalletName,
  resolveTransferWalletsFromInput,
  resolveWalletForTransaction,
  stripWalletAliasesFromText,
  validateWalletMatch,
} from '../../lib/smart-input/parser';

/**
 * Find or create a category by name for a user.
 */
async function resolveCategory(userId: string, categoryName: string, type: TransactionType): Promise<string> {
  const name = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  
  const existing = await prisma.category.findUnique({
    where: { userId_name: { userId, name } },
  });

  if (existing) return existing.id;

  const created = await prisma.category.create({
    data: { userId, name, type },
  });

  return created.id;
}

/**
 * Find or create a wallet/balance by name for a user.
 */
async function resolveWallet(userId: string, walletName: string): Promise<string> {
  const name = walletName.toUpperCase();

  const existing = await prisma.balance.findUnique({
    where: { userId_name: { userId, name } },
  });

  if (existing) {
    if (existing.archivedAt) {
      await prisma.balance.update({
        where: { id: existing.id },
        data: { archivedAt: null },
      });
    }
    return existing.id;
  }

  // Determine wallet type
  const ewallets = ['DANA', 'GOPAY', 'OVO', 'SHOPEEPAY', 'LINKAJA'];
  const cashNames = ['CASH', 'TUNAI'];
  let type = 'bank';
  if (ewallets.includes(name)) type = 'ewallet';
  if (cashNames.includes(name)) type = 'cash';

  const created = await prisma.balance.create({
    data: { userId, name, type, currentBalance: 0 },
  });

  return created.id;
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function assertPositiveAmount(amount: number) {
  assertPositiveInt(amount, 'Nominal');
}

function walletDelta(type: TransactionType, amount: number) {
  if (type === 'transfer') return -amount;
  return type === 'masuk' ? amount : -amount;
}

function revalidateDashboard() {
  try {
    revalidatePath('/dashboard');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('static generation store missing')) {
      throw error;
    }
  }
}

function assertNoMissingExplicitWallet(input: string, wallets: Balance[]) {
  const existingMatches = detectWalletsFromInput(input, wallets);
  const existingCanonicals = new Set(existingMatches.map((match) => normalizeWalletName(match.wallet.name)));
  const missing = detectKnownWalletAliasesFromInput(input).find((match) => !existingCanonicals.has(match.canonical));

  if (missing) {
    throw new Error(`Wallet ${missing.displayName} belum ditemukan. Pilih wallet untuk transaksi ini.`);
  }
}

async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findUnique({ where: { userId } });
  
  if (!streak) {
    await prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastInputDate: today
      }
    });
    return;
  }

  if (!streak.lastInputDate) {
    await prisma.streak.update({
      where: { userId },
      data: { currentStreak: 1, longestStreak: Math.max(1, streak.longestStreak), lastInputDate: today }
    });
    return;
  }

  const lastDate = new Date(streak.lastInputDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    const newStreak = streak.currentStreak + 1;
    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastInputDate: today
      }
    });
  } else if (diffDays > 1) {
    await prisma.streak.update({
      where: { userId },
      data: { currentStreak: 1, lastInputDate: today }
    });
  }
}

export async function processUserInput(userId: string, input: string) {
  if (!input.trim()) return { success: false, error: 'Input kosong' };
  if (input.length > 500) return { success: false, error: 'Input terlalu panjang' };

  try {
    const [result, wallets] = await Promise.all([
      parseTransactionWithAI(input),
      prisma.balance.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    assertPositiveAmount(result.amount);
    assertNoMissingExplicitWallet(input, wallets);

    let transactionId: string | undefined;
    let walletName: string | undefined;
    let transferToWalletName: string | undefined;

    if (result.isBalanceUpdate) {
      // Balance update (e.g., "saldo bni 150k")
      const walletMatch = resolveWalletForTransaction({
        input,
        parsedWalletName: result.method,
        wallets,
      });

      if (!walletMatch) {
        throw new Error('Dompet belum tersedia. Tambahkan wallet terlebih dahulu.');
      }

      walletName = walletMatch.wallet.name;

      const wallet = await prisma.balance.update({
        where: { id: walletMatch.wallet.id },
        data: {
          currentBalance: result.amount,
          archivedAt: null,
        },
      });

      await createAuditLog(userId, 'UPDATE_BALANCE', 'balance', wallet.id);
    } else {
      // Transaction (e.g., "ayam geprek 18k cash")
      const txType = result.type || 'keluar';
      const categoryName = result.category || 'Lain-lain';
      const txDate = result.transactionDate ? new Date(result.transactionDate) : new Date();
      const cleanedNote = stripWalletAliasesFromText(result.note, wallets);
      result.note = cleanedNote;

      if (txType === 'transfer') {
        const explicitTransferWallets = resolveTransferWalletsFromInput(input, wallets);
        const fromWalletMatch = explicitTransferWallets?.from || resolveWalletForTransaction({
          input,
          parsedWalletName: result.method,
          wallets,
        });
        const toWalletMatch = explicitTransferWallets?.to || validateWalletMatch(result.transferToMethod, wallets);

        if (!fromWalletMatch) {
          throw new Error('Dompet asal belum ditemukan. Pilih wallet untuk transaksi ini.');
        }
        if (!toWalletMatch) {
          throw new Error('Dompet tujuan belum ditemukan. Pilih wallet untuk transaksi ini.');
        }
        if (fromWalletMatch.wallet.id === toWalletMatch.wallet.id) {
          throw new Error('Dompet asal dan tujuan tidak boleh sama.');
        }

        const categoryId = await resolveCategory(userId, 'Transfer', 'transfer');
        const newTx = await prisma.$transaction(async (tx) => {
          const created = await tx.transaction.create({
            data: {
              userId,
              categoryId,
              walletId: fromWalletMatch.wallet.id,
              transferToWalletId: toWalletMatch.wallet.id,
              type: 'transfer',
              amount: result.amount,
              note: cleanedNote && cleanedNote !== '-'
                ? cleanedNote
                : `Transfer ke ${toWalletMatch.wallet.name}`,
              rawInput: result.rawInput,
              tags: tagsToJson(result.tags),
              transactionDate: txDate,
            },
          });

          await tx.balance.update({
            where: { id: fromWalletMatch.wallet.id },
            data: { currentBalance: { decrement: result.amount }, archivedAt: null },
          });
          await tx.balance.update({
            where: { id: toWalletMatch.wallet.id },
            data: { currentBalance: { increment: result.amount }, archivedAt: null },
          });

          return created;
        });

        walletName = fromWalletMatch.wallet.name;
        transferToWalletName = toWalletMatch.wallet.name;
        transactionId = newTx.id;
        await createAuditLog(userId, 'CREATE_TRANSACTION', 'transaction', newTx.id);
        await updateStreak(userId);
      } else {
        const walletMatch = resolveWalletForTransaction({
          input,
          parsedWalletName: result.method,
          wallets,
        });

        if (!walletMatch) {
          throw new Error('Dompet belum tersedia. Tambahkan wallet terlebih dahulu.');
        }

        const categoryId = await resolveCategory(userId, categoryName, txType as TransactionType);

        const newTx = await prisma.$transaction(async (tx) => {
          const created = await tx.transaction.create({
            data: {
              userId,
              categoryId,
              walletId: walletMatch.wallet.id,
              type: txType as TransactionType,
              amount: result.amount,
              note: cleanedNote && cleanedNote !== '-' ? cleanedNote : null,
              rawInput: result.rawInput,
              tags: tagsToJson(result.tags),
              transactionDate: txDate,
            },
          });

          const amountChange = txType === 'masuk' ? result.amount : -result.amount;
          await tx.balance.update({
            where: { id: walletMatch.wallet.id },
            data: { currentBalance: { increment: amountChange }, archivedAt: null },
          });

          return created;
        });
        transactionId = newTx.id;
        walletName = walletMatch.wallet.name;

        await createAuditLog(userId, 'CREATE_TRANSACTION', 'transaction', newTx.id);
        await updateStreak(userId);
      }
    }

    revalidateDashboard();
    return {
      success: true,
      result,
      transactionId,
      action: result.isBalanceUpdate ? 'balance_update' : 'transaction',
      walletName,
      transferToWalletName,
    };
  } catch (error: unknown) {
    console.error('Error processing user input:', error);
    const message = error instanceof Error ? error.message : 'Gagal menyimpan data';
    return { success: false, error: message };
  }
}

export async function processInput(input: string) {
  try {
    const { user } = await requireUser(true);
    return await processUserInput(user.uid, input);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan data';
    return { success: false, error: message };
  }
}

/**
 * Add a transaction with explicit fields (from form).
 */
export async function addExplicitTransaction(data: {
  type: TransactionType;
  amount: number;
  category: string;
  wallet?: string;
  method?: string;
  note?: string;
  transactionDate?: string;
  tags?: string[];
  receiptMerchant?: string;
  receiptItems?: unknown;
  receiptDate?: string;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const txDate = data.transactionDate ? new Date(data.transactionDate) : new Date();
    const walletName = data.wallet || data.method || 'Lain-lain';
    assertPositiveAmount(data.amount);
    assertNonEmpty(data.category, 'Kategori');
    assertValidDate(data.transactionDate, 'Tanggal transaksi');
    assertValidDate(data.receiptDate, 'Tanggal struk');

    const [categoryId, walletId] = await Promise.all([
      resolveCategory(userId, data.category, data.type),
      resolveWallet(userId, walletName),
    ]);

    const newTx = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          categoryId,
          walletId,
          type: data.type,
          amount: data.amount,
          note: data.note || null,
          tags: tagsToJson(data.tags),
          receiptMerchant: data.receiptMerchant?.trim() || null,
          receiptItems: toPrismaJson(data.receiptItems),
          receiptDate: data.receiptDate ? new Date(data.receiptDate) : null,
          transactionDate: txDate,
        },
      });

      const amountChange = data.type === 'masuk' ? data.amount : -data.amount;
      await tx.balance.update({
        where: { id: walletId },
        data: { currentBalance: { increment: amountChange } },
      });

      return created;
    });

    await createAuditLog(userId, 'CREATE_TRANSACTION', 'transaction', newTx.id);
    revalidatePath('/dashboard');
    return { success: true, transactionId: newTx.id, action: 'transaction' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan transaksi';
    return { success: false, error: message };
  }
}

/**
 * Add a transfer between two wallets.
 */
export async function addTransferTransaction(
  amount: number,
  fromWallet: string,
  toWallet: string,
  note?: string,
  tags?: string[]
) {
  try {
    assertPositiveAmount(amount);
    assertNonEmpty(fromWallet, 'Dompet asal');
    assertNonEmpty(toWallet, 'Dompet tujuan');
    if (fromWallet.toLowerCase() === toWallet.toLowerCase()) throw new Error('Dompet asal dan tujuan tidak boleh sama');

    const { user } = await requireUser(true);
    const userId = user.uid;

    const [fromWalletId, toWalletId, categoryId] = await Promise.all([
      resolveWallet(userId, fromWallet),
      resolveWallet(userId, toWallet),
      resolveCategory(userId, 'Transfer', 'transfer'),
    ]);

    const newTx = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          categoryId,
          walletId: fromWalletId,
          transferToWalletId: toWalletId,
          type: 'transfer',
          amount,
          note: `Transfer ke ${toWallet.toUpperCase()}${note ? ' - ' + note : ''}`,
          tags: tagsToJson(tags),
        },
      });

      await tx.balance.update({
        where: { id: fromWalletId },
        data: { currentBalance: { decrement: amount } },
      });
      await tx.balance.update({
        where: { id: toWalletId },
        data: { currentBalance: { increment: amount } },
      });

      return created;
    });

    await createAuditLog(userId, 'CREATE_TRANSACTION', 'transaction', newTx.id);
    revalidatePath('/dashboard');
    return { success: true, transactionId: newTx.id, action: 'transaction' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan transfer';
    return { success: false, error: message };
  }
}

/**
 * Soft delete a transaction and revert the wallet balance.
 */
export async function deleteTransaction(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const tx = await prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!tx) throw new Error('Transaksi tidak ditemukan');

    await prisma.$transaction(async (db) => {
      if (tx.type === 'transfer') {
        if (tx.walletId) {
          await db.balance.update({
            where: { id: tx.walletId },
            data: { currentBalance: { increment: tx.amount } },
          });
        }

        if (tx.transferToWalletId) {
          await db.balance.update({
            where: { id: tx.transferToWalletId },
            data: { currentBalance: { decrement: tx.amount } },
          });
        } else {
          const match = tx.note?.match(/Transfer ke (.*?)(?:\s*-\s*|$)/i);
          const toWalletName = match ? match[1].trim() : null;
          if (toWalletName) {
            const destWallet = await db.balance.findUnique({
              where: { userId_name: { userId, name: toWalletName } },
            });
            if (destWallet) {
              await db.balance.update({
                where: { id: destWallet.id },
                data: { currentBalance: { decrement: tx.amount } },
              });
            }
          }
        }
      } else if (tx.walletId) {
        const amountChange = tx.type === 'masuk' ? -tx.amount : tx.amount;
        await db.balance.update({
          where: { id: tx.walletId },
          data: { currentBalance: { increment: amountChange } },
        });
      }

      await db.transaction.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });

    await createAuditLog(userId, 'DELETE_TRANSACTION', 'transaction', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus transaksi';
    return { success: false, error: message };
  }
}

/**
 * Update a transaction.
 */
export async function updateTransaction(
  id: string,
  data: {
    type?: TransactionType;
    amount?: number;
    category?: string;
    wallet?: string;
    note?: string;
    transactionDate?: string;
    tags?: string[];
  }
) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const tx = await prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!tx) throw new Error('Transaksi tidak ditemukan');
    if (tx.type === 'transfer' || data.type === 'transfer') {
      throw new Error('Transfer tidak bisa diubah dari editor transaksi. Hapus lalu buat transfer baru.');
    }

    const newAmount = data.amount ?? tx.amount;
    assertPositiveAmount(newAmount);
    assertValidDate(data.transactionDate, 'Tanggal transaksi');
    const newType = data.type || tx.type;

    // Resolve new category/wallet if changed
    let newCategoryId = tx.categoryId;
    let newWalletId = tx.walletId;

    if (data.category) {
      newCategoryId = await resolveCategory(userId, data.category, newType);
    }

    if (data.wallet) {
      newWalletId = await resolveWallet(userId, data.wallet);
    }

    await prisma.$transaction(async (db) => {
      if (tx.walletId) {
        await db.balance.update({
          where: { id: tx.walletId },
          data: { currentBalance: { decrement: walletDelta(tx.type, tx.amount) } },
        });
      }

      if (newWalletId) {
        await db.balance.update({
          where: { id: newWalletId },
          data: { currentBalance: { increment: walletDelta(newType, newAmount) } },
        });
      }

      await db.transaction.update({
        where: { id },
        data: {
          categoryId: newCategoryId,
          walletId: newWalletId,
          type: newType,
          amount: newAmount,
          note: data.note !== undefined ? data.note : tx.note,
          tags: data.tags !== undefined ? tagsToJson(data.tags) : tagsToJson(tagsFromJson(tx.tags)),
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : tx.transactionDate,
        },
      });
    });

    await createAuditLog(userId, 'UPDATE_TRANSACTION', 'transaction', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah transaksi';
    return { success: false, error: message };
  }
}

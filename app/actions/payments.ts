'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { PaymentStatus, PlanType } from '@prisma/client';
import { getPaymentSettings, getPricingPlans } from '../../lib/data/loaders';
import { isAllowedUploadUrl, isPaymentProofUrlForUser } from '../../lib/uploadUrls';

async function validatePaymentInput(data: {
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
}, userId: string) {
  const [pricingPlans, paymentSettings] = await Promise.all([
    getPricingPlans(),
    getPaymentSettings(),
  ]);
  const selectedPlan = data.billingType === 'monthly'
    ? pricingPlans.monthly
    : data.billingType === 'yearly'
      ? pricingPlans.yearly
      : null;

  if (!selectedPlan) {
    throw new Error('Paket pembayaran tidak valid');
  }

  if (data.amount !== selectedPlan.price) {
    throw new Error('Nominal pembayaran tidak sesuai paket');
  }

  const activeMethods = new Set([
    paymentSettings.bca_active !== 'false' ? 'bca' : null,
    paymentSettings.bni_active !== 'false' ? 'bni' : null,
    paymentSettings.qris_active !== 'false' ? 'qris' : null,
  ].filter(Boolean));

  if (!activeMethods.has(data.paymentMethod)) {
    throw new Error('Metode pembayaran tidak valid');
  }

  if (!isAllowedUploadUrl(data.proofPath)) {
    throw new Error('Bukti pembayaran tidak valid');
  }

  if (!isPaymentProofUrlForUser(data.proofPath, userId)) {
    throw new Error('Bukti pembayaran harus diunggah dari akun ini');
  }
}

export async function submitPaymentRequest(data: {
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
}) {
  try {
    const { user } = await requireUser(false); // Can request upgrade even if trial ended
    const userId = user.uid;
    await validatePaymentInput(data, userId);

    const existingPending = await prisma.paymentRequest.findFirst({
      where: { userId, status: PaymentStatus.pending },
    });
    if (existingPending) {
      throw new Error('Masih ada permintaan upgrade yang menunggu review admin');
    }

    const inserted = await prisma.paymentRequest.create({
      data: {
        userId,
        plan: PlanType.pro,
        billingType: data.billingType,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        proofPath: data.proofPath,
        status: PaymentStatus.pending,
      },
    });

    await createAuditLog(userId, 'CREATE_PAYMENT_REQUEST', 'paymentRequest', inserted.id);
    revalidatePath('/upgrade');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim bukti pembayaran';
    return { success: false, error: message };
  }
}

export async function getPaymentRequests() {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;

    const data = await prisma.paymentRequest.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat riwayat pembayaran';
    return { success: false, error: message };
  }
}

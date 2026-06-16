'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { PaymentStatus, PlanType, UserRole } from '@prisma/client';
import { getAdminAuth } from '../../lib/firebaseAdmin';
import { getPricingPlans } from '../../lib/data/loaders';
import { DEFAULT_MONTHLY_PRICE, DEFAULT_TRIAL_DAYS, DEFAULT_YEARLY_PRICE } from '../../lib/constants';
import { sendEmail } from '../../lib/email';
import { getPaymentApprovedEmailHtml, getPaymentRejectedEmailHtml } from '../../lib/email/templates/paymentEmails';
import { isAllowedUploadUrl } from '../../lib/uploadUrls';

async function sendPaymentStatusEmail({
  userId,
  type,
  adminNote,
}: {
  userId: string;
  type: 'approved' | 'rejected';
  adminNote?: string | null;
}) {
  try {
    const [firebaseUser, profile] = await Promise.all([
      getAdminAuth().getUser(userId),
      prisma.profile.findUnique({ where: { userId }, select: { fullName: true } }),
    ]);

    if (!firebaseUser.email) {
      console.warn('Payment email skipped: user email is missing.');
      return;
    }

    await sendEmail({
      to: firebaseUser.email,
      subject: type === 'approved' ? 'Norden Pro is now active' : 'Norden Pro payment needs review',
      html: type === 'approved'
        ? getPaymentApprovedEmailHtml({ userName: profile?.fullName || null })
        : getPaymentRejectedEmailHtml({ userName: profile?.fullName || null, adminNote }),
      text: type === 'approved'
        ? 'Your payment has been approved. Your Norden Pro subscription is now active.'
        : 'Your payment proof could not be verified. Please upload a new proof or contact support.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment email failed';
    console.warn('Payment email failed:', message);
  }
}

export async function getPendingPaymentRequests() {
  try {
    const { profile } = await requireUser(false);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses ke halaman ini.');
    }

    const pendingRequests = await prisma.paymentRequest.findMany({
      where: {
        status: PaymentStatus.pending,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // We need to fetch names for each user from profiles
    const userIds = pendingRequests.map(r => r.userId);
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { in: userIds },
      },
    });

    const profilesMap = new Map(profiles.map(p => [p.userId, p]));

    const data = pendingRequests.map(req => {
      const userProfile = profilesMap.get(req.userId);
      return {
        ...req,
        profiles: userProfile ? { full_name: userProfile.fullName } : null,
      };
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat permintaan pembayaran';
    return { success: false, error: message };
  }
}

export async function approvePaymentRequest(requestId: string) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    // Get payment request details
    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error('Permintaan pembayaran tidak ditemukan');
    if (request.status !== PaymentStatus.pending) throw new Error('Permintaan ini sudah diproses');
    const pricingPlans = await getPricingPlans();
    const selectedPlan = request.billingType === 'monthly'
      ? pricingPlans.monthly
      : request.billingType === 'yearly'
        ? pricingPlans.yearly
        : null;
    if (!selectedPlan || request.amount !== selectedPlan.price) {
      throw new Error('Nominal pembayaran tidak sesuai paket');
    }

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update payment request status
      await tx.paymentRequest.update({
        where: { id: requestId },
        data: { status: PaymentStatus.approved },
      });

      // 2. Update user profile to Pro plan
      await tx.profile.update({
        where: { userId: request.userId },
        data: { plan: PlanType.pro },
      });

      // 3. Upsert subscription billing details
      const billingDays = request.billingType === 'monthly' ? 30 : 365;
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + billingDays);

      const existingBilling = await tx.billingSubscription.findFirst({
        where: {
          userId: request.userId,
          plan: PlanType.pro,
        },
      });

      if (existingBilling) {
        await tx.billingSubscription.update({
          where: { id: existingBilling.id },
          data: {
            status: 'active',
            startedAt: new Date(),
            expiredAt,
          },
        });
      } else {
        await tx.billingSubscription.create({
          data: {
            userId: request.userId,
            plan: PlanType.pro,
            status: 'active',
            startedAt: new Date(),
            expiredAt,
          },
        });
      }
    });

    const callerUser = await requireUser(true);
    await createAuditLog(callerUser.user.uid, 'APPROVE_PAYMENT', 'paymentRequest', requestId);
    await sendPaymentStatusEmail({ userId: request.userId, type: 'approved' });
    
    revalidatePath('/norden-control-center');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyetujui pembayaran';
    return { success: false, error: message };
  }
}

export async function rejectPaymentRequest(requestId: string, adminNote: string) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    await prisma.$transaction(async (tx) => {
      const request = await tx.paymentRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) throw new Error('Permintaan pembayaran tidak ditemukan');
      if (request.status !== PaymentStatus.pending) throw new Error('Permintaan ini sudah diproses');

      await tx.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: PaymentStatus.rejected,
          adminNote: adminNote || null,
        },
      });
    });

    const rejectedRequest = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      select: { userId: true, adminNote: true },
    });

    const callerUser = await requireUser(true);
    await createAuditLog(callerUser.user.uid, 'REJECT_PAYMENT', 'paymentRequest', requestId);
    if (rejectedRequest) {
      await sendPaymentStatusEmail({
        userId: rejectedRequest.userId,
        type: 'rejected',
        adminNote: rejectedRequest.adminNote,
      });
    }
    revalidatePath('/norden-control-center');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menolak pembayaran';
    return { success: false, error: message };
  }
}

export async function getAllUsers() {
  try {
    const { profile } = await requireUser(false);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses ke data ini.');
    }

    const users = await prisma.profile.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Serialize Dates to strings for Client Components compatibility
    const serializedUsers = users.map(u => ({
      ...u,
      trialStartedAt: u.trialStartedAt.toISOString(),
      trialEndsAt: u.trialEndsAt.toISOString(),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return { success: true, data: serializedUsers };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat daftar pengguna';
    return { success: false, error: message };
  }
}

export async function updateUserPlanManually(targetUserId: string, newPlan: PlanType, days: number = 30) {
  try {
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }
    if (!Number.isInteger(days) || days < 1 || days > 3660) {
      throw new Error('Durasi paket tidak valid');
    }

    await prisma.$transaction(async (tx) => {
      const targetProfile = await tx.profile.findUnique({
        where: { userId: targetUserId }
      });
      if (!targetProfile) throw new Error('Profil pengguna tidak ditemukan');

      let baseDate = new Date();
      
      const existingBilling = await tx.billingSubscription.findFirst({
        where: { userId: targetUserId, plan: PlanType.pro, status: 'active' },
      });

      if (newPlan === PlanType.pro && existingBilling && existingBilling.expiredAt && existingBilling.expiredAt > new Date()) {
        baseDate = new Date(existingBilling.expiredAt);
      }

      const expiredAt = new Date(baseDate);
      expiredAt.setDate(expiredAt.getDate() + days);

      await tx.profile.update({
        where: { userId: targetUserId },
        data: { 
          plan: newPlan,
          trialEndsAt: expiredAt
        },
      });

      if (newPlan === PlanType.pro) {
        if (existingBilling) {
          await tx.billingSubscription.update({
            where: { id: existingBilling.id },
            data: {
              status: 'active',
              expiredAt,
            },
          });
        } else {
          await tx.billingSubscription.create({
            data: {
              userId: targetUserId,
              plan: PlanType.pro,
              status: 'active',
              startedAt: new Date(),
              expiredAt,
            },
          });
        }
      } else {
        await tx.billingSubscription.updateMany({
          where: { userId: targetUserId, plan: PlanType.pro },
          data: { status: 'cancelled' },
        });
      }
    });

    await createAuditLog(user.uid, `MANUAL_PLAN_UPDATE_${newPlan.toUpperCase()}_DAYS_${days}`, 'profile', targetUserId);
    revalidatePath('/norden-control-center');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal merubah paket pengguna';
    return { success: false, error: message };
  }
}

export async function updateUserRoleManually(targetUserId: string, newRole: UserRole) {
  try {
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    if (targetUserId === user.uid && newRole !== UserRole.admin) {
      throw new Error('Anda tidak dapat menurunkan role Anda sendiri.');
    }

    await prisma.profile.update({
      where: { userId: targetUserId },
      data: { role: newRole },
    });

    await createAuditLog(user.uid, `MANUAL_ROLE_UPDATE_${newRole.toUpperCase()}`, 'profile', targetUserId);
    revalidatePath('/norden-control-center');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal merubah role pengguna';
    return { success: false, error: message };
  }
}

export async function deleteUserAccountByAdmin(targetUserId: string) {
  try {
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    if (targetUserId === user.uid) {
      throw new Error('Anda tidak dapat menghapus akun admin yang sedang digunakan.');
    }

    const targetProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
      select: { id: true, fullName: true, role: true },
    });

    if (!targetProfile) {
      throw new Error('Profil pengguna tidak ditemukan.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { userId: targetUserId } });
      await tx.budget.deleteMany({ where: { userId: targetUserId } });
      await tx.category.deleteMany({ where: { userId: targetUserId } });
      await tx.balance.deleteMany({ where: { userId: targetUserId } });

      await tx.savingGoal.deleteMany({ where: { userId: targetUserId } });
      await tx.wishlistItem.deleteMany({ where: { userId: targetUserId } });
      await tx.debt.deleteMany({ where: { userId: targetUserId } });
      await tx.paylater.deleteMany({ where: { userId: targetUserId } });
      await tx.appSubscription.deleteMany({ where: { userId: targetUserId } });
      await tx.emergencyFundPlan.deleteMany({ where: { userId: targetUserId } });
      await tx.transactionTemplate.deleteMany({ where: { userId: targetUserId } });
      await tx.recurringTransaction.deleteMany({ where: { userId: targetUserId } });
      await tx.reminder.deleteMany({ where: { userId: targetUserId } });
      await tx.streak.deleteMany({ where: { userId: targetUserId } });
      await tx.achievement.deleteMany({ where: { userId: targetUserId } });
      await tx.notification.deleteMany({ where: { userId: targetUserId } });
      await tx.paymentRequest.deleteMany({ where: { userId: targetUserId } });
      await tx.billingSubscription.deleteMany({ where: { userId: targetUserId } });
      await tx.feedback.deleteMany({ where: { userId: targetUserId } });
      await tx.auditLog.deleteMany({ where: { userId: targetUserId } });
      await tx.profile.delete({ where: { userId: targetUserId } });
    });

    try {
      const adminAuth = getAdminAuth();
      if (adminAuth.deleteUser) {
        await adminAuth.deleteUser(targetUserId);
      }
    } catch (authError) {
      console.warn('Firebase Auth user deletion skipped or failed:', authError);
    }

    await createAuditLog(user.uid, `ADMIN_DELETE_USER_${targetProfile.role.toUpperCase()}`, 'profile', targetUserId);
    revalidatePath('/norden-control-center');
    revalidatePath('/dashboard');

    return { success: true, deletedName: targetProfile.fullName || 'Tanpa Nama' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus akun pengguna';
    return { success: false, error: message };
  }
}

export async function updateFeedbackStatus(feedbackId: string, newStatus: string) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }
    if (!['open', 'reviewed', 'closed'].includes(newStatus)) {
      throw new Error('Status umpan balik tidak valid');
    }

    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: newStatus },
    });

    revalidatePath('/norden-control-center');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah status umpan balik';
    return { success: false, error: message };
  }
}

export async function getPaymentSettings() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    return {
      success: true,
      data: {
        bca_number: settingsMap.get('bca_number') || '',
        bca_holder: settingsMap.get('bca_holder') || '',
        bca_active: settingsMap.get('bca_active') || 'false',
        bni_number: settingsMap.get('bni_number') || '',
        bni_holder: settingsMap.get('bni_holder') || '',
        bni_active: settingsMap.get('bni_active') || 'false',
        qris_image: settingsMap.get('qris_image') || '',
        qris_active: settingsMap.get('qris_active') || 'false',
      }
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pengaturan pembayaran';
    return { success: false, error: message };
  }
}

export async function updatePaymentSettings(data: {
  bca_number: string;
  bca_holder: string;
  bca_active: string;
  bni_number: string;
  bni_holder: string;
  bni_active: string;
  qris_image: string;
  qris_active: string;
}) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }
    if (data.bca_active === 'true' && (!data.bca_number.trim() || !data.bca_holder.trim())) {
      throw new Error('Nomor dan nama pemilik BCA wajib diisi jika BCA aktif');
    }
    if (data.bni_active === 'true' && (!data.bni_number.trim() || !data.bni_holder.trim())) {
      throw new Error('Nomor dan nama pemilik BNI wajib diisi jika BNI aktif');
    }
    if (data.qris_active === 'true') {
      if (
        !isAllowedUploadUrl(data.qris_image)
      ) {
        throw new Error('Gambar QRIS aktif harus berupa URL upload yang valid');
      }
    }

    const keys = Object.keys(data) as Array<keyof typeof data>;
    for (const key of keys) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: data[key] },
        create: { key, value: data[key] },
      });
    }

    revalidatePath('/norden-control-center');
    revalidatePath('/upgrade');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui pengaturan pembayaran';
    return { success: false, error: message };
  }
}

export async function updatePricingSettings(data: {
  trial_days: number;
  monthly_price: number;
  yearly_price: number;
  trial_active: boolean;
  monthly_active: boolean;
  yearly_active: boolean;
}) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    const trialDays = Math.round(Number(data.trial_days || DEFAULT_TRIAL_DAYS));
    const monthlyPrice = Math.round(Number(data.monthly_price || DEFAULT_MONTHLY_PRICE));
    const yearlyPrice = Math.round(Number(data.yearly_price || DEFAULT_YEARLY_PRICE));

    if (!Number.isFinite(trialDays) || trialDays < 1 || trialDays > 365) {
      throw new Error('Durasi trial harus antara 1 sampai 365 hari.');
    }
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
      throw new Error('Harga bulanan tidak valid.');
    }
    if (!Number.isFinite(yearlyPrice) || yearlyPrice < 0) {
      throw new Error('Harga tahunan tidak valid.');
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.setting.upsert({
          where: { key: 'trial_days' },
          update: { value: String(trialDays) },
          create: { key: 'trial_days', value: String(trialDays) },
        }),
        tx.setting.upsert({
          where: { key: 'monthly_price' },
          update: { value: String(monthlyPrice) },
          create: { key: 'monthly_price', value: String(monthlyPrice) },
        }),
        tx.setting.upsert({
          where: { key: 'yearly_price' },
          update: { value: String(yearlyPrice) },
          create: { key: 'yearly_price', value: String(yearlyPrice) },
        }),
      ]);

      const trialPlan = await tx.plan.findFirst({ where: { type: 'trial' } });
      if (trialPlan) {
        await tx.plan.update({
          where: { id: trialPlan.id },
          data: {
            name: 'Trial Plan',
            price: 0,
            type: 'trial',
            billingType: null,
            durationDays: trialDays,
            isActive: data.trial_active,
          },
        });
      } else {
        await tx.plan.create({
          data: {
            id: 'default-trial-plan',
            name: 'Trial Plan',
            price: 0,
            type: 'trial',
            billingType: null,
            durationDays: trialDays,
            isActive: data.trial_active,
          },
        });
      }

      const monthlyPlan = await tx.plan.findFirst({ where: { type: 'pro', billingType: 'monthly' } });
      if (monthlyPlan) {
        await tx.plan.update({
          where: { id: monthlyPlan.id },
          data: {
            name: 'Pro Monthly',
            price: monthlyPrice,
            type: 'pro',
            billingType: 'monthly',
            durationDays: null,
            isActive: data.monthly_active,
          },
        });
      } else {
        await tx.plan.create({
          data: {
            id: 'default-pro-monthly',
            name: 'Pro Monthly',
            price: monthlyPrice,
            type: 'pro',
            billingType: 'monthly',
            isActive: data.monthly_active,
          },
        });
      }

      const yearlyPlan = await tx.plan.findFirst({ where: { type: 'pro', billingType: 'yearly' } });
      if (yearlyPlan) {
        await tx.plan.update({
          where: { id: yearlyPlan.id },
          data: {
            name: 'Pro Yearly',
            price: yearlyPrice,
            type: 'pro',
            billingType: 'yearly',
            durationDays: null,
            isActive: data.yearly_active,
          },
        });
      } else {
        await tx.plan.create({
          data: {
            id: 'default-pro-yearly',
            name: 'Pro Yearly',
            price: yearlyPrice,
            type: 'pro',
            billingType: 'yearly',
            isActive: data.yearly_active,
          },
        });
      }
    });

    revalidatePath('/');
    revalidatePath('/upgrade');
    revalidatePath('/dashboard');
    revalidatePath('/norden-control-center');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui pengaturan harga';
    return { success: false, error: message };
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertValidDate } from '../../lib/validators';
import { getAdminAuth } from '../../lib/firebaseAdmin';
import { sendEmail } from '../../lib/email';

const CHANNELS = new Set(['in_app', 'email']);

export async function addReminder(data: {
  title: string;
  body: string;
  type?: string;
  channel?: string;
  dueAt?: string;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(data.title, 'Judul pengingat');
    assertNonEmpty(data.body, 'Isi pengingat');
    assertValidDate(data.dueAt, 'Tanggal pengingat');

    const channel = data.channel || 'in_app';
    if (!CHANNELS.has(channel)) throw new Error('Channel pengingat tidak valid');

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: data.title.trim().slice(0, 100),
        body: data.body.trim().slice(0, 300),
        type: data.type?.trim().slice(0, 40) || 'manual',
        channel,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });

    await createAuditLog(userId, 'CREATE_REMINDER', 'reminder', reminder.id);
    revalidatePath('/dashboard');
    return { success: true, data: reminder };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat pengingat';
    return { success: false, error: message };
  }
}

export async function completeReminder(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Pengingat tidak ditemukan');

    await prisma.reminder.update({
      where: { id },
      data: { completedAt: existing.completedAt ? null : new Date() },
    });

    await createAuditLog(userId, 'COMPLETE_REMINDER', 'reminder', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah pengingat';
    return { success: false, error: message };
  }
}

export async function deleteReminder(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Pengingat tidak ditemukan');

    await prisma.reminder.delete({ where: { id } });
    await createAuditLog(userId, 'DELETE_REMINDER', 'reminder', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus pengingat';
    return { success: false, error: message };
  }
}

export async function processDueEmailReminders(limit = 50) {
  const now = new Date();
  const dueReminders = await prisma.reminder.findMany({
    where: {
      channel: 'email',
      completedAt: null,
      emailSentAt: null,
      emailAttemptCount: { lt: 3 },
      OR: [
        { dueAt: null },
        { dueAt: { lte: now } },
      ],
    },
    orderBy: [
      { dueAt: 'asc' },
      { createdAt: 'asc' },
    ],
    take: Math.min(Math.max(limit, 1), 100),
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const reminder of dueReminders) {
    try {
      const firebaseUser = await getAdminAuth().getUser(reminder.userId);
      if (!firebaseUser.email) {
        throw new Error('User email is not available from Firebase Auth');
      }

      await sendEmail({
        to: firebaseUser.email,
        subject: `Norden reminder: ${reminder.title}`,
        html: `<p>${reminder.body.replace(/[&<>"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char] || char)}</p><p>This reminder was sent by Norden Finance.</p>`,
        text: `${reminder.body}\n\nThis reminder was sent by Norden Finance.`,
      });

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          emailSentAt: now,
          emailLastError: null,
          emailAttemptCount: { increment: 1 },
        },
      });
      await createAuditLog(reminder.userId, 'SEND_REMINDER_EMAIL', 'reminder', reminder.id);
      sentCount += 1;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Email reminder delivery failed';
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          emailLastError: message.slice(0, 500),
          emailAttemptCount: { increment: 1 },
        },
      });
      failedCount += 1;
    }
  }

  return { success: true, scannedCount: dueReminders.length, sentCount, failedCount };
}

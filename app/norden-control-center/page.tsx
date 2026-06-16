import { requireUser } from '../../lib/auth';
import AdminClient from './AdminClient';
import { redirect } from 'next/navigation';
import { getAdminStats, getPaymentSettings, getPricingPlans } from '../../lib/data/loaders';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  let userAndProfile;
  try {
    userAndProfile = await requireUser(false);
  } catch {
    redirect('/login');
  }

  const { profile } = userAndProfile;

  if (profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const {
    paymentRequests,
    feedbacks,
    listedUsers,
    auditLogs,
    platformStats,
  } = await getAdminStats();

  // ========================================
  // Serialize everything
  // ========================================
  const referencedProfileIds = Array.from(new Set([
    ...listedUsers.map((user) => user.userId),
    ...paymentRequests.map((request) => request.userId),
    ...feedbacks.map((feedback) => feedback.userId),
    ...auditLogs.flatMap((log) => log.userId ? [log.userId] : []),
  ]));
  const { prisma } = await import('../../lib/prisma');
  const referencedProfiles = await prisma.profile.findMany({ where: { userId: { in: referencedProfileIds } } });
  const profilesMap = new Map(referencedProfiles.map(p => [p.userId, p]));

  const serializedRequests = paymentRequests.map(req => {
    const userProfile = profilesMap.get(req.userId);
    return {
      id: req.id,
      userId: req.userId,
      plan: req.plan,
      billingType: req.billingType,
      amount: req.amount,
      paymentMethod: req.paymentMethod,
      proofPath: req.proofPath,
      status: req.status,
      adminNote: req.adminNote,
      fullName: userProfile?.fullName || 'Tanpa Nama',
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    };
  });

  const serializedUsers = listedUsers.map(u => ({
    id: u.id,
    userId: u.userId,
    fullName: u.fullName || 'Tanpa Nama',
    role: u.role,
    plan: u.plan,
    trialStartedAt: u.trialStartedAt.toISOString(),
    trialEndsAt: u.trialEndsAt.toISOString(),
    createdAt: u.createdAt.toISOString(),
  }));

  const serializedAuditLogs = auditLogs.map(log => ({
    id: log.id,
    userId: log.userId,
    userName: log.userId ? (profilesMap.get(log.userId)?.fullName || log.userId) : 'System',
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    createdAt: log.createdAt.toISOString(),
  }));

  const serializedFeedbacks = feedbacks.map(fb => ({
    id: fb.id,
    userId: fb.userId,
    userName: profilesMap.get(fb.userId)?.fullName || 'Tanpa Nama',
    rating: fb.rating,
    message: fb.message,
    status: fb.status,
    createdAt: fb.createdAt.toISOString(),
  }));

  const [paymentSettings, pricingPlans] = await Promise.all([
    getPaymentSettings(),
    getPricingPlans(),
  ]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 sm:p-6 lg:p-8">
      <AdminClient 
        initialRequests={serializedRequests} 
        initialUsers={serializedUsers}
        initialAuditLogs={serializedAuditLogs}
        initialFeedbacks={serializedFeedbacks}
        platformStats={platformStats}
        initialPaymentSettings={paymentSettings}
        initialPricingPlans={pricingPlans}
        currentAdminId={profile.userId}
      />
    </div>
  );
}

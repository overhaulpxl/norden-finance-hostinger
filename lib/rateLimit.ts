import { prisma } from './prisma';

export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const nextResetAt = new Date(now.getTime() + windowMs);

  const bucket = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      return tx.rateLimitBucket.upsert({
        where: { key },
        update: { count: 1, resetAt: nextResetAt },
        create: { key, count: 1, resetAt: nextResetAt },
      });
    }

    return tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
  });

  if (bucket.count > limit) {
    throw new Error('Terlalu banyak request. Coba lagi nanti.');
  }
}

export function rateLimitKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip');
  return `${scope}:${forwardedFor || realIp || 'unknown'}`;
}

import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient;

if (typeof window === 'undefined') {
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  prismaInstance = globalForPrisma.prisma;
} else {
  throw new Error('Prisma can only be used on the server');
}

export const prisma = prismaInstance;

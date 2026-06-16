import { prisma } from './prisma';

/**
 * Create an audit log entry.
 * userId is always derived from the server session, never from the client.
 */
export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

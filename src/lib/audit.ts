import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

/**
 * Records an entry in the activity/audit log. Best-effort: a logging failure
 * must never break the underlying business operation, so errors are swallowed.
 *
 * Pass a transaction client (`tx`) to include the log in the same transaction
 * as the mutation it describes.
 */
export async function logActivity(
  staffId: string,
  action: string,
  details?: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<void> {
  try {
    await client.activityLog.create({ data: { staffId, action, details: details?.slice(0, 500) } });
  } catch {
    /* never throw from the audit path */
  }
}

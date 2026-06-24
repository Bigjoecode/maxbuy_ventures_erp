import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

// GET /api/admin/activity?page=0&action= — paginated audit trail.
// Requires the 'reports' permission (managers + admins).
export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'reports');
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, Number(searchParams.get('page') || 0));
  const action = searchParams.get('action') || undefined;
  const pageSize = 50;

  const where = action ? { action } : undefined;
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { staff: { select: { name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize });
}

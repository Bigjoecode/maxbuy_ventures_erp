import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { REFRESH_COOKIE } from '@/lib/auth';

function currentSessionId(req: NextRequest): string | null {
  const cookie = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!cookie) return null;
  const idx = cookie.indexOf('.');
  return idx > 0 ? cookie.slice(0, idx) : null;
}

// GET /api/auth/sessions — list this user's active sessions (current marked).
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const currentId = currentSessionId(req);
  const sessions = await prisma.session.findMany({
    where: { staffId: auth.staffId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: 'desc' },
    select: { id: true, userAgent: true, ipAddress: true, lastUsedAt: true, createdAt: true },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({ ...s, current: s.id === currentId })),
  });
}

// DELETE /api/auth/sessions?id=<id>   — revoke one device
// DELETE /api/auth/sessions?others=1  — revoke all except the current device
export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const others = searchParams.get('others');
  const currentId = currentSessionId(req);

  if (others) {
    await prisma.session.updateMany({
      where: { staffId: auth.staffId, revokedAt: null, NOT: { id: currentId ?? undefined } },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (id) {
    // updateMany scoped to staffId prevents revoking another user's session.
    await prisma.session.updateMany({
      where: { id, staffId: auth.staffId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Specify ?id= or ?others=1' }, { status: 400 });
}

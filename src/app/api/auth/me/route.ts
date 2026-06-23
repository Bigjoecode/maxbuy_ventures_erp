import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

// Returns the currently-authenticated user. Used by the client to hydrate
// auth state on load. Re-reads the staff record so a deactivated account is
// rejected even if it still holds a valid access token.
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const staff = await prisma.staff.findUnique({
    where: { id: auth.staffId },
    select: { id: true, name: true, username: true, role: true, isActive: true },
  });

  if (!staff || !staff.isActive) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const avatar = staff.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return NextResponse.json({
    user: {
      staffId: staff.id,
      name: staff.name,
      username: staff.username,
      role: staff.role,
      avatar,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'CASHIER', 'STOCK_KEEPER', 'SALES_REP']).optional(),
  isActive: z.boolean().optional(),
  branchId: z.string().optional().nullable(),
  password: z.string().min(6).optional(), // optional password reset
});

interface Params {
  params: { id: string };
}

// Guards against removing the last way in: blocks demoting/deactivating/deleting
// the only remaining active Super Admin.
async function isLastActiveSuperAdmin(id: string): Promise<boolean> {
  const target = await prisma.staff.findUnique({ where: { id } });
  if (!target || target.role !== 'SUPER_ADMIN' || !target.isActive) return false;
  const count = await prisma.staff.count({
    where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null },
  });
  return count <= 1;
}

// PATCH /api/staff/[id] — edit details, reassign role, (de)activate, reset password
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'staff');
  if (auth instanceof NextResponse) return auth;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.staff.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

  // Protect the last Super Admin from being demoted or deactivated.
  const losingAdmin =
    (data.role !== undefined && data.role !== 'SUPER_ADMIN') || data.isActive === false;
  if (losingAdmin && (await isLastActiveSuperAdmin(params.id))) {
    return NextResponse.json(
      { error: 'Cannot demote or deactivate the last active Super Admin.' },
      { status: 400 }
    );
  }
  // Don't let admins deactivate their own account (avoids self-lockout).
  if (data.isActive === false && params.id === auth.staffId) {
    return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    name: data.name,
    phone: data.phone,
    role: data.role,
    isActive: data.isActive,
    branchId: data.branchId,
  };
  if (data.password) updateData.passwordHash = await hashPassword(data.password);

  const staff = await prisma.staff.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, username: true, role: true, phone: true, isActive: true, branchId: true },
  });

  // If the account was deactivated or its password reset, revoke its sessions.
  if (data.isActive === false || data.password) {
    await prisma.session.updateMany({
      where: { staffId: params.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await logActivity(auth.staffId, 'STAFF_UPDATED', `Updated ${staff.username} (role: ${staff.role}, active: ${staff.isActive})`);
  return NextResponse.json({ staff });
}

// DELETE /api/staff/[id] — soft delete + revoke sessions
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'staff');
  if (auth instanceof NextResponse) return auth;

  if (params.id === auth.staffId) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }
  if (await isLastActiveSuperAdmin(params.id)) {
    return NextResponse.json({ error: 'Cannot delete the last active Super Admin.' }, { status: 400 });
  }

  const existing = await prisma.staff.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

  await prisma.$transaction([
    prisma.staff.update({ where: { id: params.id }, data: { isActive: false, deletedAt: new Date() } }),
    prisma.session.updateMany({ where: { staffId: params.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  await logActivity(auth.staffId, 'STAFF_DELETED', `Removed staff: ${existing.username}`);
  return NextResponse.json({ success: true });
}

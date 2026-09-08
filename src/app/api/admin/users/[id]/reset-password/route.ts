import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { AclError, aclJsonError, isSuperAdmin, requireAdmin } from '@/lib/acl';
import { prisma } from '@/lib/prisma';
import { generateTempPassword, logAdminAction } from '@/lib/admin-audit';
import { z } from 'zod';

const bodySchema = z.object({
  /** If omitted — generate a temporary password */
  password: z.string().min(8).max(100).optional(),
  mustChangePassword: z.boolean().optional().default(true),
});

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await requireAdmin();
    const role = session.user.role;

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || 'Некорректные данные' },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
    }
    if (target.role === 'TECH') {
      return NextResponse.json(
        { message: 'Пароль TECH сбрасывается только в /ops' },
        { status: 403 }
      );
    }
    if (
      target.role === 'ADMIN' &&
      !isSuperAdmin(session.user.role, session.user.permissions)
    ) {
      return NextResponse.json(
        { message: 'Сброс пароля администратора — только для суперадмина' },
        { status: 403 }
      );
    }

    const plain = parsed.data.password?.trim() || generateTempPassword(14);
    const hashed = await bcrypt.hash(plain, 10);
    const mustChange = parsed.data.mustChangePassword !== false;

    await prisma.user.update({
      where: { id: target.id },
      data: {
        password: hashed,
        mustChangePassword: mustChange,
        tokenVersion: { increment: 1 },
      },
    });

    await logAdminAction({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: role,
      action: 'USER_PASSWORD_RESET',
      targetType: 'User',
      targetId: target.id,
      targetEmail: target.email,
      detail: {
        mustChangePassword: mustChange,
        generated: !parsed.data.password,
        passwordLength: plain.length,
        targetName: target.name,
      },
    });

    return NextResponse.json({
      message: mustChange
        ? 'Пароль сброшен. Пользователь должен сменить его при входе.'
        : 'Пароль сброшен.',
      temporaryPassword: plain,
      mustChangePassword: mustChange,
      userId: target.id,
      email: target.email,
    });
  } catch (e) {
    if (e instanceof AclError) return aclJsonError(e);
    console.error('admin reset-password', e);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}

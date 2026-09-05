import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission, aclJsonError } from '@/lib/acl';
import { bumpEcoPoints, ECO } from '@/lib/eco-points';
import { bumpSocialScore } from '@/lib/reputation';
import { evaluateAchievements } from '@/lib/award-achievements';
import { createUserNotification } from '@/lib/security';
import { sanitizeCmsHtml } from '@/lib/sanitize-html';
import { parseVacancyRequirements, serializeVacancyRequirements } from '@/lib/vacancy-content';

export async function GET() {
  try {
    await requirePermission('vacancies');
    const [vacancies, employers, applications] = await Promise.all([
      prisma.vacancy.findMany({
        orderBy: [{ updatedAt: 'desc' }],
        take: 100,
        include: {
          employer: { select: { id: true, title: true, status: true, isInternal: true } },
          _count: { select: { applications: true, questions: true } },
        },
      }),
      prisma.employer.findMany({ orderBy: { createdAt: 'desc' }, take: 80 }),
      prisma.vacancyApplication.findMany({
        where: { status: 'PENDING_REVIEW' },
        orderBy: { createdAt: 'asc' },
        take: 80,
        include: {
          user: { select: { id: true, name: true, email: true, publicCode: true } },
          vacancy: { select: { id: true, title: true } },
        },
      }),
    ]);
    return NextResponse.json({ vacancies, employers, applications });
  } catch (e) {
    return aclJsonError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('vacancies');
    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'upsertEmployer') {
      const id = body.id ? String(body.id) : null;
      const data = {
        title: String(body.title || '').trim(),
        description: body.description ? String(body.description) : null,
        contactName: body.contactName ? String(body.contactName) : null,
        contactEmail: body.contactEmail ? String(body.contactEmail) : null,
        contactPhone: body.contactPhone ? String(body.contactPhone) : null,
        websiteUrl: body.websiteUrl ? String(body.websiteUrl) : null,
        isInternal: Boolean(body.isInternal),
        status: String(body.status || 'APPROVED'),
      };
      if (!data.title) return NextResponse.json({ message: 'Укажите название' }, { status: 400 });
      const row = id
        ? await prisma.employer.update({ where: { id }, data })
        : await prisma.employer.create({
            data: { ...data, submittedById: session.user.id },
          });
      return NextResponse.json({ employer: row });
    }

    if (action === 'upsertVacancy') {
      const id = body.id ? String(body.id) : null;
      const employerId = String(body.employerId || '');
      if (!employerId) return NextResponse.json({ message: 'Работодатель обязателен' }, { status: 400 });
      const prev = id
        ? parseVacancyRequirements(
            (
              await prisma.vacancy.findUnique({
                where: { id },
                select: { requirementsJson: true },
              })
            )?.requirementsJson
          )
        : parseVacancyRequirements(null);
      const items = Array.isArray(body.requirements)
        ? body.requirements.map((x: unknown) => String(x).trim()).filter(Boolean)
        : typeof body.requirements === 'string'
          ? String(body.requirements)
              .split('\n')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : prev.items;
      const data = {
        employerId,
        title: String(body.title || '').trim(),
        description: sanitizeCmsHtml(String(body.description || '')),
        requirementsJson: serializeVacancyRequirements({
          items,
          salaryText: body.salaryText !== undefined ? String(body.salaryText || '') : prev.salaryText,
          paid: body.paid === undefined ? prev.paid : body.paid === null ? null : Boolean(body.paid),
          employmentType:
            body.employmentType !== undefined ? String(body.employmentType || '') : prev.employmentType,
          duties: Array.isArray(body.duties)
            ? body.duties.map((x: unknown) => String(x).trim()).filter(Boolean)
            : prev.duties,
          offer: Array.isArray(body.offer)
            ? body.offer.map((x: unknown) => String(x).trim()).filter(Boolean)
            : prev.offer,
          about: body.about !== undefined ? String(body.about || '') : prev.about,
        }),
        workFormat: String(body.workFormat || 'offline'),
        city: body.city ? String(body.city) : null,
        ageMin: body.ageMin != null ? Number(body.ageMin) : null,
        ageMax: body.ageMax != null ? Number(body.ageMax) : null,
        minReliability: Number(body.minReliability ?? 0),
        minSocial: Number(body.minSocial ?? 0),
        needInstructions: body.needInstructions !== false,
        seats: body.seats != null ? Number(body.seats) : null,
        status: String(body.status || 'DRAFT'),
        screenPassScore: Number(body.screenPassScore ?? 70),
        opensAt: body.opensAt ? new Date(body.opensAt) : null,
        closesAt: body.closesAt ? new Date(body.closesAt) : null,
      };
      if (!data.title) return NextResponse.json({ message: 'Укажите название' }, { status: 400 });
      const row = id
        ? await prisma.vacancy.update({ where: { id }, data })
        : await prisma.vacancy.create({ data });

      if (Array.isArray(body.questions)) {
        await prisma.vacancyQuestion.deleteMany({ where: { vacancyId: row.id } });
        for (let i = 0; i < body.questions.length; i++) {
          const q = body.questions[i];
          await prisma.vacancyQuestion.create({
            data: {
              vacancyId: row.id,
              kind: String(q.kind || 'single'),
              prompt: String(q.prompt || ''),
              optionsJson: q.options ? JSON.stringify(q.options) : null,
              correctJson: q.correct !== undefined ? JSON.stringify(q.correct) : null,
              weight: Number(q.weight || 1),
              knockout: Boolean(q.knockout),
              sortOrder: i,
            },
          });
        }
      }
      return NextResponse.json({ vacancy: row });
    }

    if (action === 'reviewApplication') {
      const id = String(body.id || '');
      const status = String(body.status || '');
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ message: 'Некорректный статус' }, { status: 400 });
      }
      const app = await prisma.vacancyApplication.update({
        where: { id },
        data: {
          status,
          rejectReason: body.rejectReason ? String(body.rejectReason) : null,
          reviewedAt: new Date(),
          reviewedById: session.user.id,
        },
      });
      if (status === 'APPROVED') {
        await bumpEcoPoints(app.userId, ECO.VACANCY_APPROVED || 25, 'vacancy_approved', {
          vacancyId: app.vacancyId,
        }).catch(() => null);
        await bumpSocialScore(app.userId, 2, 'vacancy_approved').catch(() => null);
        await evaluateAchievements(app.userId).catch(() => null);
        await createUserNotification({
          userId: app.userId,
          type: 'VACANCY',
          title: 'Отклик одобрен',
          body: 'Вас пригласили на следующий этап по вакансии',
          meta: { href: `/vacancies/${app.vacancyId}` },
        }).catch(() => null);
      } else {
        await createUserNotification({
          userId: app.userId,
          type: 'VACANCY',
          title: 'Отклик не принят',
          body: body.rejectReason
            ? String(body.rejectReason).slice(0, 180)
            : 'По этой вакансии пока другое решение. Можно смотреть новые предложения.',
          meta: { href: `/vacancies/${app.vacancyId}` },
        }).catch(() => null);
      }
      return NextResponse.json({ application: app });
    }

    if (action === 'setEmployerStatus') {
      const id = String(body.id || '');
      const status = String(body.status || '');
      const row = await prisma.employer.update({
        where: { id },
        data: {
          status,
          rejectReason: body.rejectReason ? String(body.rejectReason) : null,
        },
      });
      return NextResponse.json({ employer: row });
    }

    return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return aclJsonError(e);
  }
}

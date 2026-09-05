import Link from 'next/link';
import { ArrowLeft, Calendar, ExternalLink, HeartHandshake, MapPin, Users, Wallet } from 'lucide-react';
import ApplyButton from '@/components/ApplyButton';
import ShareButton from '@/components/ShareButton';
import ContentRenderer from '@/components/ContentRenderer';
import {
  BODY_TYPE_LABELS,
  PROGRAM_KIND_META,
  formatProgramDate,
  programIsApplyOpen,
  programPublicPath,
  programStatusLabel,
  type ProgramKind,
} from '@/lib/programs';
import { programCover } from '@/lib/theme-covers';

type Program = {
  id: string;
  kind: string;
  title: string;
  summary: string | null;
  description: string;
  image: string | null;
  status: string;
  organizer: string | null;
  place: string | null;
  externalUrl: string | null;
  amountLabel: string | null;
  bodyType: string | null;
  seats: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
};

export default function ProgramDetailView({
  program,
  applicationStatus,
  approvedCount,
}: {
  program: Program;
  applicationStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedCount: number;
}) {
  const kind = program.kind as ProgramKind;
  const meta = PROGRAM_KIND_META[kind];
  const seatsLeft =
    typeof program.seats === 'number' ? Math.max(0, program.seats - approvedCount) : null;
  const seatsGone = seatsLeft === 0;
  const canApply = programIsApplyOpen(program.status, program.endsAt) && !seatsGone;
  const statusLabel = seatsGone ? 'Мест нет' : programStatusLabel(program.status, program.endsAt);
  const ends = formatProgramDate(program.endsAt);
  const starts = formatProgramDate(program.startsAt);
  const body = program.bodyType ? BODY_TYPE_LABELS[program.bodyType] : null;

  const cover = programCover(program, 0);

  return (
    <div className={`prog-detail prog-detail--${kind.toLowerCase()}`}>
      <div className="prog-hero" style={{ backgroundImage: `url(${cover})` }}>
        <div className="prog-hero__shade" />
        <div className="container prog-hero__bar">
          <Link href={programPublicPath(kind)} className="prog-hero__back">
            {kind === 'DOBRO' ? <HeartHandshake size={16} aria-hidden /> : <ArrowLeft size={18} />}
            {meta.title}
          </Link>
          <ShareButton title={program.title} />
        </div>
        <div className="container prog-hero__copy">
          <span className={`prog-pill${canApply ? ' is-open' : ' is-closed'}`}>{statusLabel}</span>
          <h1>{program.title}</h1>
          {program.summary ? <p>{program.summary}</p> : null}
        </div>
      </div>

      <div className="container prog-detail__body">
        <div className="prog-detail__grid">
          <div className="prog-article">
            <ContentRenderer content={program.description} template="DEFAULT" />
          </div>

          <aside className="prog-aside">
            <h2>Условия</h2>
            <ul className="prog-facts">
              {program.organizer ? (
                <li>
                  <strong>Организатор</strong>
                  <span>{program.organizer}</span>
                </li>
              ) : null}
              {program.amountLabel ? (
                <li>
                  <Wallet size={16} aria-hidden /> {program.amountLabel}
                </li>
              ) : null}
              {starts ? (
                <li>
                  <Calendar size={16} aria-hidden /> Старт: {starts}
                </li>
              ) : null}
              {ends ? (
                <li>
                  <Calendar size={16} aria-hidden />
                  {kind === 'GRANT' ? `Дедлайн: ${ends}` : `До: ${ends}`}
                </li>
              ) : null}
              {program.place ? (
                <li>
                  <MapPin size={16} aria-hidden /> {program.place}
                </li>
              ) : null}
              {body ? (
                <li>
                  <strong>Формат</strong> {body}
                </li>
              ) : null}
              {typeof program.seats === 'number' ? (
                <li>
                  <Users size={16} aria-hidden />
                  {seatsLeft != null ? `Свободно мест: ${seatsLeft} из ${program.seats}` : `Мест: ${program.seats}`}
                </li>
              ) : null}
            </ul>

            {program.externalUrl ? (
              <a href={program.externalUrl} target="_blank" rel="noreferrer" className="btn btn-secondary prog-ext">
                {/dobro\.ru/i.test(program.externalUrl) ? 'Добро.ру' : 'Внешняя ссылка'}{' '}
                <ExternalLink size={16} />
              </a>
            ) : null}

            <div className="prog-aside__apply">
              {canApply || applicationStatus !== 'NONE' ? (
                <ApplyButton
                  programId={program.id}
                  initialStatus={applicationStatus}
                  withMessage
                  applyLabel={meta.applyLabel}
                  approvedLabel={meta.approvedLabel}
                  messagePlaceholder={
                    kind === 'GRANT'
                      ? 'Кратко о проекте и команде (необязательно)'
                      : kind === 'DOBRO'
                        ? 'Опыт, удобные даты смен (необязательно)'
                        : 'О себе и направлении интересов (необязательно)'
                  }
                />
              ) : (
                <p className="prog-aside__closed">
                  Набор сейчас закрыт. Следите за обновлениями в разделе «{meta.title}».
                </p>
              )}
            </div>

            <p className="prog-aside__note">
              Заявки рассматривает администратор. Статус — в{' '}
              <Link href="/dashboard/applications">кабинете → Заявки</Link>.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

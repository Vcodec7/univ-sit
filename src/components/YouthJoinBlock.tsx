import { parseStudioJson } from '@/lib/youth-studio';
import { EntityApplyStatus } from '@/components/entity/EntityAuthIslands';

export default function YouthJoinBlock({
  kind,
  id,
  open,
  studioJson,
  signupUrl,
  curatorName,
  curatorContact,
  curatorPublic,
}: {
  kind: 'project' | 'club';
  id: string;
  open: boolean;
  studioJson?: string | null;
  signupUrl?: string | null;
  curatorName?: string | null;
  curatorContact?: string | null;
  curatorPublic?: boolean;
}) {
  const s = parseStudioJson(studioJson);
  const url = s.signupUrl || signupUrl || '';
  const name = s.curatorName || curatorName || '';
  const contact = curatorPublic === false ? '' : s.curatorContact || curatorContact || '';
  const mode = s.joinMode;
  if (!open && mode !== 'none') return null;
  return (
    <aside className="youth-join-block">
      <h2>Как вступить</h2>
      {s.howToJoin ? <p>{s.howToJoin}</p> : null}
      {s.audience ? (
        <p>
          <strong>Кому:</strong> {s.audience}
        </p>
      ) : null}
      {s.whatHappens ? (
        <p>
          <strong>Что будет:</strong> {s.whatHappens}
        </p>
      ) : null}
      {name ? (
        <p>
          <strong>Ведёт:</strong> {name}
          {contact ? ` · ${contact}` : ''}
        </p>
      ) : null}
      {mode === 'link' && url ? (
        <a className="btn btn-primary" href={url} target="_blank" rel="noreferrer">
          Записаться
        </a>
      ) : null}
      {mode === 'apply' || !mode ? <EntityApplyStatus kind={kind} id={id} open={open} /> : null}
      {mode === 'open' ? <p className="youth-join-block__open">Можно приходить без записи.</p> : null}
      {mode === 'none' ? <p>Сейчас набор не идёт — можно следить за обновлениями.</p> : null}
    </aside>
  );
}

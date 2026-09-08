'use client';

import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { simpleTextForHeading } from '@/lib/legal-plain';

type Section = { id: string; title: string; html: string; simple: string | null };

function sectionsFromHtml(html: string): Section[] {
  const parts = html.split(/<h2\b/i);
  const sections: Section[] = [];
  if (parts[0]?.trim()) {
    sections.push({
      id: 's-lead',
      title: 'Введение',
      html: parts[0],
      simple: null,
    });
  }
  for (let i = 1; i < parts.length; i += 1) {
    const chunk = `<h2${parts[i]}`;
    const idMatch = chunk.match(/id="([^"]+)"/i);
    const titleMatch = chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const title = (titleMatch?.[1] || `Раздел ${i}`).replace(/<[^>]+>/g, '').trim();
    const id = idMatch?.[1] || `s-${i}`;
    sections.push({
      id,
      title,
      html: chunk,
      simple: simpleTextForHeading(title),
    });
  }
  return sections;
}

export default function LegalInteractive({ html }: { html: string }) {
  const sections = useMemo(() => sectionsFromHtml(html), [html]);
  const [human, setHuman] = useState(false);
  const [q, setQ] = useState('');
  const [hitId, setHitId] = useState<string | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(sections, {
        keys: ['title', 'html'],
        threshold: 0.34,
        ignoreLocation: true,
      }),
    [sections]
  );

  function search(value: string) {
    setQ(value);
    const needle = value.trim();
    if (needle.length < 2) {
      setHitId(null);
      return;
    }
    const found = fuse.search(needle)[0]?.item;
    if (!found) return;
    setHitId(found.id);
    const el = document.getElementById(found.id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="legal-interactive">
      <div className="legal-toolbar">
        <label className="legal-toggle">
          <input
            type="checkbox"
            checked={human}
            onChange={(e) => setHuman(e.target.checked)}
          />
          <span>Человеческий язык</span>
        </label>
        <input
          type="search"
          className="legal-search"
          placeholder="Поиск по документу"
          value={q}
          onChange={(e) => search(e.target.value)}
          aria-label="Поиск по документу"
        />
      </div>
      <div className="legal-prose">
        {sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className={hitId === s.id ? 'legal-flash' : undefined}
          >
            {human && s.simple ? (
              <>
                <h2>{s.title}</h2>
                <p className="legal-simple">{s.simple}</p>
              </>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: s.html }} />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

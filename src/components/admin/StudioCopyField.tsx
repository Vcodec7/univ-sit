'use client';

import { useId, useRef } from 'react';

type Props = {
  name: string;
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
  placeholder?: string;
};

/** Preset chips plus a free-text “свой вариант” for studio copy. */
export default function StudioCopyField({ name, label, value, options, onChange, placeholder }: Props) {
  const areaId = useId();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const matched = options.includes(value);
  const ownOn = Boolean(value.trim()) && !matched;

  const pick = (opt: string) => {
    onChange(value === opt ? '' : opt);
  };

  const own = () => {
    if (matched) onChange('');
    window.setTimeout(() => areaRef.current?.focus(), 0);
  };

  return (
    <div className="admin-studio__field studio-copy">
      <span>{label}</span>
      <div className="studio-copy__chips" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={value === opt ? 'is-on' : ''}
            onClick={() => pick(opt)}
          >
            {opt}
          </button>
        ))}
        <button type="button" className={`is-own${ownOn ? ' is-on' : ''}`} onClick={own}>
          Свой вариант
        </button>
      </div>
      <textarea
        ref={areaRef}
        id={areaId}
        name={name}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Или коротко своими словами'}
      />
    </div>
  );
}

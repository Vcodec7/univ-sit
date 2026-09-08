'use client';

import { FEATURE_CONSENT_COPY, type FeatureConsentKey } from '@/lib/feature-consents';

export default function FeatureConsentModal({
  feature,
  busy,
  onAccept,
  onClose,
}: {
  feature: FeatureConsentKey;
  busy?: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const copy = FEATURE_CONSENT_COPY[feature];
  return (
    <div className="feature-consent" role="dialog" aria-modal="true" aria-labelledby="feature-consent-title">
      <div className="feature-consent__card">
        <h2 id="feature-consent-title">{copy.title}</h2>
        <ul>
          {copy.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="feature-consent__actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onAccept}>
            {busy ? 'Сохранение…' : 'Понятно'}
          </button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}

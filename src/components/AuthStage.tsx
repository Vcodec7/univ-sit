import type { CSSProperties, ReactNode } from 'react';

/** Centered auth layout: form + brand panel, like typical sign-in pages. */
export default function AuthStage({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="yp-auth-shell" style={style}>
      <div className="yp-auth-stage">
        <aside className="yp-auth-aside" aria-hidden="true">
          <div className="yp-auth-aside__veil" />
          <div className="yp-auth-aside__copy">
            <p className="yp-auth-aside__kicker">Официальный портал</p>
            <p className="yp-auth-aside__title">Молодёжь Сочи</p>
            <p className="yp-auth-aside__lead">Свободные залы, коворкинг и афиша — без лишних шагов.</p>
          </div>
        </aside>
        {children}
      </div>
    </div>
  );
}

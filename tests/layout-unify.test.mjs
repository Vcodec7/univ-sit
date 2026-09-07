import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('layout unify is last-win and catalog header wraps', () => {
  const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
  const css = readFileSync(join(root, 'src/app/layout-unify.css'), 'utf8');
  assert.match(layout, /layout-unify\.css/);
  assert.ok(layout.indexOf('layout-unify.css') > layout.indexOf('globals.css'));
  assert.ok(layout.indexOf('layout-unify.css') > layout.indexOf('theme.css'));
  assert.match(css, /align-self:\s*center/);
  assert.match(css, /background:\s*transparent\s*!important/);
  assert.match(css, /#afca03/);
  assert.match(css, /#eef6fb/);
  assert.match(css, /#f5fbfe/);
  assert.match(css, /\.glass-nav-end \.nav-icon-btn/);
  assert.match(css, /\.yp-profile__top/);
  assert.match(css, /backdrop-filter:\s*none/);
  assert.match(css, /:has\(>\s*\.home-rail-nav\)/);
  assert.match(css, /catalog-page-header__intro/);
  assert.match(css, /flex-wrap: wrap/);
  assert.match(css, /--yp-hero-h: calc\(100svh/);
  assert.match(css, /--rail-peek/);
  assert.match(css, /status actions/);
  assert.match(css, /cw-cabinet-pill__actions/);
  assert.match(css, /dashboard-showcase/);
  assert.match(css, /yp-cards--sochi/);
  assert.match(css, /profile-consent/);
  assert.match(css, /dashboard-page \.messages-root/);
  assert.match(css, /admin-nav-card/);
  assert.match(css, /--yp-shell/);
  assert.match(css, /dashboard-page\.container/);
  assert.match(css, /catalog-page/);
  assert.match(css, /gov-strip-actions/);
  assert.match(css, /object-position:\s*center 58%/);
  assert.match(css, /transform:\s*none\s*!important/);
  assert.match(css, /a\.lift-hero__btn--lime:hover/);
  assert.match(css, /home-cta-split article:last-child/);
  assert.match(css, /a\.home-section-link:hover/);
  assert.match(css, /\.glass-nav-inner/);
  assert.match(css, /overflow:\s*visible\s*!important/);
  assert.match(css, /\.nav-dropdown-bridge/);
  assert.match(css, /\.home-page--lift \.free-now-actions \{/);
  assert.match(css, /min-width:\s*13\.75rem/);
  assert.match(css, /\.nav-item:hover \.dropdown/);
  assert.match(css, /\.desktop-nav \{/);
  assert.match(css, /overflow:\s*hidden\s*!important/);
});

test('globals container uses the shared shell token', () => {
  const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
  assert.match(globals, /--yp-shell:\s*72rem/);
  assert.match(globals, /\.container \{[\s\S]*?max-width:\s*var\(--yp-shell\)/);
});

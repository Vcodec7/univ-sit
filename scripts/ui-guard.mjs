#!/usr/bin/env node
/**
 * Cheap static guards for UI regressions the product owner keeps reporting.
 * Exit 1 if a known-bad pattern is the last winning rule.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8');
const layoutSrc = fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8');
const providers = fs.readFileSync(path.join(root, 'src/components/Providers.tsx'), 'utf8');
const gamesCss = fs.readFileSync(path.join(root, 'src/app/games/games.css'), 'utf8');

const fails = [];

function lastMatch(src, re) {
  const all = [...src.matchAll(re)];
  return all.length ? all[all.length - 1][0] : '';
}

const navBlock = lastMatch(
  css,
  /\.glass-nav\s*\{[^}]+\}/g
);
if (navBlock && /border-bottom\s*:\s*1px/i.test(navBlock) && !/border-bottom\s*:\s*0/i.test(navBlock)) {
  fails.push('glass-nav again has a 1px border-bottom (strip under header)');
}

if (/<QuickAccess/.test(providers)) {
  fails.push('QuickAccess V-panel must not be mounted in Providers');
}

if (!gamesCss.includes('games-root.is-hub') || !gamesCss.includes('games-root.is-play')) {
  fails.push('games.css must distinguish is-hub vs is-play so site chrome stays on /games');
}

const brandCta = lastMatch(css, /\.svc-pill--brand[\s\S]{0,280}/g);
if (brandCta && /color\s*:\s*var\(--primary/i.test(brandCta) && !/color\s*:\s*#fff/i.test(brandCta)) {
  fails.push('svc-pill--brand looks low-contrast (purple on purple)');
}

const navEndSmear = lastMatch(
  css,
  /@media \(min-width: 901px\)\s*\{\s*\.glass-nav-end\s*\{[^}]+\}/g
);
if (navEndSmear && /#fff/.test(navEndSmear) && /box-shadow/.test(navEndSmear)) {
  fails.push('desktop .glass-nav-end still paints a white smear over header icons');
}

if (!/layout-unify\.css/.test(layoutSrc)) {
  fails.push('app/layout.tsx must import layout-unify.css after globals');
}

if (!/html\.is-admin \.glass-nav/.test(css)) {
  fails.push('html.is-admin must hide public glass-nav before body exists');
}

if (/font-size:\s*1\.12rem !important/.test(css) && /page-hero-title/.test(css)) {
  const tinyTitle = lastMatch(
    css,
    /\.page-hero-title[\s\S]{0,220}font-size:\s*1\.12rem !important/g
  );
  if (tinyTitle) fails.push('page titles still forced to 1.12rem on mobile');
}

const lastRailNav = lastMatch(css, /\.home-rail-nav\s*\{[^}]+\}/g);
if (lastRailNav && /position\s*:\s*absolute/i.test(lastRailNav) && !/static/i.test(lastRailNav)) {
  fails.push('home-rail-nav is absolutely over cards');
}

const unify = fs.readFileSync(path.join(root, 'src/app/layout-unify.css'), 'utf8');
if (!/\.glass-nav-inner[\s\S]{0,120}overflow:\s*visible\s*!important/.test(unify)) {
  fails.push('glass-nav-inner must stay overflow:visible so header menus are not clipped');
}
if (!/\.nav-item:hover \.dropdown[\s\S]{0,40}display:\s*none/.test(unify)) {
  fails.push('nav hover must not paint a clipped dropdown sliver');
}
if (!/\.nav-dropdown-bridge/.test(unify)) {
  fails.push('header dropdown must include a hover bridge so the menu stays open');
}
if (!/\.desktop-nav[\s\S]{0,80}overflow:\s*hidden\s*!important/.test(unify)) {
  fails.push('desktop-nav must clip extra links so they do not cover Запись');
}
if (!/\.nav-dropdown-portal\.dropdown[\s\S]{0,180}left:\s*auto/.test(unify)) {
  fails.push('header dropdown portal must not default to left:0');
}
if (!/\.home-page--lift \.free-now-actions[\s\S]{0,80}grid-template-columns:\s*1fr\s*!important/.test(unify)) {
  fails.push('home feed card actions must stack at equal width');
}
if (!/\.sochi-sky \{\s*display:\s*none\s*!important/.test(unify)) {
  fails.push('phone layout must hide living-sky compositor layers');
}

if (fails.length) {
  console.error('ui-guard FAIL');
  for (const f of fails) console.error(' -', f);
  process.exit(1);
}
console.log('ui-guard OK');

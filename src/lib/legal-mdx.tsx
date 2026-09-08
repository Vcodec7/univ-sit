import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { LegalClause } from '@/components/LegalClause';
import type { LegalTocItem } from '@/components/LegalDocShell';

const ROOT = join(process.cwd(), 'content/legal');

export type LegalDocSlug = 'privacy' | 'rules' | 'terms';

export function legalMdxPath(slug: LegalDocSlug, variant: 'current' | 'previous' = 'current') {
  const name = variant === 'previous' ? `${slug}.v1.mdx` : `${slug}.mdx`;
  return join(ROOT, name);
}

export function readLegalMdx(slug: LegalDocSlug, variant: 'current' | 'previous' = 'current') {
  return readFileSync(legalMdxPath(slug, variant), 'utf8');
}

export function tocFromMdx(source: string): LegalTocItem[] {
  const toc: LegalTocItem[] = [];
  const re = /id="([^"]+)"[\s\S]{0,80}?title="([^"]+)"|title="([^"]+)"[\s\S]{0,80}?id="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const id = m[1] || m[4];
    const title = m[2] || m[3];
    if (id && title) toc.push({ id, title });
  }
  return toc;
}

export function legalPlainFromMdx(source: string) {
  return source
    .replace(/<LegalClause\b[^>]*legalText="([^"]*)"[^>]*\/>/g, '$1\n')
    .replace(/<LegalClause[\s\S]*?legalText="([^"]*)"[\s\S]*?\/>/g, '$1\n')
    .replace(/legalText="([^"]*)"/g, '$1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/#+\s+/g, '')
    .trim();
}

const components = { LegalClause };

export function LegalMdxBody({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />;
}

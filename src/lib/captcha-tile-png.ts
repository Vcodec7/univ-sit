import sharp from 'sharp';

/** Geometric SVG tiles — no Unicode in the PNG, no emoji fonts required. */
const SVG: Record<string, string> = {
  'tree-a': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#e8f5e9"/><polygon points="64,16 18,98 110,98" fill="#2e7d32"/><rect x="56" y="92" width="16" height="22" fill="#5d4037"/></svg>`,
  'tree-b': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#e0f2f1"/><polygon points="64,10 28,52 100,52" fill="#1b5e20"/><polygon points="64,36 22,88 106,88" fill="#2e7d32"/><rect x="58" y="86" width="12" height="28" fill="#4e342e"/></svg>`,
  'tree-c': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#fff8e1"/><ellipse cx="64" cy="58" rx="38" ry="40" fill="#43a047"/><rect x="58" y="90" width="12" height="26" fill="#6d4c41"/><circle cx="48" cy="48" r="10" fill="#81c784"/></svg>`,
  'car-a': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#e3f2fd"/><rect x="18" y="58" width="92" height="32" rx="10" fill="#1565c0"/><rect x="38" y="42" width="48" height="22" rx="6" fill="#1e88e5"/><circle cx="38" cy="94" r="12" fill="#263238"/><circle cx="90" cy="94" r="12" fill="#263238"/></svg>`,
  'car-b': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#fffde7"/><rect x="16" y="54" width="96" height="34" rx="12" fill="#f9a825"/><rect x="34" y="40" width="52" height="20" rx="6" fill="#fdd835"/><circle cx="40" cy="92" r="12" fill="#212121"/><circle cx="88" cy="92" r="12" fill="#212121"/></svg>`,
  'house-a': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#fce4ec"/><polygon points="64,18 16,62 112,62" fill="#c62828"/><rect x="28" y="60" width="72" height="50" fill="#ef9a9a"/><rect x="54" y="78" width="20" height="32" fill="#6d4c41"/></svg>`,
  'house-b': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#eceff1"/><rect x="24" y="28" width="80" height="80" fill="#546e7a"/><rect x="34" y="40" width="18" height="18" fill="#bbdefb"/><rect x="76" y="40" width="18" height="18" fill="#bbdefb"/><rect x="34" y="70" width="18" height="18" fill="#bbdefb"/><rect x="76" y="70" width="18" height="18" fill="#bbdefb"/></svg>`,
  'cat-a': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#fff3e0"/><circle cx="64" cy="70" r="32" fill="#ffb74d"/><polygon points="36,48 40,18 58,48" fill="#ffb74d"/><polygon points="92,48 88,18 70,48" fill="#ffb74d"/><circle cx="52" cy="66" r="5" fill="#4e342e"/><circle cx="76" cy="66" r="5" fill="#4e342e"/></svg>`,
  'cat-b': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#fff8e1"/><ellipse cx="64" cy="78" rx="36" ry="24" fill="#fb8c00"/><circle cx="64" cy="48" r="22" fill="#fb8c00"/><circle cx="56" cy="46" r="4" fill="#3e2723"/><circle cx="74" cy="46" r="4" fill="#3e2723"/><path d="M40 36 L48 52 L32 52 Z" fill="#e65100"/><path d="M88 36 L96 52 L80 52 Z" fill="#e65100"/></svg>`,
  'sun-a': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#e1f5fe"/><circle cx="64" cy="64" r="28" fill="#fdd835"/><rect x="60" y="8" width="8" height="20" fill="#f9a825"/><rect x="60" y="100" width="8" height="20" fill="#f9a825"/><rect x="8" y="60" width="20" height="8" fill="#f9a825"/><rect x="100" y="60" width="20" height="8" fill="#f9a825"/></svg>`,
  'star-a': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#e8eaf6"/><polygon points="64,16 76,52 114,52 84,74 96,110 64,88 32,110 44,74 14,52 52,52" fill="#5c6bc0"/></svg>`,
  'fish-a': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#e0f7fa"/><ellipse cx="58" cy="64" rx="36" ry="22" fill="#00838f"/><polygon points="94,64 118,42 118,86" fill="#006064"/><circle cx="42" cy="60" r="5" fill="#fff"/></svg>`,
};

export async function captchaTilePng(poolId: string): Promise<Buffer> {
  const svg = SVG[poolId] || SVG['star-a'];
  return sharp(Buffer.from(svg)).png().toBuffer();
}

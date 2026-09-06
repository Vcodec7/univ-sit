/** Daytime Sochi sea — default public homepage poster (not the night festival still). */
export const HOME_LIGHT_HERO = '/covers/photo/sochi-sea.jpg';

const DARK_OR_EMPTY =
  /^$|\/brand\/hero-cover\.jpg$|\/covers\/photo\/city-night\.jpg$/i;

/** Prefer a bright coastline still when settings still point at the night cover. */
export function resolveHomeHeroPoster(url?: string | null) {
  const u = String(url || '').trim();
  if (DARK_OR_EMPTY.test(u)) return HOME_LIGHT_HERO;
  return u;
}

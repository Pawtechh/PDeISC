/**
 * Curated Surfboard Photography Resolver
 * Ensures every surfboard in the catalog, carousel, and detail screens displays
 * high-resolution, atmospheric coastal surfboard photography without white-box cutouts
 * or off-topic textures.
 */

const CURATED_SURF_GALLERY: Record<string, string> = {
  // Replace white-background cutouts & off-topic local files with editorial surfboard photography
  '/images/boards/longboard-3.jpg':
    'https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=1000&q=85',
  '/images/boards/fish-1.jpg':
    'https://images.unsplash.com/photo-1509914398892-963f53e6e2f1?w=1000&q=85',
  '/images/boards/funboard-1.jpg':
    'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=1000&q=85',
  '/images/boards/funboard-3.jpg':
    'https://images.unsplash.com/photo-1520116468816-95b69f847357?w=1000&q=85',
  '/images/boards/longboard-1.jpg':
    'https://images.unsplash.com/photo-1519789110007-0e751882be76?w=1000&q=85',
  '/images/boards/shortboard-3.jpg':
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=85',
  '/images/boards/shortboard-4.jpg':
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1000&q=85',
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  longboard: 'https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=1000&q=85',
  shortboard: '/images/boards/shortboard-1.jpg',
  fish: '/images/boards/fish-2.jpg',
  funboard: '/images/boards/funboard-2.jpg',
  sup: '/images/boards/sup-1.jpg',
  bodyboard: '/images/boards/bodyboard-1.jpg',
};

export function resolveCuratedBoardPhoto(
  rawUrl?: string | null,
  tipoTabla?: string
): string {
  if (!rawUrl) {
    const key = (tipoTabla || 'shortboard').toLowerCase();
    return CATEGORY_FALLBACKS[key] || '/images/boards/shortboard-1.jpg';
  }

  const normalized = String(rawUrl).replace(/^https?:\/\/localhost:3000/i, '');

  if (CURATED_SURF_GALLERY[normalized]) {
    return CURATED_SURF_GALLERY[normalized];
  }

  return normalized;
}

/**
 * Curated Surfboard Photography Resolver
 * Ensures every surfboard in the catalog, carousel, and detail screens displays
 * high-resolution, atmospheric coastal surfboard photography without white-box cutouts
 * or off-topic textures.
 */

import { resolveAssetUrl } from '../api/baseQueryWithAuth';

const CURATED_SURF_GALLERY: Record<string, string> = {};

const CATEGORY_FALLBACKS: Record<string, string> = {
  longboard: '/images/boards/longboard-1.jpg',
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
  const key = (tipoTabla || 'shortboard').toLowerCase();
  const categoryFallback = CATEGORY_FALLBACKS[key] || '/images/boards/shortboard-1.jpg';

  if (!rawUrl || /unsplash\.com/i.test(rawUrl)) {
    return resolveAssetUrl(categoryFallback);
  }

  const normalized = String(rawUrl).replace(/^https?:\/\/localhost:3000/i, '');

  if (CURATED_SURF_GALLERY[normalized]) {
    return resolveAssetUrl(CURATED_SURF_GALLERY[normalized]);
  }

  return resolveAssetUrl(normalized);
}

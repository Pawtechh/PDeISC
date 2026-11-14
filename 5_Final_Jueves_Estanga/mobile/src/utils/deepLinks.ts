import { Platform } from 'react-native';

export interface ParsedWebRoute {
  zoneSlug?: string;
  agencySlug?: string;
}

export function parseInitialWebRoute(): ParsedWebRoute {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return {};
  }

  const pathname = window.location.pathname || '/';
  const params = new URLSearchParams(window.location.search || '');

  const spotMatch = pathname.match(/^\/spot\/([a-zA-Z0-9_-]+)/);
  if (spotMatch?.[1]) {
    return { zoneSlug: decodeURIComponent(spotMatch[1]) };
  }

  const localMatch = pathname.match(/^\/local\/([a-zA-Z0-9_-]+)/);
  if (localMatch?.[1]) {
    return { agencySlug: decodeURIComponent(localMatch[1]) };
  }

  const spotQuery = params.get('spot')?.trim();
  const localQuery = params.get('local')?.trim();

  return {
    zoneSlug: spotQuery || undefined,
    agencySlug: localQuery || undefined,
  };
}

export function syncWebPath(options: { zoneSlug?: string | null; agencySlug?: string | null }) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.history?.replaceState) {
    return;
  }

  const currentPath = window.location.pathname || '/';
  if (currentPath.startsWith('/auth') || currentPath.startsWith('/manual') || currentPath.startsWith('/portal')) {
    return;
  }

  let nextPath = '/';
  if (options.agencySlug) {
    nextPath = `/local/${encodeURIComponent(options.agencySlug)}`;
  } else if (options.zoneSlug) {
    nextPath = `/spot/${encodeURIComponent(options.zoneSlug)}`;
  }

  if (window.location.pathname !== nextPath) {
    window.history.replaceState(null, '', nextPath);
  }
}

export function buildPublicShareUrl(kind: 'spot' | 'local', slug: string): string {
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : 'https://surfrental.app';
  return `${origin}/${kind}/${encodeURIComponent(slug)}`;
}

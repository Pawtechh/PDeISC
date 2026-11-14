import { createNavigationContainerRef } from '@react-navigation/native';

export const rootNavigationRef = createNavigationContainerRef<any>();

export function navigateSafe(routeName: string, params?: Record<string, any>) {
  if (rootNavigationRef.isReady()) {
    try {
      (rootNavigationRef as any).navigate(routeName, params);
    } catch {
      // Ignore transient navigation mismatch during auth role switch
    }
  }
}

export function extractActiveRouteName(state: any): string | null {
  if (!state || !Array.isArray(state.routes) || state.routes.length === 0) {
    return null;
  }
  const index = typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index];
  if (!route) return null;
  if (route.state) {
    return extractActiveRouteName(route.state) || route.name || null;
  }
  return route.name || null;
}

import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  numColumns: number;
}

/**
 * Hook para diseño responsive adaptativo
 * Breakpoints:
 * - mobile: < 768px (1 columna)
 * - tablet: 768px - 1024px (2 columnas)
 * - desktop: > 1024px (3 columnas)
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width <= 1024;
  const isDesktop = width > 1024;

  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    numColumns,
  };
}

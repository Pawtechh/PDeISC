export const colors = {
  coral: {
    300: '#FF9E88',
    400: '#FF7A59',
    500: '#FF5A36', // PRIMARY CORAL SUNSET
    600: '#E84522',
    700: '#C83212',
    border: 'rgba(255, 90, 54, 0.28)',
    glow: 'rgba(255, 90, 54, 0.24)',
    subtle: 'rgba(255, 90, 54, 0.12)',
  },
  ocean: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#00D2D3',
    500: '#06B6D4',
    600: '#0891B2', // CRISP AQUA SECONDARY
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  seafoam: {
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
  },
  sunset: {
    400: '#FBBF24',
    500: '#F59E0B', // WARM GOLD/SUNSET
    600: '#D97706',
  },
  sand: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    500: '#71717A',
    700: '#3F3F46',
    900: '#111115',
  },
  champagne: {
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warm refined golden amber
    600: '#D97706',
    border: 'rgba(251, 191, 36, 0.26)',
    glow: 'rgba(245, 158, 11, 0.20)',
    subtle: 'rgba(251, 191, 36, 0.10)',
  },
  neon: {
    cyan: '#00D2D3',
    bioluminescent: '#22D3EE',
    cyanGlow: 'rgba(0, 210, 211, 0.22)',
    cyanHighlight: 'rgba(0, 210, 211, 0.10)',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#00D2D3',
  },
  dark: {
    background: '#050507', // Pure Obsidian
    surface: '#111115',    // Smoked Charcoal Glass
    card: '#121216',
    champagne: '#FBBF24',
    primary: '#FF5A36',    // Coral Sunset
    primaryText: '#FFFFFF',
    text: '#F5F5F7',       // Apple Titanium White
    subtext: '#A1A1AA',    // Neutral Zinc Secondary
    sand: '#D4D4D8',
    border: 'rgba(255, 255, 255, 0.08)', // Neutral Hairline Glass Rim
    accent: '#00D2D3',     // Aqua Telemetry Secondary
    accentLight: 'rgba(0, 210, 211, 0.12)',
    cardHighlight: 'rgba(255, 255, 255, 0.04)',
    inputBg: 'rgba(255, 255, 255, 0.04)',
    inputBorder: 'rgba(255, 255, 255, 0.10)',
    glowChampagne: 'rgba(251, 191, 36, 0.18)',
    glowCyan: 'rgba(255, 90, 54, 0.20)',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;

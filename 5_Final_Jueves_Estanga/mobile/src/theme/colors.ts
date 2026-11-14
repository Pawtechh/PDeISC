export const colors = {
  coral: {
    300: '#F1A691',
    400: '#EA7D60',
    500: '#E06343', // Signature Sunlit Terracotta (Dark focal)
    600: '#C94A29', // Signature Fired Clay (Light focal — 4.92:1 contrast w/ white)
    700: '#A83A1E',
    border: 'rgba(224, 99, 67, 0.28)',
    glow: 'rgba(224, 99, 67, 0.18)',
    subtle: 'rgba(224, 99, 67, 0.11)',
  },
  ocean: {
    50: '#FAF8F4',
    100: '#F5F1EA', // Sunlit Coastal Travertine
    200: '#E8E2D7',
    300: '#CFC8BC',
    400: '#9E988D', // Weathered Limestone Chrome
    500: '#6F6A61',
    600: '#4E4A43', // Coastal Mineral Graphite
    700: '#35332F',
    800: '#2A2926',
    900: '#21201E',
  },
  seafoam: {
    300: '#84CBB8',
    400: '#52B097', // Coastal Sea-Kelp (Split-complement vs Terracotta)
    500: '#247360', // Deep Atlantic Kelp (5.4:1 contrast on light)
    600: '#1A5648',
  },
  sunset: {
    400: '#DBA84C', // Brushed Sun-Wax Brass (Dark)
    500: '#C68B2C',
    600: '#A4701C', // Deep Ochre Gold (4.6:1 contrast on light)
  },
  sand: {
    50: '#FAF8F4',
    100: '#F5F1EA',
    200: '#E8E2D7',
    300: '#D6CFC3',
    500: '#7A7368',
    700: '#4A463F',
    900: '#1C1B18',
  },
  champagne: {
    100: '#FAF0DA',
    200: '#F3DFB4',
    300: '#EAD094',
    400: '#DBA84C',
    500: '#C68B2C', // Warm brushed brass
    600: '#A4701C',
    border: 'rgba(219, 168, 76, 0.26)',
    glow: 'rgba(219, 168, 76, 0.15)',
    subtle: 'rgba(219, 168, 76, 0.10)',
  },
  neon: {
    cyan: '#9E988D',
    bioluminescent: '#B6B0A5',
    cyanGlow: 'rgba(158, 152, 141, 0.14)',
    cyanHighlight: 'rgba(158, 152, 141, 0.08)',
  },
  semantic: {
    success: '#247360',
    warning: '#A4701C',
    danger: '#B63933',
    info: '#3B657E',
  },
  dark: {
    background: '#21201E', // Warm Coastal Basalt Graphite (Lifted, never black)
    surface: '#2A2926',    // Elevated Mineral Stone
    card: '#2D2B28',
    champagne: '#DBA84C',
    primary: '#E06343',    // Sunlit Terracotta
    primaryText: '#FFFFFF',
    text: '#F5F2EC',       // Warm Chalk White (13.1:1 on card)
    subtext: '#B6B0A5',    // Driftwood Stone (6.7:1 on card)
    sand: '#D6CFC3',
    border: 'rgba(245, 242, 236, 0.09)',
    accent: '#9E988D',     // Weathered Mineral Chrome
    accentLight: 'rgba(158, 152, 141, 0.12)',
    cardHighlight: 'rgba(245, 242, 236, 0.05)',
    inputBg: '#35332F',
    inputBorder: 'rgba(245, 242, 236, 0.13)',
    glowChampagne: 'rgba(219, 168, 76, 0.14)',
    glowCyan: 'rgba(224, 99, 67, 0.18)',
  },
  white: '#FDFCFA',
  black: '#1C1B18',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;

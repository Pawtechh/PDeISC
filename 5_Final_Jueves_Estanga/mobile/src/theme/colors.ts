export const colors = {
  teal: {
    300: '#6BD4DC',
    400: '#51CCD5',
    500: '#38BDC7', // Signature Sea-Glass Teal (Dark focal — 6.43:1 on #232A2E, 8.05:1 w/ #0C1719 ink)
    600: '#0E6B74', // Signature Deep Atlantic Teal (Light focal — 6.22:1 contrast w/ #FFFFFF)
    700: '#08444A',
    border: 'rgba(14, 107, 116, 0.28)',
    glow: 'rgba(56, 189, 199, 0.20)',
    subtle: 'rgba(56, 189, 199, 0.12)',
  },
  ocean: {
    50: '#FCFCFA',
    100: '#F4F5F2', // Sunlit Salt-Chalk Limestone
    200: '#EAECE8', // Soft Fog Sand
    300: '#CBD2D4',
    400: '#9CAAB0', // Calm Coastal Sea-Slate Chrome
    500: '#5A676D',
    600: '#4A575D', // Mineral Slate Graphite
    700: '#2D363B',
    800: '#232A2E',
    900: '#1A1F22',
  },
  seafoam: {
    300: '#84DCC1',
    400: '#4FC3A1', // Coastal Sea-Kelp Mint
    500: '#1D6F5A', // Deep Atlantic Kelp (AA on light)
    600: '#155444',
  },
  sunset: {
    400: '#D9AE57', // Brushed Wax Brass (Dark)
    500: '#B8832A',
    600: '#9A6312', // Aged Ochre Brass (AA on light)
  },
  sand: {
    50: '#FCFCFA',
    100: '#F4F5F2',
    200: '#EAECE8',
    300: '#D4DBD8',
    500: '#5A676D',
    700: '#4A575D',
    900: '#131A1D',
  },
  champagne: {
    100: '#FAF0DA',
    200: '#F3DFB4',
    300: '#EAD094',
    400: '#D9AE57',
    500: '#B8832A', // Warm brushed wax brass
    600: '#9A6312',
    border: 'rgba(217, 174, 87, 0.28)',
    glow: 'rgba(217, 174, 87, 0.16)',
    subtle: 'rgba(217, 174, 87, 0.11)',
  },
  semantic: {
    success: '#1D6F5A',
    warning: '#9A6312',
    danger: '#B63933',
    info: '#2B5B78',
  },
  dark: {
    background: '#1A1F22', // Coastal Atlantic Slate (Lifted, calm, zero pitch black)
    surface: '#232A2E',    // Elevated Mineral Charcoal
    card: '#232A2E',
    champagne: '#D9AE57',
    primary: '#38BDC7',    // Sea-Glass Teal (6.43:1 on #232A2E)
    primaryText: '#0C1719', // Deep Abyssal Ink (8.05:1 contrast on #38BDC7)
    text: '#F2F5F4',       // Salt-Chalk White (15.16:1 on bg)
    subtext: '#B1BDC2',    // Mist Driftwood (7.9:1 on card)
    sand: '#D4DBD8',
    border: 'rgba(242, 245, 244, 0.09)',
    accent: '#9CAAB0',     // Calm Mineral Sea-Chrome
    accentLight: 'rgba(156, 170, 176, 0.13)',
    cardHighlight: 'rgba(242, 245, 244, 0.05)',
    inputBg: '#2D363B',
    inputBorder: 'rgba(242, 245, 244, 0.14)',
    glowChampagne: 'rgba(217, 174, 87, 0.15)',
    glowTeal: 'rgba(56, 189, 199, 0.20)',
  },
  white: '#FCFCFA',
  black: '#131A1D',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;

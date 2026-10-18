/** Design tokens from the Valley Ride style guide (canvas "Valley Ride app design"). */
export const colors = {
  ink: '#000000',
  surface: '#FFFFFF',
  canvas: '#ECEEF0',
  field: '#F4F6F8',
  fieldAlt: '#ECEEF2',
  line: '#E3E5E8',
  muted: '#66686B',
  body: '#3D3F42',
  dark: '#1B1B1B',
  heroBg: '#17181A',
  orange: '#F96407',
  orangeTint: '#FFF0E6',
  orangeInk: '#8A3600',
  disabled: '#B9BDC3',
} as const;

export const fonts = {
  regular: 'Urbanist_400Regular',
  medium: 'Urbanist_500Medium',
} as const;

/** Urbanist Regular and Medium only; sizes from the style guide. */
export const type = {
  hero: { fontFamily: fonts.regular, fontSize: 32, letterSpacing: -0.4, color: colors.ink },
  title: { fontFamily: fonts.regular, fontSize: 24, color: colors.ink },
  cardTitle: { fontFamily: fonts.regular, fontSize: 20, color: colors.ink },
  button: { fontFamily: fonts.regular, fontSize: 18 },
  body: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  label: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  price: { fontFamily: fonts.medium, fontSize: 22, color: colors.ink },
} as const;

export const radius = { card: 28, tile: 22, sheet: 32, hero: 36, pill: 999 } as const;
export const space = { gutter: 20 } as const;

/**
 * Palette lifted from the mascot art: pastel pink base, lilac accents,
 * warm white cards. Every colour here is used by more than one screen —
 * one-off tints belong in the component that needs them.
 */
export const colors = {
  // Backgrounds
  bg: '#FBEFFA',
  bgSoft: '#F6E6F8',
  card: '#FFFFFF',
  cardMuted: '#FDF6FD',

  // Brand
  pink: '#F5A9CB',
  pinkDeep: '#E87BA9',
  lilac: '#C9A7F0',
  lilacDeep: '#A87BE0',

  // Text
  text: '#4A3550',
  textSoft: '#8A7392',
  textFaint: '#B6A5BC',
  onBrand: '#FFFFFF',

  // Status
  good: '#7BC9A0',
  goodSoft: '#E4F5EC',
  warn: '#F0B65E',
  warnSoft: '#FCF0DC',
  bad: '#E8828A',
  badSoft: '#FBE7E9',

  // Lines
  border: '#EEDCF0',
  borderStrong: '#E0C6E6',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const type = {
  h1: { fontSize: 26, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 19, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
  small: { fontSize: 13, fontWeight: '500' as const, color: colors.textSoft },
  tiny: { fontSize: 11, fontWeight: '600' as const, color: colors.textFaint },
};

/** Soft lifted-card shadow. Android needs elevation, iOS needs the rest. */
export const shadow = {
  shadowColor: '#8A5FA0',
  shadowOpacity: 0.13,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

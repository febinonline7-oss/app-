/**
 * A deliberately dark palette: the app is used outdoors at night, where a
 * bright screen ruins dark adaptation for several minutes.
 */

export const colors = {
  background: '#05070f',
  surface: '#0d1220',
  surfaceRaised: '#141b2e',
  border: '#1f2942',
  text: '#e8ecf7',
  textMuted: '#8a95b0',
  textFaint: '#5a6480',
  accent: '#7aa2ff',
  /** Used for anything that should not wreck night vision. */
  nightSafe: '#ff6b5a',
  good: '#5ad6a0',
  warn: '#ffc75a',
  horizon: '#2a3552',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  label: { fontSize: 13, color: colors.textMuted },
  caption: { fontSize: 11, color: colors.textFaint },
  mono: { fontSize: 14, color: colors.text, fontVariant: ['tabular-nums' as const] },
};

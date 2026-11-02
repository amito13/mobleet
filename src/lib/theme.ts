export const colors = {
  background: '#0b0e14',
  foreground: '#e6edf3',
  muted: '#8b96a8',
  mutedDark: '#5b6577',
  comment: '#637083',

  // panels / editor chrome
  card: '#10141c',
  cardHeader: '#151b26',
  cardBorder: '#1f2633',
  borderStrong: '#2b3445',
  sheet: '#121721',
  backdrop: 'rgba(0, 0, 0, 0.65)',

  // brand + syntax accents
  lime: '#bdf06e',
  onLime: '#0b0e14',
  limeSoft: 'rgba(189, 240, 110, 0.12)',
  limeBorder: 'rgba(189, 240, 110, 0.35)',
  peach: '#ffb26b',
  mint: '#89ddff',
  keyword: '#c792ea',
  fn: '#82aaff',
  string: '#c3e88d',
  number: '#f78c6c',
  type: '#ffcb6b',

  // status
  success: '#86efac',
  successBg: 'rgba(134, 239, 172, 0.12)',
  warning: '#fdba74',
  warningBg: 'rgba(253, 186, 116, 0.12)',
  danger: '#fca5a5',
  dangerBg: 'rgba(252, 165, 165, 0.12)',
} as const

// Bundled JetBrains Mono (loaded in src/app/_layout.tsx). Use the weight-specific
// family instead of fontWeight/fontStyle — custom fonts don't synthesize them reliably.
export const fonts = {
  mono: 'JetBrainsMono_400Regular',
  monoItalic: 'JetBrainsMono_400Regular_Italic',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
} as const

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
} as const

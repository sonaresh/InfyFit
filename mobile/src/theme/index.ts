export const palette = {
  primary: '#12B76A',
  primaryDark: '#039855',
  primaryMuted: '#A6F4C5',
  background: '#0F172A',
  card: '#1E293B',
  surface: '#111827',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5F5',
  border: '#1F2937',
  error: '#F04438',
  warning: '#F59E0B',
  success: '#22C55E'
};

export const spacing = (multiplier = 1) => 8 * multiplier;

export const typography = {
  heading: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '700' as const,
    color: palette.textPrimary
  },
  subheading: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600' as const,
    color: palette.textPrimary
  },
  body: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    color: palette.textPrimary
  },
  caption: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400' as const,
    color: palette.textSecondary
  }
};

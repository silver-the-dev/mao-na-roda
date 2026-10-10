// Tema único do app: cores, espaçamentos, tipografia e raios.
// As cores foram escolhidas com contraste alto (texto ≥ 7:1 sobre o fundo).

export const colors = {
  primary: '#0B6B4F',
  primaryDark: '#064E3A',
  primarySoft: '#E3F2EC',
  onPrimary: '#FFFFFF',

  accent: '#F2A900',
  star: '#E89B00',
  starEmpty: '#C9CED6',

  background: '#F6F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF0EE',
  border: '#C9CED6',

  text: '#111827',
  textMuted: '#3F4754',
  textOnDark: '#FFFFFF',
  placeholder: '#6B7280',

  danger: '#B42318',
  dangerSoft: '#FDECEA',
  success: '#067647',
  successSoft: '#E6F4EC',
  warning: '#8A4B00',
  warningSoft: '#FFF4DB',
  info: '#1849A9',
  infoSoft: '#E8EFFC',
  neutral: '#3F4754',
  neutralSoft: '#ECEEF1',
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
  lg: 16,
  pill: 999,
};

export const typography = {
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { fontSize: 17, color: colors.text },
  bodyStrong: { fontSize: 17, fontWeight: '600', color: colors.text },
  small: { fontSize: 15, color: colors.textMuted },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  price: { fontSize: 20, fontWeight: '700', color: colors.primaryDark },
};

// Altura mínima de toque para botões e campos (botões grandes).
export const touch = {
  minHeight: 54,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

const theme = { colors, spacing, radius, typography, touch, shadow };
export default theme;

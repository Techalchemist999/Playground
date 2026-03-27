import { COLORS, TYPOGRAPHY, SPACING } from './tokens';

export const uppercaseLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.3,
  textTransform: 'uppercase',
  color: COLORS.mutedText,
};

export const cardStyle = {
  background: COLORS.cardBg,
  borderRadius: SPACING.cardRadius,
  border: `1px solid ${COLORS.cardBorder}`,
  boxShadow: SPACING.cardShadow,
};

export const gradientButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: COLORS.primaryGradient,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: `0 2px 8px ${COLORS.primaryShadow}`,
  fontFamily: TYPOGRAPHY.fontFamily,
};

export const outlineButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: 'transparent',
  color: COLORS.secondaryText,
  border: `1px solid ${COLORS.cardBorder}`,
  borderRadius: 8,
  padding: '8px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: TYPOGRAPHY.fontFamily,
};

export const pillStyle = (color, light, border, active = false) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 700,
  borderRadius: 999,
  padding: '3px 11px',
  border: `1.5px solid ${active ? color : border}`,
  background: active ? light : '#fff',
  color: active ? color : COLORS.secondaryText,
  cursor: 'pointer',
  transition: 'all .15s',
});

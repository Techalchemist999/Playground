import { COLORS, TYPOGRAPHY } from '../../styles/tokens';

export default function PageShell({ children }) {
  return (
    <div style={{
      fontFamily: TYPOGRAPHY.fontFamily,
      background: COLORS.bg,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      inset: 0,
    }}>
      {children}
    </div>
  );
}

// src/theme.js

export const colors = {
  primary: {
    berkeleyBlue: '#002B56',  // Main background
    springGreen: '#05F283',   // Success / Active states
    iris: '#5648B7',          // Accents / Buttons
    white: '#FFFFFF'          // Text
  },
  secondary: {
    electricBlue: '#27DEF2',  // Highlights / Hover effects
    blueNCS: '#028ECA',       // Links / Info
    tomato: '#FF5347',        // Errors / Warnings
    gold: '#FBD437',          // Stars / Premium features
    turquoise: '#41C9B9'      // Alt accents
  }
};

export const fonts = {
  main: "'Poppins', sans-serif"
};

// Common reusable styles
export const commonStyles = {
  pageContainer: {
    minHeight: '100vh',
    background: colors.primary.berkeleyBlue,
    color: colors.primary.white,
    fontFamily: fonts.main,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem'
  },
  card: {
    background: colors.primary.white,
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '600px',
    color: '#333' // Text inside white cards should be dark
  },
  primaryButton: {
    background: `linear-gradient(45deg, ${colors.primary.iris}, ${colors.secondary.electricBlue})`,
    border: 'none',
    color: colors.primary.white,
    padding: '12px 24px',
    borderRadius: '30px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    boxShadow: `0 4px 15px rgba(39, 222, 242, 0.4)`
  }
};
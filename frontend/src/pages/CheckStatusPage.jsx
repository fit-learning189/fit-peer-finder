import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors, fonts, ui } from '../theme';

const CheckStatusPage = () => {
  const [identifier, setIdentifier] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (identifier.trim()) {
      navigate(`/status/${identifier.trim()}`);
    }
  };

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() =>navigate('/')}>&larr; Back</button>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={styles.card}
      >
        <span style={styles.eyebrow}>Status Lookup</span>
        <h1 style={styles.title}>Check your match status</h1>
        <p style={styles.subtitle}>
          Enter your registered email address to view your active short-course pairings and queue requests.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <motion.input
            whileFocus={{ borderColor: colors.accent.azure }}
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) =>setIdentifier(e.target.value)}
            required
          />
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            type="submit"
            style={styles.button}
          >
            Check Status
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    ...ui.page,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
  },
  backBtn: {
    ...ui.btnGhost,
    position: 'absolute',
    top: '32px',
    left: '32px',
  },
  card: {
    ...ui.card,
    padding: '2.75rem',
    textAlign: 'center',
    maxWidth: '480px',
    width: '100%',
    boxShadow: colors.shadow.lg,
  },
  eyebrow: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: colors.accent.azureHi,
    marginBottom: '12px',
  },
  title: {
    color: colors.text.hi,
    fontSize: '1.9rem',
    fontWeight: 700,
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: colors.text.lo,
    marginBottom: '28px',
    lineHeight: 1.6,
    fontSize: '0.95rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { background: colors.surface.base, color: colors.text.hi,
    ...ui.input,
    padding: '14px 16px',
    textAlign: 'center',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
  },
  button: {
    ...ui.btnPrimary,
    padding: '14px',
    fontSize: '1rem',
  },
};

export default CheckStatusPage;

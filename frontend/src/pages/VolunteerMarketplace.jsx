import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { colors, fonts, ui } from '../theme';
import Spinner from '../components/Spinner';
import { API_URL } from '../config';

const PROGRAM_NAMES = { AIFW: 'AI Fluency for the Workplace' };

const VolunteerMarketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { program, course } = location.state || {};

  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!program || !course) {
      navigate('/');
    } else {
      fetchVolunteers();
    }
  }, [program, course, navigate]);

  const fetchVolunteers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/marketplace?program=${program}&course=${course}`);
      setVolunteers(res.data.success ? (res.data.volunteers || []) : []);
    } catch (err) {
      console.error('Error fetching marketplace data', err);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePairClick = (volunteerId) => {
    navigate('/register', {
      state: { program, course, connectionType: 'need', targetVolunteerId: volunteerId },
    });
  };

  const handleFallbackQueue = () => {
    navigate('/register', { state: { program, course, connectionType: 'need' } });
  };

  // Only surface volunteers who still have capacity
  const availableVolunteers = (volunteers || []).filter(
    (vol) => (parseInt(vol.current_load) || 0) < (parseInt(vol.capacity) || 3)
  );

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <button style={styles.backBtn} onClick={() =>navigate('/')}>&larr; Back to Home</button>
      </nav>

      <header style={styles.header}>
        <span style={styles.eyebrow}>Volunteer Marketplace</span>
        <h1 style={styles.title}>Find a volunteer for your short course</h1>
        <p style={styles.meta}>
          {PROGRAM_NAMES[program] || program}<span style={styles.metaDivider}>/</span>{course}
        </p>
        <p style={styles.subMeta}>Select an available volunteer to request support directly.</p>
      </header>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loadingWrap}>
            <Spinner size="44px" />
            <p style={styles.loadingText}>Checking for available volunteers</p>
          </div>
        ) : availableVolunteers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.emptyState}
          >
            <h3 style={styles.emptyTitle}>No volunteers currently available</h3>
            <p style={styles.emptyText}>
              Every volunteer for this short course is fully booked at the moment. Join the priority
              queue and you will be matched as soon as one frees up.
            </p>
            <button onClick={handleFallbackQueue} style={styles.primaryBtn}>
              Join the priority queue &rarr;
            </button>
          </motion.div>
        ) : (
          <div style={styles.grid}>
            {availableVolunteers.map((vol, index) => {
              const maxCap = parseInt(vol.capacity) || 3;
              const currentLoad = parseInt(vol.current_load) || 0;
              const progressPercent = Math.min((currentLoad / maxCap) * 100, 100);
              const remaining = maxCap - currentLoad;
              // The backend maps 'pseudonym' onto 'name' before sending it here,
              // so real volunteer names are never exposed in the marketplace.
              const pseudonym = vol.name || 'Volunteer';
              const initial = pseudonym.trim().charAt(0).toUpperCase() || 'V';

              return (
                <motion.div
                  key={vol.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.06, 0.4) }}
                  style={styles.card}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.avatar}>{initial}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h3 style={styles.cardName}>{pseudonym}</h3>
                      <span style={styles.courseBadge}>Completed {vol.course || course}</span>
                    </div>
                  </div>

                  <div style={styles.detailsGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>State</span>
                      <span style={styles.detailValue}>{vol.country || 'Anywhere in the US'}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Availability</span>
                      <span style={styles.detailValue}>{vol.availability || 'Flexible'}</span>
                    </div>
                  </div>

                  <div style={styles.capacitySection}>
                    <div style={styles.capacityRow}>
                      <span>Capacity</span>
                      <span style={styles.capacityCount}>{currentLoad} of {maxCap}</span>
                    </div>
                    <div style={styles.progressBarBg}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={styles.progressBarFill}
                      />
                    </div>
                    <span style={styles.capacityNote}>
                      {remaining} {remaining === 1 ? 'slot' : 'slots'} remaining
                    </span>
                  </div>

                  <button onClick={() =>handlePairClick(vol.id)} style={styles.pairBtn}>
                    Request support
                  </button>
                </motion.div>
              );
            })}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.fallbackCard}>
              <h4 style={styles.fallbackTitle}>Not seeing a fit?</h4>
              <p style={styles.fallbackText}>
                Join the queue and we will pair you with the next available volunteer automatically.
              </p>
              <button onClick={handleFallbackQueue} style={styles.fallbackBtn}>
                Join priority queue
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { ...ui.page, paddingBottom: '64px' },
  navbar: {
    padding: '1rem 2rem',
    background: colors.surface.raised,
    borderBottom: `1px solid ${colors.line.soft}`,
  },
  backBtn: { ...ui.btnGhost, padding: '8px 18px' },
  header: {
    padding: '56px 24px 40px',
    textAlign: 'center',
    maxWidth: '720px',
    margin: '0 auto',
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
    margin: '0 0 14px 0',
    color: colors.text.hi,
    fontSize: '2.1rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  meta: { margin: 0, color: colors.text.lo, fontSize: '1rem', fontWeight: 500 },
  metaDivider: { color: colors.text.mute, margin: '0 10px' },
  subMeta: { margin: '10px 0 0 0', color: colors.text.mute, fontSize: '0.9rem' },
  content: { padding: '0 24px', maxWidth: '1200px', margin: '0 auto' },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '48px',
    gap: '16px',
  },
  loadingText: { color: colors.text.lo, margin: 0, fontSize: '0.95rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: { ...ui.card, padding: '24px', display: 'flex', flexDirection: 'column' },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
    paddingBottom: '18px',
    borderBottom: `1px solid ${colors.line.soft}`,
  },
  avatar: {
    width: '52px',
    height: '52px',
    flexShrink: 0,
    borderRadius: '50%',
    background: colors.accent.azureSoft,
    border: `1px solid ${colors.accent.azure}`,
    color: colors.accent.azureHi,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  cardName: {
    margin: 0,
    color: colors.text.hi,
    fontSize: '1.1rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  courseBadge: {
    ...ui.badge,
    marginTop: '6px',
    background: colors.accent.limeSoft,
    color: colors.accent.limeHi,
    fontSize: '0.7rem',
  },
  detailsGrid: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: colors.surface.base,
    borderRadius: colors.radius.sm,
  },
  detailLabel: { fontSize: '0.78rem', color: colors.text.mute, fontWeight: 500 },
  detailValue: { fontSize: '0.85rem', color: colors.text.hi, fontWeight: 500, textAlign: 'right' },
  capacitySection: {
    marginBottom: '20px',
    padding: '14px',
    background: colors.surface.base,
    borderRadius: colors.radius.md,
    border: `1px solid ${colors.line.soft}`,
  },
  capacityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    marginBottom: '8px',
    color: colors.text.lo,
    fontWeight: 500,
  },
  capacityCount: { color: colors.text.hi, fontWeight: 600 },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: colors.line.soft,
    borderRadius: colors.radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: colors.radius.pill,
    background: `linear-gradient(90deg, ${colors.accent.lime}, ${colors.accent.limeHi})`,
  },
  capacityNote: {
    display: 'block',
    marginTop: '8px',
    fontSize: '0.75rem',
    color: colors.accent.limeHi,
    fontWeight: 500,
  },
  pairBtn: { ...ui.btnPrimary, width: '100%', marginTop: 'auto', padding: '13px' },
  primaryBtn: { ...ui.btnPrimary },
  emptyState: {
    ...ui.card,
    textAlign: 'center',
    padding: '48px 28px',
    maxWidth: '560px',
    margin: '0 auto',
  },
  emptyTitle: {
    color: colors.text.hi,
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '0 0 12px 0',
  },
  emptyText: { color: colors.text.lo, marginBottom: '26px', lineHeight: 1.6, fontSize: '0.95rem' },
  fallbackCard: {
    background: colors.surface.raised,
    border: `1px dashed ${colors.accent.rose}`,
    borderRadius: colors.radius.lg,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  fallbackTitle: { margin: '0 0 10px 0', color: colors.accent.roseHi, fontSize: '1rem', fontWeight: 600 },
  fallbackText: { margin: '0 0 18px 0', fontSize: '0.88rem', color: colors.text.lo, lineHeight: 1.6 },
  fallbackBtn: {
    ...ui.btnGhost,
    borderColor: colors.accent.rose,
    color: colors.accent.roseHi,
  },
};

export default VolunteerMarketplace;

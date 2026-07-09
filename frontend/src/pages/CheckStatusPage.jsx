import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors, fonts } from '../theme';

const CheckStatusPage = () => {
  const [inputIdx, setInputId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputIdx.trim()) {
      // Passes the email/ID directly to the new Status Dashboard
      navigate(`/status/${inputIdx.trim()}`);
    }
  };

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/')}>&larr; Back</button>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        style={styles.card}
      >
        <h1 style={styles.title}>Check Match Status 🔍</h1>
        <p style={styles.subtitle}>
          Enter your registered ALX email address to view all your active Short Course pairings and queue requests.
        </p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <motion.input 
            whileFocus={{ scale: 1.02, borderColor: colors.secondary.electricBlue }}
            style={styles.input} 
            placeholder="e.g. learner@alxafrica.com" 
            value={inputIdx}
            onChange={(e) => setInputId(e.target.value)}
            required
          />
          
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            type="submit" 
            style={styles.button}
          >
            Check Status 🚀
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: colors.primary.berkeleyBlue,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center',
    fontFamily: fonts.main
  },
  backBtn: {
    position: 'absolute', top: '40px', left: '40px',
    background: 'transparent', border: `1px solid ${colors.secondary.electricBlue}`,
    color: colors.secondary.electricBlue, padding: '8px 16px', borderRadius: '20px',
    cursor: 'pointer', fontWeight: 'bold'
  },
  card: {
    background: colors.primary.white,
    padding: '3rem', borderRadius: '20px',
    textAlign: 'center', maxWidth: '500px', width: '90%',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
  },
  title: { color: colors.primary.berkeleyBlue, marginBottom: '10px' },
  subtitle: { color: '#666', marginBottom: '30px', lineHeight: '1.5' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  input: {
    padding: '15px', fontSize: '1.1rem', borderRadius: '10px',
    border: '2px solid #eee', textAlign: 'center', outline: 'none',
    transition: 'border-color 0.3s'
  },
  button: {
    padding: '15px', background: colors.primary.iris, color: 'white',
    border: 'none', borderRadius: '30px', fontSize: '1.1rem',
    fontWeight: 'bold', cursor: 'pointer',
    boxShadow: `0 5px 15px ${colors.primary.iris}66`
  }
};

export default CheckStatusPage;
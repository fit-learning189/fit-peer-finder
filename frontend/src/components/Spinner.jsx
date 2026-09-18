import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../theme';

const Spinner = ({ size = '20px', color = colors.accent.azureHi }) => {
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid rgba(241, 245, 247, 0.16)`,
        borderTop: `3px solid ${color}`,
        display: 'inline-block',
      }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    />
  );
};

export default Spinner;

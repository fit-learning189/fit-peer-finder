import React from 'react';
import { motion } from 'framer-motion';

const Spinner = ({ size = "20px", color = "#ffffff" }) => {
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid rgba(255,255,255,0.3)`,
        borderTop: `3px solid ${color}`,
        display: 'inline-block'
      }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    />
  );
};

export default Spinner;
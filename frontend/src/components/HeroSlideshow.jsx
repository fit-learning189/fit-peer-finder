import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, fonts } from '../theme';

// 1. Define your stages (Images & Text)
// Note: Replace the 'image' URLs with your actual images or screenshots later.
const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop", // Placeholder: Person on laptop
    text: "You have been matched! 🎉",
    subtext: "Register and get paired instantly."
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2070&auto=format&fit=crop", // Placeholder: Phone/Chat
    text: "💬 I'm available. Let's meet!",
    subtext: "Connect via WhatsApp immediately."
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop", // Placeholder: Group studying
    text: "Collaborate & Grow 🚀",
    subtext: "Work on projects together happily."
  },
  {
    id: 4,
    image: "/alx_icon.png", // Your ALX Logo (make sure it's in public folder)
    text: "ALX Peer Finder",
    subtext: "Never study alone again.",
    isLogo: true // Special flag to style the logo differently
  }
];

const HeroSlideshow = () => {
  const [index, setIndex] = useState(0);

  // 2. Logic to auto-rotate slides every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4500); // 4.5 seconds per slide
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.container}>
      <AnimatePresence mode='wait'>
        <motion.div
          key={index} // Key change triggers animation
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          style={styles.slide}
        >
          {/* Background Image */}
          <div 
            style={{
              ...styles.image, 
              backgroundImage: `url(${slides[index].image})`,
              backgroundSize: slides[index].isLogo ? 'contain' : 'cover',
              backgroundPosition: 'center'
            }} 
          />
          
          {/* Dark Overlay so text pops */}
          <div style={styles.overlay} />

          {/* Text Content */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={styles.content}
          >
            <h2 style={styles.text}>{slides[index].text}</h2>
            <p style={styles.subtext}>{slides[index].subtext}</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Dots */}
      <div style={styles.dots}>
        {slides.map((_, i) => (
          <div 
            key={i} 
            style={{
              ...styles.dot, 
              backgroundColor: i === index ? colors.secondary.electricBlue : 'rgba(255,255,255,0.5)'
            }} 
          />
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    overflow: 'hidden', zIndex: 0 // Behind everything
  },
  slide: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%'
  },
  image: {
    width: '100%', height: '100%',
    filter: 'blur(2px)' // Slight blur to focus on foreground content
  },
  overlay: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    background: `linear-gradient(to bottom, ${colors.primary.berkeleyBlue}cc, ${colors.primary.berkeleyBlue}ee)` 
    // ^ Heavy blue tint so it looks like a background
  },
  content: {
    position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
    textAlign: 'center', width: '100%', zIndex: 2
  },
  text: {
    color: colors.secondary.electricBlue, fontFamily: fonts.main,
    fontSize: '2rem', fontWeight: 'bold', margin: 0,
    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
  },
  subtext: {
    color: 'white', fontFamily: fonts.main,
    fontSize: '1.2rem', marginTop: '5px'
  },
  dots: {
    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '10px', zIndex: 3
  },
  dot: {
    width: '10px', height: '10px', borderRadius: '50%', transition: 'background 0.3s'
  }
};

export default HeroSlideshow;
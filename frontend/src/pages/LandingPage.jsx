import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, fonts } from '../theme';
import { API_URL } from '../config';
import HeroSlideshow from './HeroSlideshow';

// --- FIT PROGRAM CONFIGURATION ---
// Flat list (no "vertical" grouping layer) since FIT currently runs one program.
// Add more program objects here as FIT's Global Skills Academy grows — the UI
// below will automatically render each as its own selectable tile in Step 1.
const PROGRAMS = [
  {
    id: 'AIFW',
    name: 'AI Fluency for the Workplace',
    courses: [
      'AIFW-1: AI Foundations for Work and Everyday Life',
      'AIFW-2: Prompting and Working Effectively with AI Models',
      'AIFW-3: AI Ethics and Responsible Governance',
      'AIFW-4: Communicating and Creating with AI',
      'AIFW-5: Data Analysis and Decision-Making with AI',
      'AIFW-6: Building an AI-Powered Professional Portfolio',
      'AIFW-7: Critical Thinking in the Age of AI'
    ]
  }
];

// --- ANIMATED LEADERBOARD COMPONENT ---
const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/leaderboard`)
      .then(res => { if (res.data.success && res.data.leaderboard.length > 0) setLeaders(res.data.leaderboard); })
      .catch(err => console.error("Error fetching leaderboard", err));
  }, []);
  if (!leaders || leaders.length === 0) return null; 

  return (
    <div style={styles.leaderboardSection}>
      <h2 style={{color: colors.primary.berkeleyBlue, fontSize: '2.5rem', marginBottom: '10px'}}>Community Support Stars</h2>
      <div style={styles.podiumContainer}>
        {leaders[1] && (
          <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} style={styles.podiumBlockWrap}>
            <div style={{...styles.podiumName, color: '#C0C0C0'}}>{leaders[1].name}</div>
            <div style={styles.podiumScore}>{leaders[1].score} pts</div>
            <div style={{...styles.podiumPillar, height: '90px', background: 'linear-gradient(to top, #e0e0e0, #f8f9fa)'}}>2nd</div>
          </motion.div>
        )}
        {leaders[0] && (
          <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} style={{...styles.podiumBlockWrap, zIndex: 10}}>
            <div style={{...styles.podiumName, color: '#FFD700'}}>{leaders[0].name}</div>
            <div style={styles.podiumScore}>{leaders[0].score} pts</div>
            <div style={{...styles.podiumPillar, height: '120px', background: 'linear-gradient(to top, #ffeeba, #fff9e6)', border: '2px solid #FFD700'}}>1st</div>
          </motion.div>
        )}
        {leaders[2] && (
          <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} style={styles.podiumBlockWrap}>
            <div style={{...styles.podiumName, color: '#CD7F32'}}>{leaders[2].name}</div>
            <div style={styles.podiumScore}>{leaders[2].score} pts</div>
            <div style={{...styles.podiumPillar, height: '70px', background: 'linear-gradient(to top, #f4e3d7, #fdf8f5)'}}>3rd</div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  // Modal Control
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('REGISTER'); // 'REGISTER', 'STATUS', or 'FEEDBACK'
  const [step, setStep] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  // Selections
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Tool Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetModal = () => { setShowModal(false); setStep(1); setSelectedProgram(null); setSelectedCourse(null); };

  const handleModeSelection = (mode) => {
    setModalMode(mode);
    setShowModal(true);
    setStep(1);
  };

  const handleProgramSelection = (program) => {
    setSelectedProgram(program);

    if (modalMode === 'STATUS') {
        navigate('/check-status');
        resetModal();
    } else if (modalMode === 'FEEDBACK') {
        navigate('/peer-feedback');
        resetModal();
    } else {
        // REGISTER FLOW: Move to Step 2 (course selection)
        setStep(2);
    }
  };

  const handleOptionSelect = (type) => {
    const path = type === 'need' ? '/marketplace' : '/register';
    navigate(path, { state: { program: selectedProgram.id, course: selectedCourse, connectionType: type } });
    resetModal();
  };

  const submitFeedback = async () => {
    try {
      await axios.post(`${API_URL}/api/feedback`, { rating, comment });
      setFeedbackSent(true);
      setTimeout(() => { setShowFeedback(false); setFeedbackSent(false); setRating(0); setComment(""); }, 2000);
    } catch (err) { alert("Error sending feedback"); }
  };

  return (
    <div style={styles.container}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <img src="/fit_logo.png" alt="Frontier Institute of Technology" style={{height: '38px', marginRight: '10px'}} /> 
          <span style={styles.logoText}>PeerFinder</span>
        </div>
        <div style={styles.navRight}>
           <div style={{position: 'relative'}} ref={menuRef}>
             <div onClick={() => setMenuOpen(!menuOpen)} style={styles.diceMenu}>
               <div style={styles.diceRow}><div style={styles.diceDot}/><div style={styles.diceDot}/></div>
               <div style={styles.diceRowCenter}><div style={styles.diceDot}/></div>
               <div style={styles.diceRow}><div style={styles.diceDot}/><div style={styles.diceDot}/></div>
             </div>
             <AnimatePresence>
               {menuOpen && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={styles.dropdownMenu}>
                   <div onClick={() => navigate('/admin')} style={styles.dropdownItem}>Admin Login</div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div style={styles.heroSection}>
        <HeroSlideshow />
        <div style={styles.heroForeground}>
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} style={styles.heroTextContainer}>
            <h1 style={styles.heroTitle}>Learn better, <span style={{color: colors.secondary.electricBlue}}>together.</span></h1>
            <p style={styles.heroParagraph}>Discover peers in your short course to share ideas, tackle projects, and celebrate wins.</p>
            <div style={styles.heroButtons}>
              <button onClick={() => handleModeSelection('REGISTER')} style={styles.primaryBtn}>Get Started</button>
              <button onClick={() => handleModeSelection('STATUS')} style={styles.secondaryBtn}>Check Status</button>
              <button onClick={() => handleModeSelection('FEEDBACK')} style={styles.feedbackActionBtn}>Confirm Connection</button>
            </div>
          </motion.div>
          <div style={styles.videoWrapper}>
            <iframe src="https://www.youtube.com/embed/CV95WoCsCj8" title="PeerFinder Walkthrough" style={styles.iframe} allowFullScreen></iframe>
          </div>
        </div>
      </div>

      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {showModal && (
          <motion.div style={styles.modalOverlay} onClick={resetModal}>
            <motion.div style={{...styles.modalCard, maxWidth: step === 1 ? '1000px' : '600px'}} onClick={e => e.stopPropagation()}>
              
              {/* STEP 1: PROGRAM PICKER — flat list, ready to grow as FIT adds programs */}
              {step === 1 && (
                <>
                  <h2 style={{color: colors.primary.berkeleyBlue, marginBottom: '30px'}}>First, select your program</h2>
                  <div style={styles.programGrid}>
                    {PROGRAMS.map(p => (
                      <motion.button key={p.id} whileHover={{ y: -3 }} style={styles.programCard} onClick={() => handleProgramSelection(p)}>
                        <div style={styles.programCardName}>{p.name}</div>
                        <div style={styles.programCardMeta}>{p.courses.length} short courses</div>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 2: COURSE (ONLY FOR REGISTER MODE) */}
              {step === 2 && (
                <>
                  <button style={styles.backLink} onClick={() => setStep(1)}>&larr; Back</button>
                  <h2 style={{color: colors.primary.berkeleyBlue}}>Which Short Course?</h2>
                  <div style={styles.courseList}>
                    {selectedProgram.courses.map(c => (
                      <motion.button key={c} whileHover={{ background: colors.primary.iris, color: 'white' }} style={styles.courseBtn} onClick={() => { setSelectedCourse(c); setStep(3); }}>{c}</motion.button>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 3: CONNECTION TYPE (ONLY FOR REGISTER MODE) */}
              {step === 3 && (
                <>
                  <button style={styles.backLink} onClick={() => setStep(2)}>&larr; Back</button>
                  <h2 style={{color: colors.primary.berkeleyBlue}}>How can we connect you?</h2>
                  <div style={styles.typeGrid}>
                    <OptionCard title="Study Buddy" desc="(1-on-1 Partner)" color={colors.primary.iris} onClick={() => handleOptionSelect('find')} />
                    <OptionCard title="Offer Support" desc="(Volunteer)" color={colors.primary.springGreen} textColor={colors.primary.berkeleyBlue} onClick={() => handleOptionSelect('offer')} />
                    <OptionCard title="I Need Help" desc="(Browse peers)" color={colors.secondary.tomato} onClick={() => handleOptionSelect('need')} />
                    <OptionCard title="Group Squad" desc="(Join a team of 3-5)" color={colors.raw.accentHover} onClick={() => handleOptionSelect('group')} />
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Leaderboard />

      <div style={styles.infoSection}>
        <h3 style={styles.infoTitle}>Collaborate & Grow Together</h3>
        <p style={styles.infoText}>Learning is more rewarding when shared. PeerFinder helps you discover learners who match your goals, so you can support each other and stay motivated.</p>
        <h3 style={styles.infoTitle}>Tailored Connections</h3>
        <p style={styles.infoText}>Whether you prefer focused one-on-one partnerships or dynamic groups of three or five, PeerFinder matches you with peers who have similar progress and commitment levels.</p>
      </div>

      <footer style={styles.footer}>
        Built for the Frontier Institute of Technology Community. <br/>
        © 2026 FIT PeerFinder — Global Skills Academy. All rights reserved.
      </footer>

      {/* FEEDBACK SYSTEM */}
      <button onClick={() => setShowFeedback(true)} style={styles.feedbackBtn}>Rate PeerFinder</button>
      {showFeedback && (
        <div style={styles.modalOverlay} onClick={() => setShowFeedback(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            {feedbackSent ? <h3 style={{color: 'green'}}>Thank you!</h3> : (
              <>
                <h3>Rate your experience</h3>
                <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', cursor:'pointer', margin:'10px 0'}}>
                  {[1,2,3,4,5].map(s => <span key={s} onClick={() => setRating(s)} style={{color: s <= rating ? '#FFD700' : '#ddd'}}>★</span>)}
                </div>
                <textarea placeholder="Suggestions?" value={comment} onChange={e => setComment(e.target.value)} style={{width:'100%', padding:'10px', margin:'10px 0'}} />
                <button onClick={submitFeedback} disabled={!rating} style={styles.primaryBtnFull}>Submit</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const OptionCard = ({ title, desc, color, textColor='white', onClick }) => (
  <motion.button whileHover={{scale: 1.02}} onClick={onClick} style={{...styles.optionCard, background: color, color: textColor}}>
    <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{title}</div> <div style={{fontSize: '0.85rem', opacity: 0.9}}>{desc}</div>
  </motion.button>
);

const styles = {
  container: { minHeight: '100vh', background: colors.primary.berkeleyBlue, fontFamily: fonts.main, position:'relative' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'white', zIndex: 100, position:'relative' },
  navLeft: { display: 'flex', alignItems: 'center' }, logoText: { color: colors.primary.iris, fontWeight: '700', fontSize: '1.5rem' },
  navRight: { display: 'flex', alignItems: 'center' },
  diceMenu: { cursor: 'pointer', padding: '8px', background: '#f0f0f0', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  diceRow: { display: 'flex', justifyContent: 'space-between' }, diceRowCenter: { display: 'flex', justifyContent: 'center' }, diceDot: { width: '4px', height: '4px', background: colors.primary.berkeleyBlue, borderRadius: '50%' },
  dropdownMenu: { position: 'absolute', top: '50px', right: '0', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '200px', zIndex: 100 },
  dropdownItem: { padding: '15px', cursor: 'pointer', textAlign: 'center', color: colors.primary.iris, fontWeight: 'bold' },
  heroSection: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position:'relative', overflow:'hidden' },
  heroForeground: { position: 'relative', zIndex: 10, display: 'flex', flexWrap:'wrap', justifyContent:'center', alignItems:'center', gap:'3rem', padding:'2rem', width:'100%', maxWidth:'1200px' },
  heroTextContainer: { flex: '1', minWidth: '300px', maxWidth: '650px', textAlign: 'left', color: 'white' },
  heroTitle: { fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1rem' },
  heroParagraph: { fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem', color: '#e0e0e0' },
  heroButtons: { display: 'flex', gap: '10px', flexDirection: 'row', alignItems: 'center' },
  primaryBtn: { padding: '12px 18px', borderRadius: '30px', border: 'none', background: colors.secondary.electricBlue, color: colors.primary.berkeleyBlue, fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer' },
  primaryBtnFull: { width: '100%', padding: '12px 30px', borderRadius: '30px', border: 'none', background: colors.secondary.electricBlue, color: colors.primary.berkeleyBlue, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  secondaryBtn: { padding: '12px 18px', borderRadius: '30px', border: '2px solid white', background: 'transparent', color: 'white', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer' },
  feedbackActionBtn: { padding: '12px 18px', borderRadius: '30px', border: 'none', background: colors.primary.springGreen, color: colors.primary.berkeleyBlue, fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer' },
  videoWrapper: { flex: '1', minWidth: '300px', maxWidth: '560px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', aspectRatio: '16/9', border: `1px solid rgba(255,255,255,0.1)` },
  iframe: { width: '100%', height: '100%', border: 'none' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { background: 'white', padding: '2.5rem', borderRadius: '20px', width: '90%', maxHeight: '90vh', overflowY: 'auto' },
  programGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', textAlign: 'left' },
  programCard: { padding: '24px', borderRadius: '14px', border: `2px solid ${colors.raw.primary80}`, background: colors.raw.secondary80, textAlign: 'left', cursor: 'pointer' },
  programCardName: { fontSize: '1.15rem', fontWeight: '700', color: colors.primary.berkeleyBlue, marginBottom: '6px' },
  programCardMeta: { fontSize: '0.85rem', color: colors.raw.primary40, fontWeight: '500' },
  courseList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  courseBtn: { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', background: 'white', textAlign: 'left', cursor: 'pointer', color: colors.primary.berkeleyBlue, fontWeight: '500' },
  typeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  optionCard: { padding: '20px', borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'center' },
  backLink: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '15px', fontSize: '0.9rem' },
  infoSection: { padding: '4rem 2rem', background: '#d1dbf8', color: colors.primary.berkeleyBlue, textAlign: 'center' },
  infoTitle: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }, infoText: { fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', marginBottom: '2rem' },
  footer: { background: colors.primary.berkeleyBlue, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' },
  feedbackBtn: { position: 'fixed', bottom: '20px', right: '20px', padding: '15px 25px', borderRadius: '35px', border: 'none', background: colors.secondary.tomato, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', zIndex: 100 },
  leaderboardSection: { padding: '4rem 2rem', background: 'white', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  podiumContainer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '15px', height: '300px', marginTop: '40px', maxWidth: '600px', width: '100%' },
  podiumBlockWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  podiumName: { fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }, podiumScore: { fontSize: '0.9rem', color: '#666', marginBottom: '10px' }, podiumPillar: { width: '100%', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#555' }
};

export default LandingPage;

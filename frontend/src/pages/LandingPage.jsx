import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, fonts } from '../theme';
import { API_URL } from '../config';

// --- MASTER VERTICAL CONFIGURATION ---
const VERTICALS = {
  CA: {
    name: 'CAREER ACCELERATOR',
    url: 'https://alx-peerfinder.vercel.app', 
    programs: [
      { id: 'VA', name: 'Virtual Assistant', courses: ['VA-1: VA Foundations & Professional Identity', 'VA-2: Core Professional & Soft Skills for VAs', 'VA-3: VA Tech Tools & Digital Productivity', 'VA-4: Essential VA Task Execution', 'VA-5: VA Career Readiness, Freelancing & Client Work', 'VA-6: VA Specialisation, Toolkit & Next Steps', 'Cohort 15'] },
      { id: 'AiCE', name: 'AI Career Essentials', courses: ['AICE-1: AI Foundations for Work and Everyday Life', 'AICE-2: Prompting and Working Effectively with AI Models', 'AICE-3: Ethical and Responsible Use of AI at Work', 'AICE-4: Creating Professional Content with Generative AI', 'AICE-5: Data Analysis and Decision-Making with AI', 'AICE-6: Building an AI-Powered Professional Portfolio', 'Cohort 18'] },
      { id: 'PF', name: 'Prof. Foundations', courses: ['Cohort 12', 'PF-1: Self-Leadership & Learning Foundations', 'PF-2: Data Literacy, Research, & Problem Framing', 'PF-3: Communication & Professional Writing', 'PF-4: Teamwork & Agile Workflows', 'PF-5: Career Exploration & Professional Identity'] }
    ]
  },
  CREATIVE: {
    name: 'CREATIVE TECH',
    url: 'https://alx-peerfinder.vercel.app',
    programs: [
      { id: 'CC', name: 'Content Creation', courses: ['CC-1: Content Identity & Concept Development', 'CC-2: Content Creation Workflow', 'CC-3: AI-Enhanced Content Creation', 'CC-4: Animation & Motion Graphics Foundations', 'CC-5: Business Foundations for Content Creators'] },
      { id: 'GD', name: 'Graphic Design', courses: ['GD-1: Graphic Design Software Fundamentals', 'GD-2: Foundations of Graphic Design & Visual Language', 'GD-3: Poster Design & Visual Composition', 'GD-4: Typography & Grid Systems', 'GD-5: Editorial & Magazine Design', 'GD-6: Designing for Social Media', 'GD-7: Brand Strategy for Designers', 'GD-8: AI for Graphic Design', 'GD-9: Graphic Design Portfolio Development', 'GD-10: Freelancing & Business Skills for Graphic Design'] }
    ]
  },
  TECHLITE: {
    name: 'TECH LITE',
    url: 'https://alxs-techlite-peerfinder.vercel.app',
    programs: [
      { id: 'DA', name: 'Data Analytics', courses: ['DA-1: Data and AI Literacy Foundations', 'DA-2: Data Analytics with Spreadsheets', 'DA-3: SQL for Data', 'DA-4: PowerBI for Data Analytics', 'DA-5: Python for Data Analysis', 'DA-6: Statistical Reasoning', 'DA-7: Data Storytelling', 'DA-8: Advanced Excel', 'DA-9: Tableau for Analytics', 'DA-10: Data Analytics Capstone'] },
      { id: 'DS', name: 'Data Science', courses: ['DS-1: Python I: Foundations', 'DS-2: Python II: Algorithmic Thinking', 'DS-3: Python III: EDA', 'DS-4: Machine Learning I', 'DS-5: Machine Learning II', 'DS-6: Machine Learning III', 'DS-7: NLP Foundations', 'DS-8: Deep Learning', 'DS-9: Computer Vision', 'DS-10: MLOps', 'DS-11: Data Science Capstone'] },
      { id: 'SE', name: 'Software Engineering', courses: ['SE-1: Intro to SE', 'SE-2: Programming Basics', 'SE-3: Algorithmic Thinking', 'SE-4: Efficient Software Design', 'SE-5: Generative AI Engineering', 'SE-6: AI-Native Programming', 'SE-7: Agentic Workflows', 'SE-8: Code Quality', 'SE-9: Modern Web Languages', 'SE-10: UI Design', 'SE-11: Component Architecture', 'SE-12: Modern Rendering', 'SE-13: QA & Testing', 'SE-14: Backend Foundations', 'SE-15: Databases', 'SE-16: API Engineering', 'SE-17: Backend Security', 'SE-18: High Performance Systems', 'SE-19: Cloud Native Architecture', 'SE-20: DevOps & Production'] },
      { id: 'DE', name: 'Data Engineering', courses: ['Cohort 4'] },
      { id: 'CS', name: 'Cyber Security', courses: ['Cohort 4'] }
    ]
  },
  VENTURES: {
    name: 'ALX VENTURES',
    url: 'https://alxventuress-peerfinder.vercel.app',
    programs: [
      { id: 'FA', name: 'Founders Academy', courses: ['FA-1: Startup Foundations', 'FA-2: MVP Building', 'FA-3: Startup Operations', 'FA-4: Investment Readiness'] },
      { id: 'FLA', name: 'Freelance Academy', courses: ['FLA-1: Freelance Foundations', 'FLA-2: Client Acquisition', 'FLA-3: Scaling Your Business'] }
    ]
  }
};

// --- SLIDESHOW DATA ---
const slides = [
  { id: 1, image: "/slide1.jpg", text: "It's a Match!", subtext: "Register and get paired instantly." },
  { id: 2, image: "/slide2.jpg", text: "Let's meet!", subtext: "Connect via WhatsApp immediately." },
  { id: 3, image: "/slide3.jpg", text: "Collaborate & Grow", subtext: "Work on Milestones and projects together." },
  { id: 4, image: "/alx_white.png", text: "ALX Peer Finder", subtext: "Study together", isLogo: true }
];

const HeroSlideshow = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div style={styles.slideshowContainer}>
      <AnimatePresence mode='wait'>
        <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} style={styles.slide}>
          <div style={{...styles.image, backgroundImage: `url(${slides[index].image})`, backgroundSize: slides[index].isLogo ? 'contain' : 'cover'}} />
          <div style={styles.overlay} />
        </motion.div>
      </AnimatePresence>
      <div style={styles.slideContentWrapper}>
        <motion.div key={index} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h2 style={styles.slideTitle}>{slides[index].text}</h2>
          <p style={styles.slideSubtext}>{slides[index].subtext}</p>
        </motion.div>
      </div>
    </div>
  );
};

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
  const [selectedVertical, setSelectedVertical] = useState(null);
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

  const resetModal = () => { setShowModal(false); setStep(1); setSelectedVertical(null); setSelectedProgram(null); setSelectedCourse(null); };

  const handleModeSelection = (mode) => {
    setModalMode(mode);
    setShowModal(true);
    setStep(1);
  };

  // --- TRAFFIC CONTROLLER REDIRECT ---
  const handleProgramSelection = (vertical, program) => {
    setSelectedVertical(vertical);
    setSelectedProgram(program);

    const isInternal = vertical.url === window.location.origin || vertical.url === 'https://alx-peerfinder.vercel.app';

    if (modalMode === 'STATUS') {
        if (isInternal) navigate('/status/check');
        else window.location.href = `${vertical.url}/status/check`;
        resetModal();
    } else if (modalMode === 'FEEDBACK') {
        if (isInternal) navigate('/peer-feedback');
        else window.location.href = `${vertical.url}/peer-feedback`;
        resetModal();
    } else {
        // REGISTER FLOW: Move to Step 2
        setStep(2);
    }
  };

  const handleOptionSelect = (type) => {
    const isInternal = selectedVertical.url === window.location.origin || selectedVertical.url === 'https://alx-peerfinder.vercel.app';
    if (isInternal) {
      const path = type === 'need' || type === 'Request Support' ? '/marketplace' : '/register';
      navigate(path, { state: { program: selectedProgram.id, course: selectedCourse, connectionType: type } });
    } else {
      const path = type === 'need' || type === 'Request Support' ? 'marketplace' : 'register';
      // FIX: Changed 'type' parameter back to 'connectionType' to match what the CT app expects!
      const params = `?program=${selectedProgram.id}&course=${encodeURIComponent(selectedCourse)}&connectionType=${encodeURIComponent(type)}`;
      window.location.href = `${selectedVertical.url}/${path}${params}`;
    }
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
          <img src="/alx_icon-300x169.png" alt="ALX" style={{height: '35px', marginRight: '10px'}} /> 
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
              
              {/* STEP 1: CROSS-VERTICAL PROGRAM PICKER */}
              {step === 1 && (
                <>
                  <h2 style={{color: colors.primary.berkeleyBlue, marginBottom: '30px'}}>First, select your program</h2>
                  <div style={styles.masterGrid}>
                    {Object.entries(VERTICALS).map(([key, vertical]) => (
                      <div key={key} style={styles.verticalColumn}>
                        <div style={styles.verticalHeader}>{vertical.name}</div>
                        {vertical.programs.map(p => (
                          <motion.button key={p.id} whileHover={{ x: 5 }} style={styles.programTile} onClick={() => handleProgramSelection(vertical, p)}>
                            {p.name}
                          </motion.button>
                        ))}
                      </div>
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
                    {selectedVertical.name === 'ALX VENTURES' ? (
                      <>
                        <OptionCard title="Find / Be a Co-Founder" desc="(Build your team)" color={colors.primary.iris} onClick={() => handleOptionSelect('Find / Be a Co-Founder')} />
                        <OptionCard title="Find a Study Buddy" desc="(Accountability Partner)" color="#FF9800" onClick={() => handleOptionSelect('Find a Study Buddy')} />
                        <OptionCard title="Offer Support" desc="(Volunteer)" color={colors.primary.springGreen} textColor={colors.primary.berkeleyBlue} onClick={() => handleOptionSelect('Offer Support')} />
                        <OptionCard title="Request Support" desc="(Browse peer help)" color={colors.secondary.tomato} onClick={() => handleOptionSelect('Request Support')} />
                      </>
                    ) : (
                      <>
                        <OptionCard title="Study Buddy" desc="(1-on-1 Partner)" color={colors.primary.iris} onClick={() => handleOptionSelect('find')} />
                        <OptionCard title="Offer Support" desc="(Volunteer)" color={colors.primary.springGreen} textColor={colors.primary.berkeleyBlue} onClick={() => handleOptionSelect('offer')} />
                        <OptionCard title="I Need Help" desc="(Browse peers)" color={colors.secondary.tomato} onClick={() => handleOptionSelect('need')} />
                        <OptionCard title="Group Squad" desc="(Join a team of 3-5)" color="#FF9800" onClick={() => handleOptionSelect('group')} />
                      </>
                    )}
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
        Built for the ALX Community. <br/>
        © 2026 Peer Finder. All rights reserved.
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
  slideshowContainer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  slide: { position: 'absolute', width: '100%', height: '100%' }, image: { width: '100%', height: '100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }, overlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,43,86,0.6)' },
  slideContentWrapper: { position: 'absolute', bottom: '15%', width: '100%', textAlign: 'center', color: 'white', zIndex: 2 },
  slideTitle: { fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }, slideSubtext: { fontSize: '1.2rem' },
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
  masterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '25px', textAlign: 'left' },
  verticalColumn: { display: 'flex', flexDirection: 'column', gap: '10px' },
  verticalHeader: { fontSize: '0.8rem', fontWeight: '900', color: '#999', letterSpacing: '1px', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' },
  programTile: { padding: '12px', borderRadius: '8px', border: '1px solid #eee', background: '#f9f9f9', textAlign: 'left', cursor: 'pointer', color: colors.primary.berkeleyBlue, fontWeight: '600', border: 'none' },
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

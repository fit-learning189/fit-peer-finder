import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { colors, fonts } from '../theme';
import Spinner from '../components/Spinner';
import { API_URL } from '../config';

const PeerFeedbackPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // LF4J CA Programs Data
  const programs = {
    'VA': ['VA-1', 'VA-2', 'VA-3', 'VA-4', 'VA-5', 'VA-6'],
    'AiCE': ['AICE-1', 'AICE-2', 'AICE-3', 'AICE-4', 'AICE-5', 'AICE-6'],
    'PF': ['PF-1', 'PF-2', 'PF-3', 'PF-4', 'PF-5'],
    'CC': ['CC-1', 'CC-2', 'CC-3', 'CC-4', 'CC-5'],
    'GD': ['GD-1', 'GD-2', 'GD-3', 'GD-4', 'GD-5', 'GD-6', 'GD-7', 'GD-8', 'GD-9', 'GD-10']
  };

  // Ultra-Lean Form State
  const [formData, setFormData] = useState({
    email: '',
    program: '',
    course: '',
    role: '',
    volunteer_email: '', // Only for HelpSeekers
    session_happened: '',
    ghoster_emails: '', 
    rematch_request: '',
    overall_rating: 0,
    progress: '',
    feedback_details: '' // Consolidated open text for rating <= 3
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRating = (value) => {
    setFormData({ ...formData, overall_rating: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/peer-feedback`, formData);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("There was an issue submitting your feedback.");
    } finally {
      setLoading(false);
    }
  };

  // --- POST-SUBMISSION VIEW ---
  if (success) {
    return (
      <div style={styles.container}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.card}>
            <h1 style={{fontSize: '3rem', marginBottom: '10px'}}>🌟</h1>
            <h2 style={{color: colors.primary.berkeleyBlue}}>Feedback Confirmed!</h2>
            <p style={{color: '#555', marginBottom: '30px', lineHeight: '1.6'}}>
              Thank you for keeping the PeerFinder ecosystem running smoothly! <br/><br/>
              {formData.ghoster_emails 
                ? "The reported no-show learner(s) have been sent a gentle nudge to try again when they have more capacity." 
                : "Your responses help us measure impact and spot our amazing community stars."}
            </p>
            <button onClick={() => navigate('/')} style={styles.primaryBtn}>Back to Home</button>
        </motion.div>
      </div>
    );
  }

  // --- LOGIC GATES ---
  const isSessionYes = formData.session_happened === 'Yes, we all met';
  const isPartialGhost = formData.session_happened === 'Yes, but my peer/some peers did not attend';
  const isFullGhost = formData.session_happened === 'No, I was completely ghosted / nobody showed up';
  const isOtherNo = formData.session_happened === 'No, we had a schedule conflict';

  const showRatings = isSessionYes || isPartialGhost;
  const showEscalationLink = formData.progress === 'I am still stuck and need more support' || (formData.overall_rating > 0 && formData.overall_rating <= 3);

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/')}>&larr; Back</button>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
        <h2 style={styles.header}>Confirm Connection ✅</h2>
        <p style={styles.subtext}>A quick check-in to award Legacy Points and track progress.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* --- 1. BASE INFO & ROLE --- */}
          <div style={styles.section}>
            <label style={styles.label}>Your Learning Email Address *</label>
            <input style={styles.input} type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Your email" />

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                <div>
                    <label style={styles.label}>Your Program *</label>
                    <select style={styles.select} name="program" value={formData.program} onChange={handleChange} required>
                    <option value="">--Select--</option>
                    {Object.keys(programs).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Short Course *</label>
                    <select style={styles.select} name="course" value={formData.course} onChange={handleChange} required disabled={!formData.program}>
                    <option value="">--Select--</option>
                    {formData.program && programs[formData.program].map(c => <option key={c} value={c.split(':')[0]}>{c.split(':')[0]}</option>)}
                    </select>
                </div>
            </div>

            <label style={styles.label}>What was your primary role in this session? *</label>
            <select style={styles.select} name="role" value={formData.role} onChange={handleChange} required>
              <option value="">--Select Role--</option>
              <option value="Volunteer">Volunteer (I offered help)</option>
              <option value="HelpSeeker">Peer (I requested help)</option>
              <option value="StudyBuddy">Study Buddy (1-on-1 equal collaboration)</option>
              <option value="GroupMember">Group Member (Team squad)</option>
            </select>

            {/* Smart Email Collection: Only show for Help Seekers */}
            <AnimatePresence>
                {formData.role === 'HelpSeeker' && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}}>
                        <label style={{...styles.label, color: colors.primary.iris}}>Your Volunteer's ALX Email Address *</label>
                        <p style={styles.hint}>Required so we can award them their well-deserved Legacy Points!</p>
                        <input style={{...styles.input, borderColor: colors.primary.iris}} type="email" name="volunteer_email" value={formData.volunteer_email} onChange={handleChange} required placeholder="Volunteer's Email" />
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* --- 2. ATTENDANCE GATE --- */}
          {formData.role && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={styles.section}>
              <label style={styles.label}>Did this peer session actually happen? *</label>
              <div style={styles.radioGroup}>
                {[
                  'Yes, we all met', 
                  'Yes, but my peer/some peers did not attend', 
                  'No, we had a schedule conflict', 
                  'No, I was completely ghosted / nobody showed up'
                ].map(opt => (
                  <label key={opt} style={styles.radioLabel}>
                    <input type="radio" name="session_happened" value={opt} checked={formData.session_happened === opt} onChange={handleChange} required /> {opt}
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- 3. NO-SHOW REPORTING & REMATCH --- */}
          <AnimatePresence>
              {(isPartialGhost || isFullGhost || isOtherNo) && (
                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} style={{...styles.section, background: '#fff5f5', border: '1px solid #ffcdd2', overflow: 'hidden'}}>
                  
                  {(isPartialGhost || isFullGhost) && (
                      <div style={{marginBottom: '15px'}}>
                        <label style={{...styles.label, color: '#c62828'}}>Report No-Show Peer(s) *</label>
                        <p style={{fontSize: '0.85rem', color: '#c62828', marginBottom: '10px', lineHeight: '1.4'}}>
                            Please enter the email(s) of peers who were absent. <br/>
                            <em>(💡 Tip: You can copy these from your Status Dashboard or Match Email. Separate multiple emails with a comma.)</em>
                        </p>
                        <input style={{...styles.input, borderColor: '#ffcdd2'}} type="text" name="ghoster_emails" value={formData.ghoster_emails} onChange={handleChange} required placeholder="e.g., peer1@alx.com, peer2@alx.com" />
                      </div>
                  )}

                  <label style={styles.label}>What would you like to do next? *</label>
                  <select style={styles.select} name="rematch_request" value={formData.rematch_request} onChange={handleChange} required>
                    <option value="">--Select Action--</option>
                    <option value="Rematch">Place me back in the queue for a new match</option>
                    <option value="Delete">Delete my queue request (I will register later)</option>
                    <option value="None">Keep my current group / Take no action</option>
                  </select>
                </motion.div>
              )}
          </AnimatePresence>

          {/* --- 4. RATINGS & PROGRESS (IF SESSION HAPPENED) --- */}
          {showRatings && (
            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}}>
              
              <div style={styles.section}>
                <label style={styles.label}>How would you rate your overall peer session experience? *</label>
                <p style={styles.hint}>1 = Waste of time, 5 = Highly productive and helpful</p>
                <div style={styles.stars}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} onClick={() => handleRating(s)} style={{...styles.star, color: s <= formData.overall_rating ? '#FFD700' : '#ddd'}}>★</span>
                  ))}
                </div>

                {/* Progress Dropdown (Hidden for Volunteers) */}
                {formData.role !== 'Volunteer' && formData.overall_rating > 0 && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{marginTop: '15px'}}>
                        <label style={styles.label}>What best describes your progress after the peer session? *</label>
                        <select style={styles.select} name="progress" value={formData.progress} onChange={handleChange} required>
                            <option value="">--Select--</option>
                            <option value="I was able to complete and submit my deliverable">I was able to complete and submit my deliverable</option>
                            <option value="I plan to submit my deliverable within 48 hours">I plan to submit my deliverable within 48 hours</option>
                            <option value="I am clearer but still working on it">I am clearer but still working on it</option>
                            <option value="I am still stuck and need more support">I am still stuck and need more support</option>
                        </select>
                    </motion.div>
                )}

                {/* Consolidated Open Text for Low Ratings */}
                <AnimatePresence>
                    {formData.overall_rating > 0 && formData.overall_rating <= 3 && (
                        <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} style={{marginTop: '15px'}}>
                            <label style={{...styles.label, color: colors.secondary.tomato}}>Please tell us more so we can improve: *</label>
                            <p style={styles.hint}>Was the learning goal resolved? Did you experience anything concerning? What worked well or could be improved?</p>
                            <textarea style={{...styles.textarea, borderColor: colors.secondary.tomato}} name="feedback_details" value={formData.feedback_details} onChange={handleChange} required placeholder="Share your experience here..." />
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}

          {/* --- 5. THE eHUB REDIRECT (OFFICIAL SUPPORT) --- */}
          <AnimatePresence>
              {showEscalationLink && formData.role !== 'Volunteer' && (
                  <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} style={{background: '#e3f2fd', border: `1px solid ${colors.secondary.electricBlue}`, padding: '15px', borderRadius: '8px', textAlign: 'center'}}>
                      <h3 style={{margin: '0 0 5px 0', fontSize: '1.1rem', color: colors.primary.berkeleyBlue}}>Need Official Support? 🆘</h3>
                      <p style={{fontSize: '0.9rem', color: '#555', marginBottom: '15px'}}>
                          PeerFinder is for peer-to-peer collaboration. If you are still stuck and need escalated help, please visit the Circle platform to connect with our Community Ambassadors.
                      </p>
                      <a href="https://ehub.alxafrica.com/community" target="_blank" rel="noopener noreferrer" style={{display: 'inline-block', background: colors.primary.iris, color: 'white', padding: '10px 20px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem'}}>
                          Go to eHub Community &rarr;
                      </a>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* SUBMIT BUTTON */}
          {(isFullGhost || isOtherNo || (showRatings && formData.overall_rating > 0 && (formData.role === 'Volunteer' || formData.progress))) && (
             <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={styles.primaryBtn} disabled={loading}>
             {loading ? <div style={{display:'flex', gap:'10px', justifyContent:'center'}}><Spinner size="20px" color="white" /> Saving...</div> : "Submit Feedback ✨"}
           </motion.button>
          )}

        </form>
      </motion.div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: colors.primary.berkeleyBlue, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: fonts.main },
  backBtn: { alignSelf: 'flex-start', marginBottom: '20px', background: 'transparent', border: `1px solid ${colors.secondary.electricBlue}`, color: colors.secondary.electricBlue, padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' },
  card: { background: colors.primary.white, padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  header: { textAlign: 'center', color: colors.primary.berkeleyBlue, marginBottom: '5px', fontSize: '1.8rem', fontWeight: 'bold' },
  subtext: { textAlign: 'center', color: '#666', marginBottom: '25px', fontSize: '0.95rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  section: { background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' },
  label: { fontWeight: '600', fontSize: '0.95rem', color: colors.primary.berkeleyBlue, marginBottom: '8px', display: 'block', marginTop: '10px' },
  hint: { fontSize: '0.8rem', color: '#777', marginTop: '-5px', marginBottom: '10px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' },
  select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: 'white', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' },
  radioLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', cursor: 'pointer', background: 'white', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' },
  stars: { display: 'flex', fontSize: '2.5rem', cursor: 'pointer', marginBottom: '15px' },
  star: { transition: 'color 0.2s' },
  primaryBtn: { width: '100%', padding: '15px', marginTop: '10px', background: `linear-gradient(45deg, ${colors.primary.iris}, ${colors.secondary.electricBlue})`, border: 'none', borderRadius: '30px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' },
};

export default PeerFeedbackPage;

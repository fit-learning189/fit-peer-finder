import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { colors, fonts } from '../theme';
import Spinner from '../components/Spinner';
import { API_URL } from '../config';

// --- US STATES (FIT is USA-only for now) ---
const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois",
  "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Extract state passed from LandingPage or VolunteerMarketplace
  const program = location.state?.program || 'AIFW';
  const course = location.state?.course || 'Unknown Course';
  const connectionType = location.state?.connectionType || 'find';
  const targetVolunteerId = location.state?.targetVolunteerId || null;

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', country: '', language: '',
    match_preference: '', 
    learning_preferences: '', availability: '', meeting_preference: 'All', 
    group_size: '2', // Defaults to 2 for Study Buddy, will change for 'group'
    volunteer_capacity: '', 
    pseudonym: '', // NEW: Replaces gender for 'offer'
    disclaimer_agree: false
  });

  // Redirect to home if accessed directly without program/course state
  useEffect(() => {
    if (!location.state?.program || !location.state?.course || !location.state?.connectionType) {
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { 
        ...formData, 
        program, 
        course, 
        connection_type: connectionType,
        target_volunteer_id: targetVolunteerId
    };

    try {
      const response = await axios.post(`${API_URL}/api/register`, payload);
      
      if (response.data.success) {
        // Instantly transport the user to their Status Dashboard!
        // We pass the email to the URL so the StatusPage knows who to look up.
        navigate(`/status/${encodeURIComponent(formData.email)}`, { 
          state: { isDuplicate: response.data.is_duplicate } 
        });
      }
    } catch (error) { 
        alert("Error: " + (error.response?.data?.error || error.message)); 
        setLoading(false);
    } 
    // Notice we removed setLoading(false) from a finally block so the spinner 
    // keeps spinning while the page transitions, making it feel smoother!
  };

  // Dynamic titles based on connection type
  const titles = {
    'find': 'Find a Study Buddy 🤝',
    'group': 'Form a Group Squad 👥',
    'offer': 'Offer Support to Peers 🌟',
    'need': targetVolunteerId ? 'Instant Support Pairing ⚡' : 'Request Priority Support 🆘'
  };

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>&larr; Back</button>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
        <h2 style={styles.header}>Register for {program}</h2>
        <p style={{textAlign:'center', marginBottom:'15px', color: '#666'}}>
          Short Course: <strong>{course}</strong><br/>
          Goal: <strong>{titles[connectionType].split(' ')[0]} {titles[connectionType].split(' ')[1]} {titles[connectionType].split(' ')[2]}</strong>
        </p>

        {/* --- WARNING BOX --- */}
        <div style={styles.warningBox}>
          <h3 style={styles.warningTitle}>⚠️ Please Read Carefully</h3>
          <ul style={styles.warningList}>
            <li>Show up for your partner — ghosting will result in a tool block.</li>
            <li>Provide accurate info only to ensure proper matching.</li>
            <li>Feel free to unpair/opt out via the Status page at any time.</li>
            <li>Peer support is informal and powered by the community.</li>
            <li>Volunteers are here to support, not replace official instructors.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
           <div style={styles.row}>
             <div style={styles.half}><label style={styles.label}>Full Name *</label><input style={styles.input} name="name" onChange={handleChange} required /></div>
             <div style={styles.half}><label style={styles.label}>Email Address (FIT registered) *</label><input style={styles.input} name="email" type="email" onChange={handleChange} required /></div>
           </div>
           
           {/* MODIFIED: Pseudonym Field replaces Gender ONLY for Volunteers offering support */}
           {connectionType === 'offer' && (
               <div style={{marginBottom: '15px'}}>
                 <label style={styles.label}>Support Group Pseudonym *</label>
                 <input 
                    style={styles.input} 
                    name="pseudonym" 
                    onChange={handleChange} 
                    placeholder="e.g., Tech Helper, Support Super Star" 
                    required 
                 />
                 <p style={{fontSize: '0.8rem', color: '#666', marginTop: '5px'}}>
                   This nickname will be used to identify your support group in the Volunteer Marketplace instead of your real name to protect your privacy.
                 </p>
               </div>
           )}

           <label style={styles.label}>Phone Number (WhatsApp/Telegram) *</label>
           <input style={styles.input} name="phone" type="tel" placeholder="+123..." onChange={handleChange} required />

           <div style={styles.row}>
              <div style={styles.half}>
                  <label style={styles.label}>State *</label>
                  <select style={styles.select} name="country" onChange={handleChange} required value={formData.country}>
                      <option value="">--Select--</option>
                      {usStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                  </select>
              </div>
              <div style={styles.half}>
                  <label style={styles.label}>Language *</label>
                  <select style={styles.select} name="language" onChange={handleChange} required>
                      <option value="">--Select--</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="Other">Other</option>
                  </select>
              </div>
           </div>
           
           <div style={styles.row}>
             <div style={styles.half}>
                <label style={styles.label}>Usual Availability *</label>
                <select style={styles.select} name="availability" onChange={handleChange} required>
                 <option value="">--Select--</option><option value="Morning">Morning</option><option value="Afternoon">Afternoon</option><option value="Evening">Evening</option><option value="Flexible">Flexible / Anytime</option>
                </select>
             </div>
             <div style={styles.half}>
                <label style={styles.label}>Preferred Meeting Method *</label>
                <select style={styles.select} name="meeting_preference" onChange={handleChange} required value={formData.meeting_preference}>
                    <option value="All">Any / All</option>
                    <option value="Google Meet">Google Meet / Video</option>
                    <option value="Zoom">Zoom</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Jitsi">Jitsi</option>
                </select>
             </div>
           </div>

           <div style={styles.row}>
             <div style={styles.half}>
                <label style={styles.label}>Learning Preference *</label>
                <select style={styles.select} name="learning_preferences" onChange={handleChange} required>
                    <option value="">--Select--</option>
                    <option value="Deep dive">Deep dive</option>
                    <option value="Co-work sessions">Co-work sessions</option>
                    <option value="General program navigation">General program navigation</option>
                    <option value="Flexible">Flexible</option>
                </select>
             </div>
           </div>

           {/* --- CONDITIONAL RENDER: MATCHING PREFERENCE & CAPACITIES --- */}
           
           {/* Skip Matching Preference if targeting a specific volunteer! */}
           {!targetVolunteerId && (
               <div>
                  <label style={styles.label}>Matching Priority (How should we pair you?) *</label>
                  <select style={styles.select} name="match_preference" onChange={handleChange} required value={formData.match_preference}>
                      <option value="">--Select Priority--</option>
                      <option value="State">Match me with a peer in the same state</option>
                      <option value="Global">Match me with any peer around the country (Fastest)</option>
                  </select>
               </div>
           )}

           {/* Group Size - ONLY for Group Squad */}
           {connectionType === 'group' && (
             <div>
                <label style={styles.label}>Preferred Group Size *</label>
                <select style={styles.select} name="group_size" onChange={handleChange} required>
                    <option value="">--Select Size--</option>
                    <option value="3">Group of 3</option>
                    <option value="5">Group of 5</option>
                </select>
             </div>
           )}

           {/* Volunteer Capacity - ONLY for Offering Support */}
           {connectionType === 'offer' && (
              <div style={{background: '#f0fdf4', padding: '15px', borderRadius: '8px', border: `1px solid ${colors.primary.springGreen}`}}>
                <label style={{...styles.label, color: '#085041'}}>Volunteer Capacity (How many peers can you support?) *</label>
                <select style={styles.select} name="volunteer_capacity" onChange={handleChange} required>
                    <option value="">--Select Capacity--</option>
                    <option value="3">Up to 3 Learners</option>
                    <option value="5">Up to 5 Learners</option>
                    <option value="7">Up to 7 Learners</option>
                    <option value="10">Up to 10 Learners</option>
                </select>
                <p style={{fontSize: '0.8rem', color: '#0f766e', marginTop: '5px'}}>
                  Your profile will appear in the Marketplace. We will match learners to you until you hit this limit.
                </p>
              </div>
           )}

           <div style={styles.checkboxContainer}>
                <input type="checkbox" name="disclaimer_agree" onChange={handleChange} required style={{accentColor: colors.primary.iris}}/>
                <label style={{marginLeft:'10px', fontSize: '0.9rem', color: '#555'}}>
                    I accept the <Link to="/disclaimer" target="_blank" style={{color: colors.primary.iris, textDecoration: 'underline', fontWeight: 'bold'}}>Disclaimer</Link>.
                </label>
           </div>

           <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? <div style={{display:'flex', gap:'10px', justifyContent:'center'}}><Spinner size="20px" color="white" /> Processing & Searching...</div> : targetVolunteerId ? "Pair Instantly" : "Submit Request"}
           </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: colors.primary.berkeleyBlue, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: fonts.main },
  backBtn: { alignSelf: 'flex-start', marginBottom: '20px', background: 'transparent', border: `1px solid ${colors.secondary.electricBlue}`, color: colors.secondary.electricBlue, padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' },
  card: { background: colors.primary.white, padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  header: { textAlign: 'center', color: colors.primary.berkeleyBlue, marginBottom: '0.5rem', fontSize: '1.8rem', fontWeight: 'bold' },
  warningBox: { background: '#fffbf0', border: `1px solid ${colors.secondary.gold}`, borderRadius: '12px', padding: '15px', marginBottom: '25px', color: '#856404' },
  warningTitle: { margin: '0 0 10px 0', fontSize: '1rem', color: colors.secondary.tomato },
  warningList: { paddingLeft: '20px', margin: 0, fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  row: { display: 'flex', gap: '15px' },
  half: { flex: 1 },
  label: { fontWeight: '600', fontSize: '0.9rem', color: colors.primary.berkeleyBlue, marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box', outlineColor: colors.secondary.electricBlue },
  select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', backgroundColor: 'white', boxSizing: 'border-box', outlineColor: colors.secondary.electricBlue },
  submitButton: { padding: '15px', marginTop: '20px', background: `linear-gradient(45deg, ${colors.primary.iris}, ${colors.secondary.electricBlue})`, border: 'none', borderRadius: '30px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' },
  checkboxContainer: { display: 'flex', alignItems: 'center', marginTop: '10px' },
  primaryBtn: { padding: '12px 24px', background: colors.primary.iris, color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
  secondaryBtn: { padding: '12px 24px', background: 'white', color: colors.primary.iris, border: `1px solid ${colors.primary.iris}`, borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }
};

export default RegisterPage;

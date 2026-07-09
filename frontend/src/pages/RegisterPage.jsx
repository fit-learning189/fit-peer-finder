import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { colors, fonts } from '../theme';
import Spinner from '../components/Spinner';
import { API_URL } from '../config';

// --- FULL LIST OF COUNTRIES ---
const africanCountries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde",
  "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo (Brazzaville)",
  "Congo (Kinshasa)", "Côte d'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea",
  "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea",
  "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger",
  "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles",
  "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania",
  "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe", "Non-African"
];

// --- TIME ZONE MAPPING ---
const countryToTimezone = {
  "Algeria": "UTC+1", "Angola": "UTC+1", "Benin": "UTC+1", "Botswana": "UTC+2", "Burkina Faso": "UTC", "Burundi": "UTC+2", "Cabo Verde": "UTC-1",
  "Cameroon": "UTC+1", "Central African Republic": "UTC+1", "Chad": "UTC+1", "Comoros": "UTC+3", "Congo (Brazzaville)": "UTC+1",
  "Congo (Kinshasa)": "UTC+1", "Côte d'Ivoire": "UTC", "Djibouti": "UTC+3", "Egypt": "UTC+2", "Equatorial Guinea": "UTC+1",
  "Eritrea": "UTC+3", "Eswatini": "UTC+2", "Ethiopia": "UTC+3", "Gabon": "UTC+1", "Gambia": "UTC", "Ghana": "UTC", "Guinea": "UTC",
  "Guinea-Bissau": "UTC", "Kenya": "UTC+3", "Lesotho": "UTC+2", "Liberia": "UTC", "Libya": "UTC+2", "Madagascar": "UTC+3", "Malawi": "UTC+2",
  "Mali": "UTC", "Mauritania": "UTC", "Mauritius": "UTC+4", "Morocco": "UTC+1", "Mozambique": "UTC+2", "Namibia": "UTC+2", "Niger": "UTC+1",
  "Nigeria": "UTC+1", "Rwanda": "UTC+2", "Sao Tome and Principe": "UTC", "Senegal": "UTC", "Seychelles": "UTC+4",
  "Sierra Leone": "UTC", "Somalia": "UTC+3", "South Africa": "UTC+2", "South Sudan": "UTC+2", "Sudan": "UTC+2", "Tanzania": "UTC+3",
  "Togo": "UTC", "Tunisia": "UTC+1", "Uganda": "UTC+3", "Zambia": "UTC+2", "Zimbabwe": "UTC+2"
};

// --- HELPER: GENERATE UTC OFFSETS FOR NON-AFRICAN (-12 to +14) ---
const utcOffsets = Array.from({ length: 27 }, (_, i) => {
  const offset = i - 12;
  return offset >= 0 ? `+${offset}` : `${offset}`;
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Extract state passed from LandingPage or VolunteerMarketplace
  const program = location.state?.program || 'AiCE';
  const course = location.state?.course || 'Unknown Course';
  const connectionType = location.state?.connectionType || 'find';
  const targetVolunteerId = location.state?.targetVolunteerId || null;

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', country: '', timezone: '', language: '',
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

    // Auto-fill timezone when country changes
    if (name === 'country') {
        if (value === 'Non-African') {
            setFormData({ ...formData, country: value, timezone: '' }); // Clear it so they can pick
        } else {
            const tz = countryToTimezone[value] || '';
            setFormData({ ...formData, country: value, timezone: tz });
        }
    } else {
        setFormData({ ...formData, [name]: value });
    }
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
             <div style={styles.half}><label style={styles.label}>Email Address(ALX registered) *</label><input style={styles.input} name="email" type="email" onChange={handleChange} required /></div>
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
                  <label style={styles.label}>Country *</label>
                  <select style={styles.select} name="country" onChange={handleChange} required>
                      <option value="">--Select--</option>
                      {africanCountries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                  </select>
              </div>
              <div style={styles.half}>
                  <label style={styles.label}>Time Zone *</label>
                  {/* SMART TIMEZONE INPUT */}
                  {formData.country === 'Non-African' ? (
                      <div style={styles.tzWrapper}>
                          <span style={{ fontWeight: 'bold', color: '#555' }}>UTC</span>
                          <select style={styles.tzSelect} name="timezone" onChange={handleChange} required value={formData.timezone}>
                              <option value="">--</option>
                              {utcOffsets.map(off => <option key={off} value={`UTC${off}`}>{off}</option>)}
                          </select>
                      </div>
                  ) : (
                      <input 
                          style={{...styles.input, backgroundColor: '#f5f5f5', color: '#888', cursor: 'not-allowed'}} 
                          name="timezone" value={formData.timezone} readOnly placeholder="Auto-filled by country" required 
                      />
                  )}
              </div>
           </div>
           
           <div style={styles.row}>
             <div style={styles.half}>
                  <label style={styles.label}>Language *</label>
                  <select style={styles.select} name="language" onChange={handleChange} required>
                      <option value="">--Select--</option>
                      <option value="English">English</option>
                      <option value="French">French</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Amharic">Amharic</option>
                  </select>
              </div>
             <div style={styles.half}>
                <label style={styles.label}>Usual Availability *</label>
                <select style={styles.select} name="availability" onChange={handleChange} required>
                 <option value="">--Select--</option><option value="Morning">Morning</option><option value="Afternoon">Afternoon</option><option value="Evening">Evening</option><option value="Flexible">Flexible / Anytime</option>
                </select>
             </div>
           </div>

           <div style={styles.row}>
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
                      <option value="Country">Match me with a peer in the same country</option>
                      <option value="Timezone">Match me with a peer in the same country OR time zone (Fast)</option>
                      <option value="Buffer">Match me with any peer within +/- 2 hours range (Faster)</option>
                      <option value="Global">Match me with any peer around the world (Fastest)</option>
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
  tzWrapper: { display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #ddd', borderRadius: '8px', paddingLeft: '12px', overflow: 'hidden' },
  tzSelect: { border: 'none', background: 'transparent', width: '100%', padding: '12px 5px', outline: 'none', fontSize: '1rem', cursor: 'pointer' },
  submitButton: { padding: '15px', marginTop: '20px', background: `linear-gradient(45deg, ${colors.primary.iris}, ${colors.secondary.electricBlue})`, border: 'none', borderRadius: '30px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' },
  checkboxContainer: { display: 'flex', alignItems: 'center', marginTop: '10px' },
  primaryBtn: { padding: '12px 24px', background: colors.primary.iris, color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
  secondaryBtn: { padding: '12px 24px', background: 'white', color: colors.primary.iris, border: `1px solid ${colors.primary.iris}`, borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }
};

export default RegisterPage;

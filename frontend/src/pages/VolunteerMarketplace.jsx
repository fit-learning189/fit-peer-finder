import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { colors, fonts } from '../theme';
import Spinner from '../components/Spinner';
import { API_URL } from '../config';

const VolunteerMarketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { program, course } = location.state || {};

  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  // If someone lands here without going through the landing page, send them back
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
      if (res.data.success) {
        setVolunteers(res.data.volunteers || []);
      } else {
        setVolunteers([]);
      }
    } catch (err) {
      console.error("Error fetching marketplace data", err);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePairClick = (volunteerId) => {
    navigate('/register', { 
      state: { 
        program, 
        course, 
        connectionType: 'need', 
        targetVolunteerId: volunteerId 
      } 
    });
  };

  const handleFallbackQueue = () => {
    navigate('/register', { 
      state: { 
        program, 
        course, 
        connectionType: 'need' 
      } 
    });
  };

  // FILTER: Only show volunteers who have available capacity
  const availableVolunteers = (volunteers || []).filter(vol => 
    (parseInt(vol.current_load) || 0) < (parseInt(vol.capacity) || 3)
  );

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft} onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
          <span style={styles.logoText}>&larr; Back to Home</span>
        </div>
      </nav>

      <div style={styles.header}>
        <h1 style={{margin: '0 0 10px 0', color: 'white'}}>Volunteer Marketplace 🤝</h1>
        <p style={{margin: 0, color: '#ccc', fontSize: '1.1rem'}}>
          Program: <strong>{program}</strong> | Short Course: <strong>{course}</strong>
        </p>
        <p style={{margin: '10px 0 0 0', color: '#aaa', fontSize: '0.95rem'}}>
          Select an available Volunteer to get instant support!
        </p>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px'}}>
            <Spinner size="50px" color="white" />
            <p style={{marginTop: '15px', color: '#ccc'}}>Scanning the network for available volunteers...</p>
          </div>
        ) : availableVolunteers.length === 0 ? (
          <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} style={styles.emptyState}>
            <span style={{fontSize: '3rem'}}>🕵️‍♂️</span>
            <h3 style={{color: colors.primary.berkeleyBlue}}>No volunteers currently available</h3>
            <p style={{color: '#666', marginBottom: '20px'}}>All our volunteers for this short course are currently fully booked or offline.</p>
            <button onClick={handleFallbackQueue} style={styles.fallbackBtn}>
              Join the Priority Queue &rarr;
            </button>
          </motion.div>
        ) : (
          <div style={styles.grid}>
            {availableVolunteers.map((vol, index) => {
              const maxCap = parseInt(vol.capacity) || 3;
              const currentLoad = parseInt(vol.current_load) || 0;
              const progressPercent = (currentLoad / maxCap) * 100;
              
              // Backend safely maps 'pseudonym' to 'name' before sending it here!
              const pseudonym = vol.name || 'Volunteer';

              return (
                <motion.div 
                  key={vol.id} 
                  initial={{opacity: 0, y: 20}} 
                  animate={{opacity: 1, y: 0}} 
                  transition={{delay: index * 0.1}}
                  style={styles.card}
                >
                  <div style={styles.cardHeader}>
                    {/* Replaced conditional gender avatar with a generic superhero avatar */}
                    <div style={styles.avatar}>🦸‍♂️</div>
                    <div style={{flex: 1, overflow: 'hidden'}}>
                      <h3 style={{margin: 0, color: colors.primary.berkeleyBlue, fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{pseudonym}</h3>
                      <div style={{marginTop: '5px'}}>
                        <span style={{fontSize: '0.85rem', background: '#e3f2fd', color: '#0d47a1', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold'}}>
                          Completed {vol.course || course}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.detailsGrid}>
                    <div style={styles.detailItem}><strong>🌍 Country:</strong> {vol.country || 'Global'}</div>
                    <div style={styles.detailItem}><strong>⏱ Timezone:</strong> {vol.timezone || 'Flexible'}</div>
                  </div>

                  <div style={styles.capacitySection}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold', color: '#555'}}>
                      <span>Capacity: {currentLoad} / {maxCap} Peers</span>
                    </div>
                    <div style={styles.progressBarBg}>
                      <motion.div 
                        initial={{width: 0}} 
                        animate={{width: `${progressPercent}%`}} 
                        style={{...styles.progressBarFill, background: `linear-gradient(90deg, ${colors.primary.springGreen}, #27DEF2)`}} 
                      />
                    </div>
                  </div>

                  <button onClick={() => handlePairClick(vol.id)} style={styles.pairBtn}>
                    Get help from {pseudonym}
                  </button>
                </motion.div>
              );
            })}

            {/* Fallback Option */}
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} style={styles.fallbackCard}>
              <h4 style={{margin: '0 0 10px 0', color: colors.primary.berkeleyBlue}}>Don't see a fit?</h4>
              <p style={{margin: '0 0 15px 0', fontSize: '0.9rem', color: '#666'}}>
                Register here to get paired instantly with the next available volunteer.
              </p>
              <button onClick={handleFallbackQueue} style={styles.fallbackBtnOutlined}>
                Join Priority Queue
              </button>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: colors.primary.berkeleyBlue, fontFamily: fonts.main, paddingBottom: '40px' },
  navbar: { padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #eee' },
  logoText: { color: colors.primary.iris, fontWeight: '700', fontSize: '1rem', cursor: 'pointer' },
  header: { padding: '40px 20px', textAlign: 'center', background: colors.primary.berkeleyBlue },
  content: { padding: '0px 20px', maxWidth: '1200px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' },
  avatar: { fontSize: '2.5rem', background: '#f0f0f0', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  detailsGrid: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  detailItem: { fontSize: '0.85rem', color: '#444', background: '#f9f9f9', padding: '8px', borderRadius: '6px' },
  capacitySection: { marginBottom: '20px', background: '#fcfcfc', padding: '12px', borderRadius: '8px', border: '1px solid #f0f0f0' },
  progressBarBg: { width: '100%', height: '10px', background: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '10px', transition: 'width 0.5s ease' },
  pairBtn: { width: '100%', padding: '15px', background: colors.primary.iris, color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '1rem', marginTop: 'auto', cursor: 'pointer', transition: 'transform 0.2s' },
  emptyState: { textAlign: 'center', background: 'white', padding: '50px 20px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', maxWidth: '600px', margin: '0 auto' },
  fallbackBtn: { padding: '15px 30px', background: colors.primary.iris, color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  fallbackCard: { background: '#fff9e6', border: '1px dashed #ffd54f', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  fallbackBtnOutlined: { padding: '12px 20px', background: 'transparent', border: `2px solid ${colors.secondary.gold}`, color: colors.secondary.gold, borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }
};

export default VolunteerMarketplace;

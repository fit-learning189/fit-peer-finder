import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, fonts } from '../theme';
import Spinner from '../components/Spinner';
import { API_URL } from '../config';

const StatusPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(true); 
  
  // Unpair State
  const [unpairModal, setUnpairModal] = useState({ isOpen: false, reqId: null, isMatched: false });
  const [unpairReason, setUnpairReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [ghosterEmail, setGhosterEmail] = useState("");
  const [unpairAction, setUnpairAction] = useState('requeue');
  const [loadingUnpair, setLoadingUnpair] = useState(false); 
  
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, title: '', message: '', type: 'success', redirect: null });
  
  const isDuplicate = location.state?.isDuplicate;

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/status/${encodeURIComponent(userId)}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRequests(res.data);
      } else {
        setError("No active requests found.");
      }
    } catch (err) {
      setError("User not found or error fetching data.");
    } finally {
      setLoadingData(false); 
    }
  };

  useEffect(() => { fetchStatus(); }, [userId]);

  const submitUnpair = async () => {
    if (!unpairReason) {
      alert("Please select a reason");
      return;
    }
    if (unpairReason === "Ghosting / Partner didn't show up" && !ghosterEmail) {
      alert("Please enter the email of the person who ghosted you.");
      return;
    }
    if (unpairReason === "Other" && !customReason) {
      alert("Please specify your reason.");
      return;
    }

    setLoadingUnpair(true);
    try {
      const finalReason = unpairReason === 'Other' ? `Other: ${customReason}` : unpairReason;

      await axios.post(`${API_URL}/api/leave-group`, { 
          user_id: unpairModal.reqId, 
          reason: finalReason,
          ghoster_email: unpairReason === "Ghosting / Partner didn't show up" ? ghosterEmail : null,
          delete_profile: unpairAction === 'delete' 
      });
      
      setUnpairModal({ isOpen: false, reqId: null, isMatched: false });
      setUnpairReason("");
      setCustomReason("");
      setGhosterEmail("");
      
      if (unpairAction === 'delete') {
         setFeedbackModal({ isOpen: true, title: 'Request Deleted', message: 'You have been unpaired and your request has been removed.', type: 'success', redirect: '/' });
      } else {
         setFeedbackModal({ isOpen: true, title: 'Unpaired Successfully', message: 'You have been unpaired and placed back in the matching queue.', type: 'success', redirect: null });
         await fetchStatus(); 
      }
    } catch (err) {
      alert("Error processing request.");
    } finally {
      setLoadingUnpair(false);
    }
  };

  const closeFeedbackModal = () => {
    const redirect = feedbackModal.redirect;
    setFeedbackModal({ ...feedbackModal, isOpen: false });
    if (redirect) navigate(redirect);
  };

  if (error) return <div style={styles.error}>{error}</div>;

  if (loadingData || requests.length === 0) {
    return (
      <div style={{...styles.container, justifyContent: 'center', alignItems: 'center'}}>
        <div style={{ textAlign: 'center' }}>
          <Spinner size="50px" color="white" />
          <h3 style={{ color: 'white', marginTop: '20px' }}>Loading Dashboard...</h3>
          <p style={{ color: '#ccc' }}>Fetching your latest profile and matching data.</p>
        </div>
      </div>
    );
  }

  // Split requests into Matched and Queued
  const matchedRequests = requests.filter(req => req.matched);
  const queuedRequests = requests.filter(req => !req.matched);
  
  // Extract user's first name for the welcome message
  const userName = requests[0]?.user?.name ? requests[0].user.name.split(' ')[0] : 'Learner';
  const totalCourses = requests.length;

  return (
    <div style={styles.container}>
      
      {/* DASHBOARD HEADER */}
      <div style={styles.dashboardHeader}>
        <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={styles.dashboardTitle}>
          Welcome back, {userName}! 👋
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={styles.dashboardSubtitle}>
          You have requested support in <strong>{totalCourses}</strong> short course{totalCourses > 1 ? 's' : ''} so far.
        </motion.p>
      </div>

      {isDuplicate && (
        <div style={{...styles.duplicateWarning, maxWidth: '800px', width: '100%', marginBottom: '30px'}}>
          ⚠️ <strong>You recently tried to re-register!</strong><br/>
          We found your existing active profile. Here is your current live status below.
        </div>
      )}

      {/* TWO-COLUMN GRID LAYOUT */}
      <div style={styles.gridContainer}>
        
        {/* LEFT COLUMN: MATCHED REQUESTS */}
        <div style={styles.column}>
          <h3 style={styles.columnTitle}>🎉 Active Connections ({matchedRequests.length})</h3>
          
          {matchedRequests.length === 0 && (
             <div style={styles.emptyColBox}>No active pairings yet.</div>
          )}

          {matchedRequests.map((req, idx) => {
            const isVolunteer = req.user?.connection_type === 'offer';
            const isNeeder = req.user?.connection_type === 'need';
            const capacity = parseInt(req.user?.volunteer_capacity) || 0;
            const currentPeersCount = req.group ? req.group.filter(p => p.connection_type === 'need').length : 0;
            const remaining = capacity - currentPeersCount;
            
            return (
              <motion.div key={req.real_id || `match-${idx}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.1 }} style={styles.card}>
                <div style={styles.header}>
                    <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: 'bold' }}>{req.user.program}</p>
                    <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>{req.user.course}</p>
                </div>
                
                <div style={styles.body}>
                  <div style={styles.successBadge}>✓ MATCHED</div>

                  {isVolunteer && (
                      <div style={styles.customMsgBox}>
                          <h4 style={{margin: '0 0 5px 0', color: colors.primary.berkeleyBlue}}>🦸‍♂️ Volunteer Status</h4>
                          {remaining > 0 ? (
                              <p style={{margin: 0, color: colors.primary.iris}}>
                                  <strong>{currentPeersCount}</strong> peer(s) paired. <br/>
                                  <strong>{remaining}</strong> spots left.
                              </p>
                          ) : (
                              <p style={{margin: 0, color: 'green'}}><strong>Your group is full!</strong></p>
                          )}
                      </div>
                  )}
                  {isNeeder && (
                      <div style={{...styles.customMsgBox, background: '#e8f5e9', border: '1px solid #c8e6c9'}}>
                          <h4 style={{margin: '0 0 5px 0', color: '#2e7d32'}}>🎉 Support Found!</h4>
                          <p style={{margin: 0, color: '#1b5e20'}}>You are paired with a Volunteer ready to support you!</p>
                      </div>
                  )}

                  <h3 style={{ color: colors.primary.berkeleyBlue, fontSize: '1.1rem' }}>Your Group Members:</h3>
                  
                  {req.group.map((peer, peerIdx) => (
                    <div key={peerIdx} style={{ background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: `5px solid ${colors.secondary.electricBlue}` }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1rem' }}>{peer.name}</p>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '0.85rem' }}>📧 {peer.email}</p>
                      <p style={{ margin: '0 0 10px 0', color: '#555', fontSize: '0.85rem' }}>
                        Role: <strong>{peer.connection_type === 'offer' ? 'Volunteer ⭐' : peer.connection_type === 'need' ? 'Peer' : 'Study Buddy'}</strong><br/>
                        Prefers: <strong>{peer.meeting_preference || 'All'}</strong>
                      </p>
                      
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a href={`https://wa.me/${peer.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>💬 WhatsApp</a>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: '20px', background: '#e3f2fd', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #b8daff' }}>
                      <h4 style={{ color: '#0056b3', margin: '0 0 5px 0', fontSize: '1rem' }}>🎥 Video Room</h4>
                      <a href={`https://meet.jit.si/ALX-PeerFinder-${req.real_id || req.group[0]?.name.replace(/\s/g,'')}`} target="_blank" rel="noreferrer" style={{ background: '#0056b3', color: 'white', padding: '10px 20px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-block', marginTop: '5px' }}>Join Meeting</a>
                  </div>

                  <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button onClick={() => { setUnpairAction('requeue'); setUnpairModal({ isOpen: true, reqId: req.real_id, isMatched: true }); }} style={styles.unpairBtn}>Unpair / Leave Group</button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* RIGHT COLUMN: QUEUED REQUESTS */}
        <div style={styles.column}>
          <h3 style={styles.columnTitle}>⏳ In Queue ({queuedRequests.length})</h3>
          
          {queuedRequests.length === 0 && (
             <div style={styles.emptyColBox}>No pending requests.</div>
          )}

          {queuedRequests.map((req, idx) => (
            <motion.div key={req.real_id || `queue-${idx}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.1 }} style={styles.card}>
              <div style={{...styles.header, background: colors.secondary.electricBlue}}>
                  <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: 'bold' }}>{req.user.program}</p>
                  <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>{req.user.course}</p>
              </div>
              
              <div style={styles.body}>
                <div style={{ textAlign: 'center' }}>
                  <div style={styles.pendingBadge}>⏳ WAITING FOR MATCH</div>
                  <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: '20px' }}>
                    Hang in there! we are working hard to find you the perfect peer. You will receive an email the moment a match is found!
                  </p>
                  
                  <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                      <button onClick={() => { setUnpairAction('delete'); setUnpairModal({ isOpen: true, reqId: req.real_id, isMatched: false }); }} style={{...styles.unpairBtn, background: 'transparent', border: `1px solid ${colors.secondary.tomato}`, color: colors.secondary.tomato}}>Cancel Request</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>

      <div style={{marginTop: '40px'}}>
         <button onClick={() => navigate('/')} style={styles.homeBtn}>&larr; Return to Home</button>
      </div>

      {/* --- UNPAIR MODAL --- */}
      <AnimatePresence>
        {unpairModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalOverlay}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={styles.modalContent}>
              <h3 style={{ marginTop: 0, color: colors.primary.berkeleyBlue }}>{unpairAction === 'delete' ? 'Delete Request' : 'Unpair Confirmation'}</h3>
              
              {unpairModal.isMatched && (
                  <p style={{ color: '#666', fontSize: '0.95rem' }}>Are you sure you want to unpair? Please let your partner(s) know first to be courteous.</p>
              )}
              
              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>Reason for leaving:</label>
                  <select style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} onChange={(e) => setUnpairReason(e.target.value)} value={unpairReason}>
                      <option value="">-- Select Reason --</option>
                      <option value="Ghosting / Partner didn't show up">Ghosting / Partner didn't show up</option>
                      <option value="Schedule Conflict">Schedule Conflict</option>
                      <option value="Already completed short course">Already completed short course</option>
                      <option value="Just Testing the App">Just Testing the App</option>
                      <option value="Other">Other</option>
                  </select>
              </div>

              <AnimatePresence>
                {unpairReason === "Ghosting / Partner didn't show up" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{marginTop: '10px', textAlign: 'left', overflow: 'hidden'}}>
                    <label style={{fontSize: '0.85rem', fontWeight: 'bold', color: '#c62828', display: 'block', marginBottom: '5px'}}>Flag the No-Show Learner</label>
                    <input type="email" placeholder="Ghoster's ALX Email" value={ghosterEmail} onChange={(e) => setGhosterEmail(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ffcdd2', boxSizing: 'border-box'}} required />
                  </motion.div>
                )}
                {unpairReason === 'Other' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{marginTop: '10px', textAlign: 'left', overflow: 'hidden'}}>
                    <label style={{fontSize: '0.85rem', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px'}}>Please specify your reason:</label>
                    <input type="text" placeholder="Type your reason here..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box'}} required />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {unpairModal.isMatched && (
                  <div style={{ textAlign: 'left', marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', marginTop: '15px' }}>
                      <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>What happens next?</label>
                      <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                              <input type="radio" name="unpair_action" checked={unpairAction === 'requeue'} onChange={() => setUnpairAction('requeue')} />
                              <span style={{ fontSize: '0.9rem' }}>Put me back in the queue for a new match</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                              <input type="radio" name="unpair_action" checked={unpairAction === 'delete'} onChange={() => setUnpairAction('delete')} />
                              <span style={{ fontSize: '0.9rem', color: colors.secondary.tomato }}>Delete my profile (I no longer need support)</span>
                          </label>
                      </div>
                  </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setUnpairModal({ isOpen: false, reqId: null, isMatched: false })} style={{ flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }} disabled={loadingUnpair}>Cancel</button>
                  <button onClick={submitUnpair} style={{ flex: 1, padding: '10px', background: colors.secondary.tomato, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center' }} disabled={loadingUnpair}>
                      {loadingUnpair ? <Spinner size="15px" color="white" /> : "Confirm"}
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedbackModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalOverlay}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={styles.modalContent}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{feedbackModal.type === 'success' ? '✅' : '❌'}</div>
              <h2 style={{ color: colors.primary.berkeleyBlue, margin: '0 0 10px 0' }}>{feedbackModal.title}</h2>
              <p style={{ color: '#555', marginBottom: '20px' }}>{feedbackModal.message}</p>
              <button onClick={closeFeedbackModal} style={styles.modalOkBtn}>OK</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: colors.primary.berkeleyBlue, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: fonts.main },
  error: { color: 'red', marginTop: '50px', fontSize: '1.2rem' },
  
  dashboardHeader: { textAlign: 'center', color: 'white', marginBottom: '40px' },
  dashboardTitle: { fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: 'bold' },
  dashboardSubtitle: { fontSize: '1.1rem', opacity: 0.8, margin: 0 },
  
  gridContainer: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '30px', width: '100%', maxWidth: '1000px', justifyContent: 'center', alignItems: 'flex-start' },
  column: { flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' },
  columnTitle: { color: 'white', borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '10px', margin: '0 0 10px 0', fontSize: '1.2rem' },
  emptyColBox: { background: 'rgba(255,255,255,0.1)', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', fontStyle: 'italic', border: '1px dashed rgba(255,255,255,0.3)' },

  card: { background: 'white', width: '100%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  header: { background: colors.primary.berkeleyBlue, color: 'white', padding: '20px', textAlign: 'center', borderBottom: `4px solid ${colors.secondary.gold}` },
  body: { padding: '20px' },
  duplicateWarning: { background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', fontSize: '0.95rem', border: '1px solid #ffeeba', textAlign: 'center' },
  successBadge: { background: '#d4edda', color: '#155724', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '15px' },
  pendingBadge: { background: '#e2e3e5', color: '#383d41', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '15px' },
  customMsgBox: { background: '#f8f9fa', border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '15px' },
  
  homeBtn: { padding: '12px 24px', background: 'transparent', border: `2px solid white`, color: 'white', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' },
  unpairBtn: { width: '100%', padding: '10px', background: 'transparent', border: `1px solid ${colors.secondary.tomato}`, color: colors.secondary.tomato, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 43, 86, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '2rem', borderRadius: '15px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalOkBtn: { padding: '12px 30px', background: colors.primary.iris, color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
};

export default StatusPage;
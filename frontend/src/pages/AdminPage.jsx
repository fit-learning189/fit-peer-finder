import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, fonts } from '../theme';
import Spinner from '../components/Spinner';
import { API_URL } from '../config';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filterText, setFilterText] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [programFilter, setProgramFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentGroupPage, setCurrentGroupPage] = useState(1);
  const groupsPerPage = 21;
  const [modal, setModal] = useState({ isOpen: false, type: null, title: '', message: '', isSuccess: false, action: null });

  // --- LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/data`, { password });
      if (res.data.success) {
        setData(res.data);
        setIsAuthenticated(true);
      }
    } catch (err) { alert("Login Failed"); }
    finally { setLoading(false); }
  };

  const refreshData = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/data`, { password });
      setData(res.data);
      setSelectedIds([]);
    } catch (err) { console.error(err); }
  };

  // --- ACTIONS ---
  const initiateRandomPair = (userId, userName) => {
    setModal({
      isOpen: true, type: 'confirm', title: 'Confirm Random Pairing',
      message: `Pair ${userName} with ANY available learner matching their group preference?`,
      action: () => executePairing('random-pair', { user_id: userId })
    });
  };

  const initiateManualPair = () => {
    setModal({
      isOpen: true, type: 'confirm', title: 'Confirm Manual Pairing',
      message: `Force pair these ${selectedIds.length} users?`,
      action: () => executePairing('manual-pair', { user_ids: selectedIds })
    });
  };

  const initiateUnpairGroup = (userId, groupName) => {
    setModal({
      isOpen: true, type: 'confirm', title: 'Dissolve Group?',
      message: `Unpair everyone in ${groupName}?`,
      action: () => executeUnpair(userId)
    });
  };

  const executeAutoMatchQueue = () => {
    setModal({
      isOpen: true, type: 'confirm', title: 'Run Auto-Match on Queue?',
      message: `This will loop through ALL learners and automatically pair them up based on Short Course and availability. Proceed?`,
      action: async () => {
        setModal({ ...modal, isOpen: false });
        setLoading(true);
        try {
          // Timeout set to 90s — backend sends emails in background so response is quick,
          // but give extra headroom for large CSV downloads on Render free tier
          const res = await axios.post(`${API_URL}/api/admin/auto-match-queue`, { password }, { timeout: 90000 });
          handleResult(res.data.success, res.data.message);
        } catch (err) {
          const msg = err.code === 'ECONNABORTED'
            ? 'The request timed out. The auto-match may still be running on the server — refresh the page in a few seconds to check.'
            : (err.response?.data?.error || err.message);
          handleResult(false, msg);
        } finally { setLoading(false); }
      }
    });
  };

  // Smart Nudge Engine
  const executeFeedbackNudge = () => {
    setModal({
      isOpen: true, type: 'confirm', title: 'Send Feedback Nudges?',
      message: `This will instantly email a reminder to all learners who were matched over 3 days ago but haven't submitted their Confirm Connection feedback. Proceed?`,
      action: async () => {
        setModal({ ...modal, isOpen: false });
        setLoading(true);
        try {
          const res = await axios.post(`${API_URL}/api/admin/nudge-feedback`, { password });
          handleResult(res.data.success, res.data.message);
        } catch (err) {
          handleResult(false, err.response?.data?.error || err.message);
        } finally { setLoading(false); }
      }
    });
  };

  const executePairing = async (endpoint, payload) => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/${endpoint}`, { password, ...payload });
      handleResult(res.data.success, res.data.message);
    } catch (err) { handleResult(false, err.response?.data?.error || err.message); }
  };

  const executeUnpair = async (userId) => {
    try {
      // FIX: was hitting /api/unpair/:id which doesn't exist — correct route is /api/leave-group
      const res = await axios.post(`${API_URL}/api/leave-group`, { user_id: userId, reason: "Admin Dissolved Group", delete_profile: false });
      handleResult(res.data.success, "Group dissolved.");
    } catch (err) { handleResult(false, err.response?.data?.error || err.message); }
  };

  const handleResult = (success, msg) => {
    setModal({ isOpen: true, type: 'result', title: success ? 'Success! 🎉' : 'Failed ❌', message: msg, isSuccess: success, action: null });
    if (success) refreshData();
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });
  const toggleSelection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // --- DOWNLOADS ---
  const downloadCSV = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/download`, { password }, { responseType: 'blob' });
      triggerDownload(res.data, 'peer_data.csv');
    } catch (err) { alert("Download failed"); }
  };

  const downloadFeedback = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/download-feedback`, { password }, { responseType: 'blob' });
      triggerDownload(res.data, 'tool_feedback.csv');
    } catch (err) { alert("Feedback download failed"); }
  };

  const downloadSessionFeedback = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/download-session-feedback`, { password }, { responseType: 'blob' });
      triggerDownload(res.data, 'peer_session_feedback.csv');
    } catch (err) { alert("Session Feedback download failed"); }
  };

  const downloadUnpairReasons = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/download-unpair-reasons`, { password }, { responseType: 'blob' });
      triggerDownload(res.data, 'unpair_reason_data.csv');
    } catch (err) { alert("Failed to download Unpair Reasons"); }
  };

  const triggerDownload = (data, filename) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', filename);
    document.body.appendChild(link); link.click();
  };

  const getDaysSince = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  };

  if (!isAuthenticated) return <LoginScreen handleLogin={handleLogin} password={password} setPassword={setPassword} loading={loading} />;

  // Filter Data
  const programLearners = data?.learners ? data.learners.filter(l => programFilter === "All" || l.program === programFilter) : [];

  const unpairedList = programLearners
    .filter(l => !l.matched)
    .filter(l => l.name.toLowerCase().includes(filterText.toLowerCase()) || l.email.toLowerCase().includes(filterText.toLowerCase()) || l.course?.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => getDaysSince(b.timestamp) - getDaysSince(a.timestamp));

  const matchedGroups = programLearners.reduce((acc, curr) => {
    if (curr.matched && curr.group_id) {
      if (!acc[curr.group_id]) acc[curr.group_id] = [];
      acc[curr.group_id].push(curr);
    }
    return acc;
  }, {});

  const filteredGroupsArray = Object.entries(matchedGroups).filter(([groupId, members]) => {
    if (!filterText) return true;
    const lowerFilter = filterText.toLowerCase();
    return members.some(m => m.name.toLowerCase().includes(lowerFilter) || m.email.toLowerCase().includes(lowerFilter));
  });

  const totalGroupPages = Math.ceil(filteredGroupsArray.length / groupsPerPage);
  const paginatedGroups = filteredGroupsArray.slice((currentGroupPage - 1) * groupsPerPage, currentGroupPage * groupsPerPage);

  const courses = {}; const countries = {}; const daysUnpaired = {};
  programLearners.forEach(l => {
    const courseName = l.course || 'Unknown';
    courses[courseName] = (courses[courseName] || 0) + 1;
    const ctry = l.country || 'Unknown'; countries[ctry] = (countries[ctry] || 0) + 1;
    if (!l.matched) {
      const d = getDaysSince(l.timestamp);
      const bucket = d > 10 ? '10+' : d.toString();
      daysUnpaired[bucket] = (daysUnpaired[bucket] || 0) + 1;
    }
  });

  const totalInView = programLearners.length;
  const matchedInView = programLearners.filter(l => l.matched).length;
  const pendingInView = totalInView - matchedInView;
  const matchRate = totalInView > 0 ? ((matchedInView / totalInView) * 100).toFixed(1) + '%' : '0.0%';

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.topBar}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <h1 style={{color: 'white', margin: 0}}>Admin</h1>
          <select value={programFilter} onChange={e => { setProgramFilter(e.target.value); setCurrentGroupPage(1); }} style={styles.programSelect}>
            <option value="All">All Programs</option><option value="VA">Virtual Assistant</option><option value="AiCE">AI Career Essentials</option>
            <option value="PF">Professional Foundation</option><option value="CC">Content Creation</option><option value="GD">Graphic Design</option>
          </select>
        </div>
        <div style={{display:'flex', gap:'10px', flexWrap: 'wrap'}}>
          <button onClick={downloadCSV} style={styles.btnSecondary}>Main Data</button>
          <button onClick={downloadFeedback} style={{...styles.btnSecondary, background: colors.secondary.tomato, color:'white'}}>Tool Feedback</button>
          <button onClick={downloadSessionFeedback} style={{...styles.btnSecondary, background: colors.primary.springGreen, color: colors.primary.berkeleyBlue}}>Session Ratings</button>
          <button onClick={downloadUnpairReasons} style={{...styles.btnSecondary, background: '#FF9800', color: 'white'}}>Disconnects</button>
        </div>
      </div>
      
      <div style={styles.tabs}>
        <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Analytics" />
        <TabButton active={activeTab === 'unpaired'} onClick={() => setActiveTab('unpaired')} label={`Unpaired (${unpairedList.length})`} />
        <TabButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} label={`Active Groups (${filteredGroupsArray.length})`} />
      </div>

      <div style={styles.contentArea}>
        {activeTab === 'dashboard' && (
          <div>
            <div style={styles.statsGrid}>
              <StatCard title="Total Learners" value={totalInView} color={colors.primary.iris} emoji="👥" />
              <StatCard title="Match Rate" value={matchRate} sub={`(${matchedInView})`} color={colors.primary.springGreen} emoji="🎯" />
              <StatCard title="Pending Queue" value={pendingInView} color={colors.secondary.gold} emoji="⏳" />
              <StatCard title="Overall Rating" value={data?.stats?.tool_rating || 'N/A'} color="#e83e8c" emoji="⭐" />
              <StatCard title="Unpaired Needs" value={unpairedList.filter(l => l.connection_type === 'need').length} color={colors.secondary.tomato} emoji="🆘" />
              <StatCard title="Unpaired Volunteers" value={unpairedList.filter(l => l.connection_type === 'offer').length} color="#FF9800" emoji="🌟" />
            </div>

            <div style={styles.chartsGrid}>
              <ChartBox title="By Short Course" data={courses} color={colors.primary.iris} />
              <ChartBox title="Unpaired Days" data={daysUnpaired} color={colors.secondary.tomato} />
              <ChartBox title="By Country" data={countries} color={colors.secondary.electricBlue} wide />
            </div>
          </div>
        )}

        {activeTab === 'unpaired' && (
          <div>
            <div style={styles.filterBar}>
              <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                <input placeholder="Search by name or email..." style={styles.filterInput} value={filterText} onChange={e => setFilterText(e.target.value)} />
                <button
                  style={{...styles.btnPrimary, width: 'auto', background: colors.secondary.electricBlue, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}
                  onClick={executeAutoMatchQueue}
                >
                  ⚡ Auto-Match Queue
                </button>
              </div>
              <AnimatePresence>
                {selectedIds.length >= 2 && (
                  <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={styles.fab} onClick={initiateManualPair}>
                    Pair Selected ({selectedIds.length}) 🔗
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr><th>Select</th><th>Days</th><th>Name</th><th>Country</th><th>Time Zone</th><th>Program</th><th>Short Course</th><th>Request Type</th><th>Pref</th><th>Size/Cap</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {unpairedList.map(l => (
                    <tr key={l.id} style={selectedIds.includes(l.id) ? styles.trSelected : styles.tr}>
                      <td><input type="checkbox" checked={selectedIds.includes(l.id)} onChange={() => toggleSelection(l.id)} style={{cursor:'pointer'}} /></td>
                      <td><span style={styles.badge}>{getDaysSince(l.timestamp)}d</span></td>
                      <td><strong>{l.name}</strong><br/><span style={styles.subText}>{l.email}</span></td>
                      <td>{l.country || '-'}</td>
                      <td>{l.timezone || '-'}</td>
                      <td>{l.program}</td><td>{l.course}</td>
                      <td>{l.connection_type.toUpperCase()}</td>
                      <td>{l.match_preference || 'N/A'}</td>
                      <td>{l.connection_type === 'group' ? l.group_size : l.connection_type === 'offer' ? l.volunteer_capacity : '2'}</td>
                      <td><button style={styles.btnSmall} onClick={() => initiateRandomPair(l.id, l.name)}>Random 🎲</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            <div style={styles.filterBar}>
              <input placeholder="Search groups by learner name or email..." style={styles.filterInput} value={filterText} onChange={e => {setFilterText(e.target.value); setCurrentGroupPage(1);}} />
              
              <button
                  style={{...styles.btnPrimary, width: 'auto', background: '#e83e8c', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}
                  onClick={executeFeedbackNudge}
              >
                  🔔 Send Feedback Nudges
              </button>
            </div>
            
            <div style={styles.groupsGrid}>
              {paginatedGroups.map(([groupId, members]) => (
                <div key={groupId} style={styles.groupCard}>
                  <div style={styles.groupHeader}>
                    <span style={{fontWeight:'bold', color: colors.primary.berkeleyBlue}}>{members[0].program}: {members[0].course} ({members.length})</span>
                    <button style={styles.btnUnpair} onClick={() => initiateUnpairGroup(members[0].id, members[0].course + " Group")}>Unpair 🚫</button>
                  </div>
                  <div style={styles.groupMembers}>
                    {members.map(m => (
                      <div key={m.id} style={styles.memberChip}>
                        <span style={{fontWeight:'bold'}}>{m.name}</span> <span style={styles.subText}>| {m.email}</span><br/>
                        <span style={{fontSize:'0.8rem', color: colors.primary.iris}}>
                          Role: <strong>{m.connection_type.toUpperCase()}</strong> | TZ: <strong>{m.timezone || 'N/A'}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {totalGroupPages > 1 && (
              <div style={styles.paginationContainer}>
                <button style={currentGroupPage === 1 ? styles.pageBtnDisabled : styles.pageBtn} disabled={currentGroupPage === 1} onClick={() => setCurrentGroupPage(p => p - 1)}>&larr; Previous</button>
                <span style={styles.pageText}>Page {currentGroupPage} of {totalGroupPages}</span>
                <button style={currentGroupPage === totalGroupPages ? styles.pageBtnDisabled : styles.pageBtn} disabled={currentGroupPage === totalGroupPages} onClick={() => setCurrentGroupPage(p => p + 1)}>Next &rarr;</button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div style={styles.modalOverlay}>
          <Spinner size="40px" color={colors.primary.iris} />
        </div>
      )}

      <AnimatePresence>
        {modal.isOpen && (
          <div style={styles.modalOverlay}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={styles.modalContent}>
              <h2 style={{color: modal.isSuccess ? 'green' : colors.primary.berkeleyBlue}}>{modal.title}</h2>
              <p>{modal.message}</p>
              <div style={styles.modalActions}>
                {modal.type === 'confirm' ? (
                  <>
                    <button onClick={closeModal} style={styles.btnCancel}>Cancel</button>
                    <button onClick={modal.action} style={styles.btnConfirm}>Yes, Proceed</button>
                  </>
                ) : <button onClick={closeModal} style={styles.btnConfirm}>Close</button>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoginScreen = ({ handleLogin, password, setPassword, loading }) => (
  <div style={styles.centerContainer}>
    <div style={styles.card}>
      <h2>Admin Access</h2>
      <form onSubmit={handleLogin}>
        <input type="password" style={styles.input} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        <button style={styles.btnPrimary} disabled={loading}>
          {loading ? <div style={{display:'flex', justifyContent:'center'}}><Spinner size="20px" color="white" /></div> : "Login"}
        </button>
      </form>
    </div>
  </div>
);

const TabButton = ({ active, onClick, label }) => (
  <button style={active ? styles.activeTab : styles.tab} onClick={onClick}>{label}</button>
);

const StatCard = ({ title, value, sub, color, emoji }) => (
  <div style={{...styles.statCard, borderLeft: `5px solid ${color}`}}>
    <div style={{fontSize:'0.9rem', color:'#666', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      {title} <span style={{fontSize:'1.2rem'}}>{emoji}</span>
    </div>
    <div style={{fontSize:'1.8rem', fontWeight:'bold', color: color, marginTop:'5px'}}>
      {value} {sub && <span style={{fontSize:'0.9rem', color:'#888', fontWeight:'normal'}}>{sub}</span>}
    </div>
  </div>
);

const ChartBox = ({ title, data, color, wide }) => {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div style={{...styles.chartBox, gridColumn: wide ? 'span 2' : 'span 1'}}>
      <h3>{title}</h3>
      <div style={styles.chartContainer}>
        {Object.keys(data).length === 0 ? <p style={{fontSize:'0.8rem', color:'#999'}}>No data</p> :
        Object.entries(data).map(([key, val]) => (
          <div key={key} style={styles.barWrapper}>
            <div style={styles.barLabel}>{key}</div>
            <div style={styles.barTrack}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(val / max) * 100}%` }} style={{...styles.barFill, background: color}}>
                <span style={styles.barValue}>{val}</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  centerContainer: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' },
  card: { background: 'white', padding: '2rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width:'100%', maxWidth:'400px' },
  dashboardContainer: { minHeight: '100vh', background: '#f4f6f8', fontFamily: fonts.main },
  topBar: { background: colors.primary.berkeleyBlue, padding: '1rem 2rem', color: 'white', display:'flex', justifyContent:'space-between', flexWrap: 'wrap', gap: '10px' },
  programSelect: { padding: '5px', borderRadius: '5px', marginLeft: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', padding: '20px 0' },
  statCard: { background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  tabs: { padding: '0 20px', display: 'flex', gap: '10px', borderBottom: '1px solid #ddd', flexWrap: 'wrap', marginTop: '10px' },
  tab: { padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', fontSize: '1rem' },
  activeTab: { padding: '10px 20px', background: 'white', borderBottom: `3px solid ${colors.primary.iris}`, fontWeight: 'bold', cursor: 'pointer' },
  contentArea: { padding: '20px' },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  chartBox: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  chartContainer: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
  barWrapper: { display: 'flex', alignItems: 'center', fontSize: '0.9rem' },
  barLabel: { width: '150px', textAlign: 'right', marginRight: '10px', fontWeight: 'bold', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  barTrack: { flex: 1, background: '#f0f0f0', borderRadius: '4px', height: '24px', position: 'relative' },
  barFill: { height: '100%', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '5px' },
  barValue: { color: 'white', fontSize: '0.8rem', fontWeight: 'bold' },
  filterBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems:'center', flexWrap: 'wrap', gap: '10px' },
  filterInput: { padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #ddd' },
  tableWrapper: { background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
  tr: { borderBottom: '1px solid #eee' },
  trSelected: { background: '#e3f2fd', borderBottom: '1px solid #eee' },
  subText: { fontSize: '0.8rem', color: '#666' },
  input: { padding: '12px', width: '100%', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing:'border-box' },
  btnPrimary: { padding: '12px 20px', width:'100%', background: colors.primary.iris, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },
  btnSecondary: { padding: '8px 16px', background: 'white', color: colors.primary.berkeleyBlue, border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
  btnSmall: { padding: '5px 10px', background: '#eee', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize:'0.8rem' },
  btnUnpair: { padding: '5px 10px', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '4px', cursor: 'pointer', fontSize:'0.8rem', fontWeight:'bold' },
  fab: { position: 'fixed', bottom: '30px', right: '30px', padding: '15px 25px', background: colors.primary.iris, color: 'white', borderRadius: '30px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', zIndex: 100 },
  groupsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  groupCard: { background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  groupHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' },
  groupMembers: { display: 'flex', flexDirection: 'column', gap: '8px' },
  memberChip: { padding: '8px', background: '#f9f9f9', borderRadius: '6px', fontSize: '0.9rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '2rem', borderRadius: '10px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalActions: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' },
  btnConfirm: { padding: '8px 20px', background: colors.primary.iris, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },
  btnCancel: { padding: '8px 20px', background: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  badge: { background: '#fff3e0', color: '#e65100', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' },
  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '30px', padding: '10px' },
  pageBtn: { padding: '8px 16px', background: 'white', border: `1px solid ${colors.primary.iris}`, color: colors.primary.iris, borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  pageBtnDisabled: { padding: '8px 16px', background: '#f0f0f0', border: '1px solid #ddd', color: '#aaa', borderRadius: '5px', cursor: 'not-allowed' },
  pageText: { fontWeight: 'bold', color: colors.primary.berkeleyBlue }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `td, th { padding: 12px; text-align: left; } th { background: #f8f9fa; color: #555; }`;
document.head.appendChild(styleSheet);

export default AdminPage;

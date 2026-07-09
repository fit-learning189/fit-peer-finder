import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import our updated and new components
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import VolunteerMarketplace from './pages/VolunteerMarketplace'; // <-- NEW!
import CheckStatusPage from './pages/CheckStatusPage'; // <-- RESTORED!
import StatusPage from './pages/StatusPage'; // <-- The unified dashboard
import AdminPage from './pages/AdminPage'; 
import DisclaimerPage from './pages/DisclaimerPage';
import PeerFeedbackPage from './pages/PeerFeedbackPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* The new Volunteer Marketplace Route */}
        <Route path="/marketplace" element={<VolunteerMarketplace />} />
        
        {/* The Check Status Gateway (The Search Bar) */}
        <Route path="/status/check" element={<CheckStatusPage />} />
        
        {/* The Unified Status Dashboard (Loads the specific user's data) */}
        <Route path="/status/:userId" element={<StatusPage />} />
        
        <Route path="/peer-feedback" element={<PeerFeedbackPage />} />
        <Route path="/admin" element={<AdminPage />} /> 
        <Route path="/disclaimer" element={<DisclaimerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
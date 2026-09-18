import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import VolunteerMarketplace from './pages/VolunteerMarketplace';
import CheckStatusPage from './pages/CheckStatusPage';
import StatusPage from './pages/StatusPage';
import AdminPage from './pages/AdminPage';
import DisclaimerPage from './pages/DisclaimerPage';
import PeerFeedbackPage from './pages/PeerFeedbackPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/marketplace" element={<VolunteerMarketplace />} />

        {/* Status lookup gateway.
            LandingPage navigates to /check-status, so that route must exist —
            previously only /status/check was registered, which made the
            "Check Status" button land on a blank page. Both are kept so any
            existing links or bookmarks continue to work. */}
        <Route path="/check-status" element={<CheckStatusPage />} />
        <Route path="/status/check" element={<CheckStatusPage />} />

        {/* Unified status dashboard. Declared after the static /status/check
            path above; React Router ranks static segments over dynamic ones,
            so "check" is never swallowed as a :userId. */}
        <Route path="/status/:userId" element={<StatusPage />} />

        <Route path="/peer-feedback" element={<PeerFeedbackPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
      </Routes>
    </Router>
  );
}

export default App;

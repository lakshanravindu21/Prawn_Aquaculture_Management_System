import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import CameraFeed from './CameraFeed';
import Predictions from './Predictions';
import Settings from './Settings'; // <--- Import this

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/camera" element={<CameraFeed />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/settings" element={<Settings />} /> {/* <--- Add Route */}
      </Routes>
    </Router>
  );
}

export default App;
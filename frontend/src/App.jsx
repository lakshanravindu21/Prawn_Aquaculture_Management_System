import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import CameraFeed from './CameraFeed';
import Predictions from './Predictions';
import Health from './Health'; // <--- NEW IMPORT
import Settings from './Settings';
import AccountSettings from './AccountSettings';
// Import Auth Pages
import SignIn from './SignIn';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

function App() {
  // 1. Initialize User State from Local Storage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('aquaUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. Login Handler: Save user data & token
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('aquaUser', JSON.stringify(userData));
  };

  // 3. Logout Handler: Clear data
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aquaUser');
    localStorage.removeItem('token'); // Also clear the auth token
  };

  // 4. Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/signin" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES (No Login Needed) --- */}
        <Route 
          path="/signin" 
          element={!user ? <SignIn onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <SignUp onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* --- PROTECTED ROUTES (Login Required) --- */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/camera" 
          element={
            <ProtectedRoute>
              <CameraFeed user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/predictions" 
          element={
            <ProtectedRoute>
              <Predictions user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        {/* New Health Page Route */}
        <Route 
          path="/health" 
          element={
            <ProtectedRoute>
              <Health user={user} onLogout={handleLogout} isDarkMode={false} toggleTheme={() => {}} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/account" 
          element={
            <ProtectedRoute>
              <AccountSettings user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
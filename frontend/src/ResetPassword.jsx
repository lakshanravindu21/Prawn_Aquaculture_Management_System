import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Fingerprint, Eye, EyeOff, CheckCircle2, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './components/AuthLayout';

const API_URL = 'http://localhost:3001/api/auth';

// --- VISUAL: Consistent Input Field ---
const PasswordInput = ({ label, name, value, onChange, showPassword, setShowPassword }) => (
  <div className="mb-6 relative group">
    <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-2 ml-1 tracking-wider group-focus-within:text-teal-600 transition-colors">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors duration-300">
        <Fingerprint className="w-5 h-5" />
      </div>
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 placeholder-slate-400 font-bold text-sm focus:outline-none focus:border-teal-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all duration-300"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-teal-600 transition-colors focus:outline-none"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

export default function ResetPassword() {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Get Token from URL (e.g. ?token=...)
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (passwords.newPassword !== passwords.confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    if (passwords.newPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
    }
    if (!token) {
        setError("Invalid link. Please request a new reset email.");
        return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/reset-password`, { 
        token, 
        newPassword: passwords.newPassword 
      });
      
      setSubmitted(true);
      setTimeout(() => navigate('/signin'), 3000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to reset password. Link might be expired.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
        <AuthLayout title="Password Updated" subtitle="Your security credentials have been refreshed.">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="flex flex-col items-center justify-center text-center py-10"
            >
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-full text-teal-600 mb-6 shadow-sm animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Success!</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium">
                    Redirecting you to the login page...
                </p>
                 <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
        </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set New Password" subtitle="Please enter and confirm your new secure password below.">
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 rounded-r-xl text-xs font-bold flex items-center gap-3 shadow-sm"
        >
           <div className="p-1.5 bg-red-100 rounded-full"><AlertTriangle className="w-3.5 h-3.5" /></div>
           {error}
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit}>
        <PasswordInput 
            label="New Password" 
            name="newPassword" 
            value={passwords.newPassword} 
            onChange={handleChange} 
            showPassword={showPassword} 
            setShowPassword={setShowPassword} 
        />
        <PasswordInput 
            label="Confirm Password" 
            name="confirmPassword" 
            value={passwords.confirmPassword} 
            onChange={handleChange} 
            showPassword={showPassword} 
            setShowPassword={setShowPassword} 
        />

        <motion.button 
            whileHover={{ scale: 1.01, boxShadow: "0 10px 30px -10px rgba(20,184,166,0.5)" }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading} 
            className={`w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all duration-300 uppercase tracking-widest text-xs ${loading ? 'opacity-80 cursor-wait' : ''}`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 Updating...
            </div>
          ) : (
            <>
              Update Password <RefreshCw className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>
    </AuthLayout>
  );
}
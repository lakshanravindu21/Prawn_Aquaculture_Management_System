import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Fingerprint, Eye, EyeOff, ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './components/AuthLayout';

const API_URL = 'http://localhost:3001/api/auth';

// --- INTERACTIVE INPUT FIELD ---
const InputField = ({ label, icon: Icon, type, name, value, onChange, isPasswordToggle, showPassword, setShowPassword }) => (
  <div className="mb-6 relative group">
    <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-2 ml-1 tracking-wider group-focus-within:text-teal-600 transition-colors">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors duration-300">
        <Icon className="w-5 h-5" />
      </div>
      <input
        type={isPasswordToggle ? (showPassword ? 'text' : 'password') : type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 placeholder-slate-400 font-bold text-sm focus:outline-none focus:border-teal-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all duration-300"
        placeholder={`Enter your ${label.toLowerCase()}...`}
      />
      {isPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-teal-600 transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" /> }
        </button>
      )}
    </div>
  </div>
);

export default function SignIn({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/login`, formData);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user); 
      navigate('/');
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.error || 'Access Denied. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Researcher Login" 
      subtitle="Secure gateway for AquaSmart monitoring systems."
    >
      {/* Security Badge */}
      <div className="absolute top-8 right-8 hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
        <ShieldCheck className="w-3 h-3" /> Secure SSL
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 rounded-r-xl text-xs font-bold flex items-center gap-3 shadow-sm"
        >
           <div className="p-1.5 bg-red-100 rounded-full"><Lock className="w-3.5 h-3.5" /></div>
           {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <InputField 
          label="Academic Email" 
          icon={Mail} 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
        />
        <InputField 
          label="Access Key (Password)" 
          icon={Fingerprint} 
          type="password" 
          name="password" 
          value={formData.password} 
          onChange={handleChange} 
          isPasswordToggle={true}
          showPassword={showPassword}
          setShowPassword={setShowPassword} 
        />

        <div className="flex items-center justify-between mb-8 mt-2">
          <label className="flex items-center group cursor-pointer select-none">
            <div className="relative">
               <input type="checkbox" className="peer sr-only" />
               <div className="w-4 h-4 border-2 border-slate-300 rounded peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all"></div>
               <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity"></div>
            </div>
            <span className="ml-2 text-xs font-bold text-slate-500 group-hover:text-teal-700 transition-colors">Keep Session Active</span>
          </label>
          <Link to="/forgot-password" className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors hover:underline decoration-2 underline-offset-4">
            Reset Password
          </Link>
        </div>

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
                 Verifying Access...
            </div>
          ) : (
            <>
              Access Dashboard <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-10 pt-6 border-t border-slate-100 flex justify-center">
         <p className="text-slate-400 text-xs font-semibold">
            New to the project?{' '}
            <Link to="/signup" className="text-slate-800 hover:text-teal-600 font-bold transition-colors ml-1 border-b-2 border-transparent hover:border-teal-600">
              Request Researcher Access
            </Link>
         </p>
      </div>
    </AuthLayout>
  );
}
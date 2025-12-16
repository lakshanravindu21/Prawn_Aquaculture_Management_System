import React, { useState } from 'react';
import axios from 'axios';
import { Waves, ArrowRight, Lock, Mail, Loader2, UserCheck, UserPlus, User } from 'lucide-react';

export default function Login({ onLogin }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLoginView 
        ? 'http://localhost:3001/api/auth/login' 
        : 'http://localhost:3001/api/auth/register';

      const res = await axios.post(endpoint, formData);

      if (!isLoginView) {
        // Registration Successful -> Switch to Login
        setIsLoginView(true);
        setError("Account created! Please sign in.");
        setFormData({ name: '', email: '', password: '' });
      } else {
        // Login Successful -> Enter Dashboard
        onLogin(res.data.user); 
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Connection failed. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans">
      
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"></div>
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse"></div>

      {/* Card */}
      <div className="relative w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 mb-4 transform hover:scale-110 transition-transform">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Aqua<span className="text-blue-400">Smart</span></h1>
          <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mt-2">
            {isLoginView ? 'Authentication Gateway' : 'New Researcher Registration'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Name Field (Signup Only) */}
          {!isLoginView && (
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Dr. Lakshan Ravindu"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2 group">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input 
                type="email" 
                name="email"
                placeholder="researcher@aquasmart.ac.lk"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2 group">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input 
                type="password" 
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-xs font-bold text-center animate-pulse">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-900/50 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLoginView ? <><UserCheck className="w-5 h-5" /> Sign In</> : <><UserPlus className="w-5 h-5" /> Create Account</>)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLoginView(!isLoginView); setError(null); }}
            className="text-slate-400 text-sm hover:text-white transition-colors underline decoration-dotted"
          >
            {isLoginView ? "Need an account? Register here" : "Already have an account? Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}
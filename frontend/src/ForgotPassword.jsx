import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Send, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './components/AuthLayout';

const API_URL = 'http://localhost:3001/api/auth';

// --- Reusable Input Component for Consistency ---
const EmailInput = ({ value, onChange }) => (
  <div className="mb-6 relative group">
    <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-2 ml-1 tracking-wider group-focus-within:text-teal-600 transition-colors">
      Academic Email
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors duration-300">
        <Mail className="w-5 h-5" />
      </div>
      <input
        type="email"
        value={value}
        onChange={onChange}
        required
        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 placeholder-slate-400 font-bold text-sm focus:outline-none focus:border-teal-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all duration-300"
        placeholder="researcher@aquasmart.ac.lk"
      />
    </div>
  </div>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/forgot-password`, { email });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
        <AuthLayout title="Check your inbox" subtitle={`We've sent recovery instructions to ${email}.`}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col items-center justify-center text-center py-10"
            >
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-full text-teal-600 mb-6 shadow-sm animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <p className="text-slate-600 font-medium mb-8 leading-relaxed max-w-xs mx-auto">
                    If an account exists for that email, you will receive a secure link to reset your password shortly.
                </p>
                <Link 
                  to="/signin" 
                  className="py-3.5 px-8 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
            </motion.div>
        </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive recovery instructions.">
      
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
        <EmailInput value={email} onChange={(e) => setEmail(e.target.value)} />

        <motion.button 
          whileHover={{ scale: 1.01, boxShadow: "0 10px 30px -10px rgba(20,184,166,0.5)" }} 
          whileTap={{ scale: 0.98 }} 
          type="submit" 
          disabled={loading || !email} 
          className={`w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all duration-300 uppercase tracking-widest text-xs ${loading || !email ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 Sending...
            </div>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send Reset Link
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-10 text-center pt-6 border-t border-slate-100">
        <Link to="/signin" className="text-xs font-bold text-slate-500 hover:text-teal-700 inline-flex items-center gap-1 transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
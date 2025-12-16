import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight, Upload, X, ChevronDown, Fingerprint, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from './components/AuthLayout';

const API_URL = 'http://localhost:3001/api/auth';

// --- FIXED: Component defined OUTSIDE the main function to prevent focus loss ---
const InputField = ({ label, icon: Icon, type, name, value, onChange, isPasswordToggle, showPassword, setShowPassword }) => (
  <div className="mb-5 relative group">
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
        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 placeholder-slate-400 font-bold text-sm focus:outline-none focus:border-teal-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all duration-300"
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

export default function SignUp({ onLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Researcher' });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
          setError("Image size too large. Max 5MB.");
          return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
      setProfileImage(null);
      setImagePreview(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const submissionData = new FormData();
    submissionData.append('name', formData.name);
    submissionData.append('email', formData.email);
    submissionData.append('password', formData.password);
    submissionData.append('role', formData.role);
    if (profileImage) submissionData.append('avatar', profileImage); 

    try {
      const res = await axios.post(`${API_URL}/register`, submissionData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if(res.data.token && res.data.user) {
         localStorage.setItem('token', res.data.token);
         onLogin(res.data.user);
         navigate('/');
      } else { navigate('/signin'); }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.error || 'Registration failed. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Join the Team" subtitle="Create an account to contribute to the research.">
      
      {/* Security Badge */}
      <div className="absolute top-8 right-8 hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
        <ShieldCheck className="w-3 h-3" /> Verified
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-600 rounded-r-xl text-xs font-bold flex items-center gap-3 shadow-sm">
           <div className="p-1.5 bg-red-100 rounded-full"><AlertTriangle className="w-3.5 h-3.5" /></div>
           {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        
        {/* --- PROFILE PHOTO UPLOAD UI --- */}
        <div className="mb-8 flex flex-col items-center">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-3 tracking-widest">Researcher Profile Photo</label>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            
            <AnimatePresence mode="wait">
                {imagePreview ? (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative group">
                        <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-teal-100 shadow-xl shadow-teal-100/50" />
                        <button type="button" onClick={removeImage} className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 transform hover:scale-110">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.button 
                      type="button" 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-all group cursor-pointer"
                    >
                        <Upload className="w-6 h-6 mb-1 group-hover:-translate-y-1 transition-transform" />
                        <span className="text-[9px] font-extrabold uppercase">Upload</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>

        <InputField label="Full Name" icon={User} type="text" name="name" value={formData.name} onChange={handleChange} />
        <InputField label="Academic Email" icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} />
        <InputField label="Access Key" icon={Fingerprint} type="password" name="password" value={formData.password} onChange={handleChange} isPasswordToggle={true} showPassword={showPassword} setShowPassword={setShowPassword} />

        <div className="mb-8 relative group">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-2 ml-1 tracking-wider group-focus-within:text-teal-600 transition-colors">Role Assignment</label>
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors"><UserPlus className="w-5 h-5" /></div>
                 <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange} 
                    className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:border-teal-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all appearance-none cursor-pointer"
                 >
                    <option value="Researcher">Researcher</option>
                    <option value="Admin">Administrator</option>
                    <option value="Technician">Technician</option>
                 </select>
                 <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400"><ChevronDown className="w-5 h-5" /></div>
            </div>
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
                 Creating Profile...
             </div>
          ) : (
             <>
               Confirm Registration <ArrowRight className="w-4 h-4" />
             </>
          )}
        </motion.button>
      </form>

      <div className="mt-8 text-center pt-6 border-t border-slate-100">
        <p className="text-slate-400 text-xs font-semibold">
          Already have an account?{' '}
          <Link to="/signin" className="text-slate-800 hover:text-teal-600 font-bold transition-colors ml-1 border-b-2 border-transparent hover:border-teal-600">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
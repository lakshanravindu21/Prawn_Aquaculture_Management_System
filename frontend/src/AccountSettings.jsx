import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  User, Lock, Upload, KeyRound, RefreshCw, Save, CheckCircle2, AlertTriangle, Shield, Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';

const API_URL = 'http://localhost:3001/api/auth';

// --- REUSABLE INPUT COMPONENT ---
const SettingInput = ({ label, icon: Icon, type = "text", value, onChange, readOnly = false, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${readOnly ? 'text-slate-400' : 'text-slate-400 group-focus-within:text-teal-600'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <input 
        type={type} 
        value={value} 
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full pl-12 pr-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-300 outline-none border-2
          ${readOnly 
            ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 hover:border-teal-300'
          }`} 
      />
    </div>
  </div>
);

export default function AccountSettings({ user, onLogout }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // State for Form Fields
  const [profileData, setProfileData] = useState({ name: user?.name || '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [previewImage, setPreviewImage] = useState(user?.avatar || null);
  const [uploadFile, setUploadFile] = useState(null);
  
  const fileInputRef = useRef(null);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle Save
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    const token = localStorage.getItem('token');
    
    try {
        // 1. Update Profile Info & Avatar
        const formData = new FormData();
        formData.append('name', profileData.name);
        if (uploadFile) formData.append('avatar', uploadFile);

        const resProfile = await axios.put(`${API_URL}/update-profile`, formData, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });

        // 2. Change Password (if provided)
        if (passwords.new) {
            if (passwords.new !== passwords.confirm) throw new Error("New passwords do not match.");
            await axios.put(`${API_URL}/change-password`, {
                currentPassword: passwords.current,
                newPassword: passwords.new
            }, { headers: { 'Authorization': `Bearer ${token}` } });
        }

        // 3. Update Local Storage to reflect changes immediately
        const updatedUser = { ...user, ...resProfile.data.user };
        localStorage.setItem('aquaUser', JSON.stringify(updatedUser));
        
        setMessage({ type: 'success', text: 'Profile updated successfully! Reloading...' });
        
        // Reload page to show new data in Header
        setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.error || err.message || "Update failed." });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
        
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} onLogout={onLogout} />

        <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-10 space-y-8">
          
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-6"
          >
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account Settings</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Manage your researcher profile and security credentials.</p>
            </div>
          </motion.div>

          {/* Feedback Message Toast */}
          <AnimatePresence>
            {message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -20 }} 
                  animate={{ opacity: 1, height: 'auto', y: 0 }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold shadow-lg mb-6 ${
                    message.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                    <div className={`p-1.5 rounded-full ${message.type === 'success' ? 'bg-emerald-200' : 'bg-red-200'}`}>
                      {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    {message.text}
                </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- LEFT COLUMN: PROFILE CARD --- */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-teal-500 to-blue-600 opacity-10"></div>
                    
                    <div className="relative group mb-6 z-10 mt-4">
                        <div className="w-36 h-36 rounded-full p-1.5 border-4 border-white dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 relative overflow-hidden">
                            {previewImage ? (
                                <img src={previewImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                    <User className="w-16 h-16" />
                                </div>
                            )}
                            
                            {/* Hover Upload Overlay */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-full backdrop-blur-sm"
                            >
                                <Upload className="w-8 h-8 text-white mb-1" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} accept="image/*" />
                        
                        {/* Role Badge */}
                        <div className="absolute bottom-0 right-2 bg-slate-900 text-white p-1.5 rounded-full border-4 border-white dark:border-slate-800 shadow-md" title={user?.role}>
                           <Shield className="w-4 h-4" />
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.name}</h3>
                    <p className="text-sm font-medium text-teal-600 dark:text-teal-400 mt-1 uppercase tracking-wide text-[11px]">
                        {user?.role || 'Researcher'}
                    </p>
                    <div className="mt-6 w-full pt-6 border-t border-slate-100 dark:border-slate-800">
                       <p className="text-xs text-slate-400 font-medium">User ID: <span className="font-mono text-slate-500">{user?.id || '---'}</span></p>
                    </div>
                </div>
            </motion.div>

            {/* --- RIGHT COLUMN: EDIT FORMS --- */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
                
                {/* 1. Personal Information */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                           <User className="w-5 h-5" />
                        </div>
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <SettingInput 
                          label="Full Name" 
                          icon={User} 
                          value={profileData.name} 
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                        />
                        <SettingInput 
                          label="Email Address (Locked)" 
                          icon={Mail} 
                          value={user?.email} 
                          readOnly={true} 
                        />
                    </div>
                </div>

                {/* 2. Security Settings */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2.5">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                           <KeyRound className="w-5 h-5" />
                        </div>
                        Security Settings
                    </h3>
                    
                    <div className="space-y-6">
                        <SettingInput 
                          label="Current Password" 
                          icon={Lock} 
                          type="password"
                          placeholder="••••••••"
                          value={passwords.current} 
                          onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SettingInput 
                              label="New Password" 
                              icon={KeyRound} 
                              type="password"
                              placeholder="New password"
                              value={passwords.new} 
                              onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                            />
                            <SettingInput 
                              label="Confirm Password" 
                              icon={KeyRound} 
                              type="password"
                              placeholder="Confirm new password"
                              value={passwords.confirm} 
                              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end pt-2">
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveProfile} 
                        disabled={isSaving} 
                        className={`px-8 py-4 rounded-xl font-bold shadow-xl flex items-center gap-2 transition-all duration-300 ${isSaving ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:shadow-teal-500/25'}`}
                    >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Saving Changes...' : 'Save Changes'}
                    </motion.button>
                </div>

            </motion.div>
          </div>

        </main>
        <Footer />
      </div>
    </div>
  );
}
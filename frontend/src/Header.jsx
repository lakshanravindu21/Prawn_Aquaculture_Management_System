import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Camera, Activity, Settings, Bell, Moon, Sun, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';

export default function Header({ isDarkMode, toggleTheme, user, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="w-full px-6 h-16 flex items-center justify-between">
        
        {/* LEFT: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight">
              Aqua<span className="text-blue-400">Smart</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Research Group 16
            </p>
          </div>
        </div>

        {/* MIDDLE: Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" icon={LayoutDashboard} text="Dashboard" />
          <NavLink to="/camera" icon={Camera} text="Camera Feed" />
          <NavLink to="/predictions" icon={Activity} text="Predictions" />
          <NavLink to="/settings" icon={Settings} text="Settings" />
        </nav>

        {/* RIGHT: Profile & Notifications */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-800"></span>
          </button>
          
          <div className="h-8 w-[1px] bg-slate-700"></div>

          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-2 focus:outline-none group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-100 leading-none group-hover:text-blue-400 transition-colors">
                  {user ? user.name : 'Guest'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {user ? user.role : 'Visitor'}
                </p>
              </div>
              <div className="relative">
                {user && user.avatar ? (
                   <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-600 shadow-sm object-cover group-hover:border-blue-400 transition-all" />
                ) : (
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                    <UserIcon className="w-5 h-5 text-slate-300" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-800 bg-emerald-500"></div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="p-2">
                   {/* UPDATED: Link to Account Settings Page */}
                   <Link 
                      to="/account" 
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                   >
                      <Settings className="w-4 h-4" /> Account Settings
                   </Link>
                   
                   <div className="h-[1px] bg-slate-700 my-1"></div>
                   
                   <button 
                      onClick={() => {
                        onLogout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ icon: Icon, text, to }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
      <Icon className="w-4 h-4" /> {text}
    </Link>
  );
}
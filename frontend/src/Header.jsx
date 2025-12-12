import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // <--- Import Routing
import { LayoutDashboard, Camera, Activity, Settings, Bell, User, Moon, Sun } from 'lucide-react';

export default function Header({ isDarkMode, toggleTheme }) {
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

        {/* MIDDLE: Navigation (Now using real Routing) */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" icon={LayoutDashboard} text="Dashboard" />
          <NavLink to="/camera" icon={Camera} text="Camera Feed" />
          <NavLink to="/predictions" icon={Activity} text="Predictions" />
          <NavLink to="/settings" icon={Settings} text="Settings" />
        </nav>

        {/* RIGHT: Profile & Notifications */}
        <div className="flex items-center gap-4">
          
          {/* THEME TOGGLE BUTTON */}
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

          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-slate-400">Research Lead</p>
            </div>
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
              <User className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}

// Updated NavLink to support Router and Auto-Active State
function NavLink({ icon: Icon, text, to }) {
  const location = useLocation();
  const active = location.pathname === to; // Check if this link is the current page

  return (
    <Link to={to} className={`
      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
      ${active 
        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}
    `}>
      <Icon className="w-4 h-4" />
      {text}
    </Link>
  );
}
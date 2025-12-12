import React from 'react';
import { Github, Mail, Globe } from 'lucide-react';

export default function Footer() {
  return (
    // Changed bg-white to bg-slate-800 to match Header
    <footer className="bg-slate-800 border-t border-slate-700 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Left: Project Info */}
          <div className="text-center md:text-left">
            <h3 className="text-sm font-bold text-white">AquaSmart Research Project</h3>
            <p className="text-xs text-slate-400 mt-1">
              Group 16 • Faculty of Technology • University of Sri Jayewardenepura
            </p>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
              <Globe className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-700 text-center text-[10px] text-slate-500 uppercase tracking-widest">
          © 2025 Intelligent Aquaculture Framework. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
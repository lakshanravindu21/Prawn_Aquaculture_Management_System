import React from 'react';
import { motion } from 'framer-motion';
import { FishSymbol, Activity, Droplets, Microscope, Beaker, Binary } from 'lucide-react';

// --- VISUAL: "Prawn Tank" Screensaver Background ---
const SeaLifeBackground = () => {
  // Generate random "Swimming Organisms"
  const swimmingCreatures = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    y: Math.random() * 85 + 5 + '%', // Vertical position
    duration: Math.random() * 25 + 20, // Speed
    delay: Math.random() * 5,
    scale: Math.random() * 0.4 + 0.6, // Size variance
  }));

  // Generate Rising Bubbles
  const bubbles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100 + '%',
    duration: Math.random() * 15 + 5,
    delay: Math.random() * 5,
    size: Math.random() * 6 + 2
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Rising Bubbles */}
      {bubbles.map((b) => (
        <motion.div
          key={`bubble-${b.id}`}
          className="absolute bg-white/40 rounded-full blur-[1px]"
          style={{ left: b.x, width: b.size, height: b.size, bottom: '-20px' }}
          animate={{ y: -1000, opacity: [0, 0.6, 0] }}
          transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: "linear" }}
        />
      ))}

      {/* 2. Swimming Organisms (Abstract Prawns) */}
      {swimmingCreatures.map((c) => (
        <motion.div
          key={`prawn-${c.id}`}
          className="absolute text-teal-900/10"
          style={{ top: c.y }}
          initial={{ x: -150, opacity: 0 }}
          animate={{ x: '120vw', opacity: [0, 1, 1, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: c.duration, repeat: Infinity, delay: c.delay, ease: "linear" }}
        >
          {/* Using FishSymbol to represent Prawns/Stock */}
          <FishSymbol size={64 * c.scale} style={{ transform: 'scaleX(-1)' }} /> 
        </motion.div>
      ))}
      
      {/* 3. Floating Data Points (Binary) */}
      <div className="absolute top-20 right-20 text-teal-800/5 animate-pulse">
        <Binary size={128} />
      </div>
    </div>
  );
};

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex bg-slate-50 font-sans overflow-hidden selection:bg-teal-100 selection:text-teal-900">
      
      {/* --- LEFT SIDE: RESEARCH CONTENT & ANIMATION --- */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-white border-r border-teal-100 flex-col justify-between p-12">
        
        {/* Animated Background */}
        <SeaLifeBackground />
        
        {/* Top: Branding */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative z-10 flex items-center gap-3"
        >
          <div className="p-2.5 bg-white/80 backdrop-blur rounded-xl shadow-sm border border-teal-100 text-teal-600">
            <Microscope className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-slate-800 tracking-tight uppercase leading-none">AquaSmart</span>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Research Group 16</span>
          </div>
        </motion.div>

        {/* Center: Main Details */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-lg"
        >
          {/* Tagline Badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wide">
            <Beaker className="w-3.5 h-3.5" />
            Advanced Aquaculture Analytics
          </div>
          
          <h1 className="text-4xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
            Advanced <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600">Prawn</span> Health Monitoring.
          </h1>
          
          <p className="text-slate-600 text-base leading-relaxed font-medium mb-8 border-l-4 border-teal-400 pl-4">
            Deploying AI computer vision and IoT sensors to ensure optimal water quality and disease prevention in aquaculture.
          </p>
          
          {/* Indicators / Badges */}
          <div className="flex gap-3">
             <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 px-5 py-3 bg-white/60 backdrop-blur-md rounded-2xl border border-teal-100 shadow-sm cursor-default">
                <div className="p-2 bg-cyan-100 rounded-full text-cyan-600">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Monitor</p>
                   <p className="text-sm font-bold text-slate-700">Water Quality</p>
                </div>
             </motion.div>
             
             <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 px-5 py-3 bg-white/60 backdrop-blur-md rounded-2xl border border-teal-100 shadow-sm cursor-default">
                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                  <FishSymbol className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Analyze</p>
                   <p className="text-sm font-bold text-slate-700">Stock Health</p>
                </div>
             </motion.div>
          </div>
        </motion.div>

        {/* Bottom: Footer Info */}
        <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
          Research Group 16 • Est. 2025
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM CONTAINER (Structured) --- */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 bg-white relative">
        
        {/* Subtle Background Pattern for Right Side */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>

        {/* Mobile Top Bar */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-cyan-500"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 sm:p-10 relative z-10"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{title}</h2>
            <p className="text-slate-500 font-medium text-sm">{subtitle}</p>
          </div>
          
          {children}
          
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
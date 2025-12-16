import React, { useState, useEffect } from 'react';
import { 
  Camera, AlertTriangle, CheckCircle2, Maximize2, BrainCircuit, History, 
  Video, Mic, MicOff, Settings, Sliders, Eye, EyeOff, Aperture, Save, Activity,
  Play, Pause, Volume2, VolumeX, ChevronDown, RefreshCw
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// Placeholder Image (Simulating Live Feed)
const LIVE_FEED_URL = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=1200&auto=format&fit=crop";

export default function CameraFeed({ user, onLogout }) { // <--- Props Added Here
  // --- STATE MANAGEMENT ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedPond, setSelectedPond] = useState(1);
  
  // Camera Settings State
  const [sensitivity, setSensitivity] = useState(85);
  const [isNightVision, setIsNightVision] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fps, setFps] = useState(24);

  // Simulated Detection Data
  const [detections, setDetections] = useState([
    { id: 1, time: '10:42:15', type: 'Healthy', confidence: '98%', status: 'safe' },
    { id: 2, time: '10:41:03', type: 'Healthy', confidence: '96%', status: 'safe' },
    { id: 3, time: '10:35:44', type: 'Suspicious Lesion', confidence: '72%', status: 'warning' },
    { id: 4, time: '10:32:10', type: 'Healthy', confidence: '99%', status: 'safe' },
    { id: 5, time: '10:28:45', type: 'Healthy', confidence: '97%', status: 'safe' },
  ]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Simulate adding new logs periodically
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      // 10% chance to add a new log
      if (Math.random() > 0.9) {
        const newLog = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          type: Math.random() > 0.8 ? 'Potential WSSV' : 'Healthy',
          confidence: Math.floor(Math.random() * (99 - 80) + 80) + '%',
          status: Math.random() > 0.8 ? 'warning' : 'safe'
        };
        setDetections(prev => [newLog, ...prev].slice(0, 10)); // Keep last 10
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    // DARK MODE WRAPPER
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
        
        {/* Pass user and onLogout to Header */}
        <Header 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
          user={user} 
          onLogout={onLogout} 
        />

        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
          
          {/* --- 1. PAGE HEADER --- */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm">
                  <Camera className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                Live Computer Vision
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase transition-colors ${isAiEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                  <Activity className="w-3 h-3" />
                  {isAiEnabled ? 'CNN Model Active' : 'AI Paused'}
                </span>
                <span className="text-slate-300 dark:text-slate-700 text-sm">|</span>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Real-time WSSV Analysis & Growth Monitoring
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`flex items-center gap-2 px-3 py-1 border text-xs font-extrabold uppercase rounded-full shadow-sm transition-all ${isPlaying ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'}`}>
                <span className={`relative flex h-2 w-2 ${isPlaying ? 'block' : 'hidden'}`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                {isPlaying ? 'Live Streaming' : 'Stream Paused'}
              </span>
              
              <div className="relative">
                <select 
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all cursor-pointer"
                  value={selectedPond}
                  onChange={(e) => setSelectedPond(e.target.value)}
                >
                  <option value="1">Research Pond A - Cam 01</option>
                  <option value="2">Research Pond B - Cam 01</option>
                  <option value="3">Research Pond C - Cam 02</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* --- 2. MAIN CONTENT GRID --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: VIDEO PLAYER (2/3 Width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Video Container */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black group transition-colors duration-300">
                
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-10">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                      FPS: {fps}
                    </span>
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-mono text-blue-400 border border-blue-500/30">
                      HD 1080p
                    </span>
                    {isNightVision && (
                      <span className="px-2 py-1 bg-green-900/80 backdrop-blur-md rounded text-[10px] font-mono text-green-400 border border-green-500/30 animate-pulse">
                        NIGHT VISION
                      </span>
                    )}
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-600/90 backdrop-blur rounded-lg animate-pulse shadow-lg shadow-red-900/50">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span className="text-xs font-bold text-white uppercase">REC 00:12</span>
                    </div>
                  )}
                </div>

                {/* The Video Feed (Grayscale filter if Night Vision is on) */}
                <div className={`w-full h-[500px] bg-slate-900 relative ${isNightVision ? 'grayscale contrast-125 brightness-110' : ''}`}>
                  {isPlaying ? (
                    <>
                      <img 
                        src={LIVE_FEED_URL} 
                        alt="Live Pond Feed" 
                        className="w-full h-full object-cover opacity-90"
                      />
                      
                      {/* AI Bounding Box Overlay */}
                      {isAiEnabled && (
                        <div className="absolute top-1/4 left-1/3 w-40 h-40 border-2 border-emerald-400 rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-end justify-center transition-all duration-500 hover:scale-105 cursor-crosshair">
                          <div className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 mb-[-12px] rounded-md shadow-sm flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Prawn (98%)
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                        <p className="text-slate-500 font-medium">Feed Paused</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700 p-4 flex justify-between items-center z-20">
                  
                  {/* Playback Controls */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/30"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                    
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* AI & Tools */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsAiEnabled(!isAiEnabled)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border
                        ${isAiEnabled 
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                          : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                    >
                      <BrainCircuit className="w-4 h-4" />
                      {isAiEnabled ? 'AI Overlay ON' : 'AI Overlay OFF'}
                    </button>

                    <button className="p-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" title="Snapshot">
                      <Aperture className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Recording */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsRecording(!isRecording)}
                      className={`p-2 rounded-full border-2 transition-all ${isRecording ? 'border-red-500 bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-slate-500 text-slate-400 hover:border-white hover:text-white'}`}
                      title="Start Recording"
                    >
                      <div className={`w-3 h-3 bg-current rounded-full ${isRecording ? 'animate-pulse' : ''}`}></div>
                    </button>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-colors">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Bitrate</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">4.2 Mbps</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-colors">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Latency</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">24 ms</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-colors">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Storage</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">12 GB Free</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR (1/3 Width) */}
            <div className="space-y-6">
              
              {/* 1. DETECTION LOG CARD (Indigo/Slate Theme) */}
              <div className="bg-indigo-50 dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[400px] transition-colors duration-300">
                <div className="bg-white dark:bg-slate-900/50 px-5 py-4 border-b border-indigo-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-500" />
                    AI Detection Log
                  </h3>
                  <button onClick={() => setDetections([])} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 dark:scrollbar-thumb-slate-600">
                  {detections.map((det) => (
                    <div key={det.id} className="relative pl-4 border-l-2 border-indigo-200 dark:border-slate-600 py-1 group animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-xs font-bold uppercase ${det.status === 'safe' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {det.type}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{det.time}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${det.status === 'safe' ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400'}`}>
                          {det.confidence}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <button className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">View Full History</button>
                  </div>
                </div>
              </div>

              {/* 2. CAMERA SETTINGS CARD (Slate/White Theme) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors duration-300">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Camera Settings
                </h3>
                
                <div className="space-y-5">
                  {/* Interactive Slider */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">WSSV Sensitivity</label>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{sensitivity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={sensitivity} 
                      onChange={(e) => setSensitivity(e.target.value)}
                      className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Interactive Toggles */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md transition-colors ${isNightVision ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        {isNightVision ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Night Vision</span>
                    </div>
                    <button 
                      onClick={() => setIsNightVision(!isNightVision)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isNightVision ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isNightVision ? 'left-6' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md transition-colors ${isMuted ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Audio Feed</span>
                    </div>
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${!isMuted ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm ${!isMuted ? 'left-6' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Calibrate Sensor
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
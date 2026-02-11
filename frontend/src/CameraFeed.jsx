import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { 
  Camera, AlertTriangle, CheckCircle2, Maximize2, BrainCircuit, History, 
  Video, Mic, MicOff, Settings, Sliders, Eye, EyeOff, Aperture, Save, Activity,
  Play, Pause, Volume2, VolumeX, ChevronDown, RefreshCw, WifiOff, Stethoscope
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// ✅ CONFIGURATION: Connects to your running Backend
const API_URL = "http://localhost:3001/api";

export default function CameraFeed({ user, onLogout }) {
  // --- STATE MANAGEMENT ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedPond, setSelectedPond] = useState(1);
  
  // Real Data State
  const [liveImage, setLiveImage] = useState(null); // The big main image
  const [logs, setLogs] = useState([]);             // The sidebar history list
  const [loading, setLoading] = useState(true);

  // Camera Settings State
  const [sensitivity, setSensitivity] = useState(85);
  const [isNightVision, setIsNightVision] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fps, setFps] = useState(0); 

  const navigate = useNavigate(); // Hook for navigation
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // ✅ FETCH REAL DATA FROM BACKEND
  const fetchCameraData = async () => {
    try {
      if (!isPlaying) return;

      const res = await fetch(`${API_URL}/camera-logs`);
      const data = await res.json();

      if (data && data.length > 0) {
        setLiveImage(data[0].url);
        setLogs(data);
        setLoading(false);
        setFps(Math.floor(Math.random() * (15 - 10) + 10)); 
      }
    } catch (error) {
      console.error("Connection Error:", error);
      setFps(0);
    }
  };

  // ✅ POLLING EFFECT
  useEffect(() => {
    fetchCameraData(); 
    const interval = setInterval(fetchCameraData, 2000); 
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Bridge Function: Send current frame to Health Page (Concept)
  // Ideally, you'd save the image to a global context or pass state, 
  // but for now we just navigate user to the Health page to do a manual check.
  const handleQuickDiagnosis = () => {
    navigate('/health');
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
        
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
              <span className={`flex items-center gap-2 px-3 py-1 border text-xs font-extrabold uppercase rounded-full shadow-sm transition-all ${isPlaying && fps > 0 ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'}`}>
                <span className={`relative flex h-2 w-2 ${isPlaying && fps > 0 ? 'block' : 'hidden'}`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                {isPlaying && fps > 0 ? 'Live Streaming' : 'Signal Lost'}
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
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black group transition-colors duration-300 min-h-[500px]">
                
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-10">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                      FPS: {fps}
                    </span>
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-mono text-orange-400 border border-orange-500/30">
                      RGB565 RAW
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
                      <span className="text-xs font-bold text-white uppercase">REC</span>
                    </div>
                  )}
                </div>

                {/* ✅ THE LIVE VIDEO FEED */}
                <div className={`w-full h-[500px] bg-slate-900 relative flex items-center justify-center ${isNightVision ? 'grayscale contrast-125 brightness-110' : ''}`}>
                  {isPlaying && liveImage ? (
                    <>
                      <img 
                        src={liveImage} 
                        alt="Live Pond Feed" 
                        className="w-full h-full object-contain" 
                      />
                      
                      {/* AI Bounding Box Overlay (Simulated) */}
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
                    <div className="text-center">
                      <WifiOff className="w-12 h-12 text-slate-700 mx-auto mb-2 animate-pulse" />
                      <p className="text-slate-500 font-medium">Waiting for ESP32 Signal...</p>
                      <p className="text-xs text-slate-600 mt-2">Checking Connection (Port 3001)</p>
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

                    <button 
                      onClick={handleQuickDiagnosis}
                      className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors" 
                      title="Perform Disease Check"
                    >
                      <Stethoscope className="w-5 h-5" />
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Frame Type</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">BMP (Raw)</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-colors">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Latency</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">~1.5 Sec</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-colors">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Stored Logs</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{logs.length} Frames</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR (1/3 Width) */}
            <div className="space-y-6">
              
              {/* ✅ 1. REAL DETECTION LOG CARD (UPDATED COLOR) */}
              <div className="bg-orange-50 dark:bg-slate-800 rounded-2xl border border-orange-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[400px] transition-colors duration-300">
                <div className="bg-white dark:bg-slate-900/50 px-5 py-4 border-b border-orange-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-orange-500" />
                    Live Capture Log
                  </h3>
                  <button onClick={fetchCameraData} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 dark:scrollbar-thumb-slate-600">
                  {logs.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-10">No captures yet</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="relative pl-4 border-l-2 border-orange-300 dark:border-slate-600 py-2 group animate-in fade-in slide-in-from-right-4 duration-300 hover:bg-orange-100/50 dark:hover:bg-slate-700/30 rounded-r-lg transition-colors cursor-pointer">
                        <div className="flex justify-between items-center pr-2">
                          <div>
                            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                              {log.description || "RGB565 Capture"}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {/* Colored Box Placeholder (Matches Screenshot) */}
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-400 to-amber-600 shadow-sm"></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. CAMERA SETTINGS CARD */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors duration-300">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Camera Settings
                </h3>
                
                <div className="space-y-5">
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md transition-colors ${isNightVision ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        {isNightVision ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Night Vision (Filter)</span>
                    </div>
                    <button 
                      onClick={() => setIsNightVision(!isNightVision)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isNightVision ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isNightVision ? 'left-6' : 'left-1'}`}></div>
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
import React, { useState, useEffect } from 'react';
import { 
  Activity, BrainCircuit, CloudRain, Wind, TrendingUp, AlertTriangle, 
  Calendar, CheckCircle2, ChevronDown, Droplets, ThermometerSun, 
  Waves, Skull, Info, Zap, ArrowRight, CloudLightning, ShieldCheck, Siren
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import Header from './Header';
import Footer from './Footer';

// --- STRONGER COLOR CONFIGURATION ---
const METRICS = {
  do: { 
    id: 'do', label: 'Dissolved Oxygen', unit: 'mg/L', 
    color: '#2563eb', // Stronger Blue
    bgActive: 'bg-blue-600', textActive: 'text-white',
    bgLight: 'bg-blue-100', bgDark: 'dark:bg-blue-900/40',
    border: 'border-blue-300 dark:border-blue-700', 
    text: 'text-blue-800 dark:text-blue-200',
    icon: Wind 
  },
  ph: { 
    id: 'ph', label: 'pH Level', unit: 'pH', 
    color: '#059669', // Stronger Emerald
    bgActive: 'bg-emerald-600', textActive: 'text-white',
    bgLight: 'bg-emerald-100', bgDark: 'dark:bg-emerald-900/40',
    border: 'border-emerald-300 dark:border-emerald-700', 
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: Droplets 
  },
  temp: { 
    id: 'temp', label: 'Temperature', unit: '°C', 
    color: '#ea580c', // Stronger Orange
    bgActive: 'bg-orange-600', textActive: 'text-white',
    bgLight: 'bg-orange-100', bgDark: 'dark:bg-orange-900/40',
    border: 'border-orange-300 dark:border-orange-700', 
    text: 'text-orange-800 dark:text-orange-200',
    icon: ThermometerSun 
  },
  turb: { 
    id: 'turb', label: 'Turbidity', unit: 'NTU', 
    color: '#7c3aed', // Stronger Violet
    bgActive: 'bg-violet-600', textActive: 'text-white',
    bgLight: 'bg-violet-100', bgDark: 'dark:bg-violet-900/40',
    border: 'border-violet-300 dark:border-violet-700', 
    text: 'text-violet-800 dark:text-violet-200',
    icon: Activity 
  },
  amm: { 
    id: 'amm', label: 'Ammonia', unit: 'mg/L', 
    color: '#dc2626', // Stronger Red
    bgActive: 'bg-red-600', textActive: 'text-white',
    bgLight: 'bg-red-100', bgDark: 'dark:bg-red-900/40',
    border: 'border-red-300 dark:border-red-700', 
    text: 'text-red-800 dark:text-red-200',
    icon: Skull 
  },
  sal: { 
    id: 'sal', label: 'Salinity', unit: 'ppt', 
    color: '#0891b2', // Stronger Cyan
    bgActive: 'bg-cyan-600', textActive: 'text-white',
    bgLight: 'bg-cyan-100', bgDark: 'dark:bg-cyan-900/40',
    border: 'border-cyan-300 dark:border-cyan-700', 
    text: 'text-cyan-800 dark:text-cyan-200',
    icon: Waves 
  },
};

// --- MOCK DATA ---
const generateData = () => {
  const data = [];
  const nowHour = 18; 
  for (let i = 0; i < 24; i++) {
    const hour = (nowHour - 12 + i) % 24;
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const isFuture = i > 12; 
    const baseDO = isFuture ? 6.5 - (i - 12) * 0.25 : 6.5 + Math.sin(i) * 0.5; 
    
    data.push({
      time: timeStr,
      type: isFuture ? 'future' : 'history',
      do: Number(baseDO.toFixed(1)),
      ph: Number((7.8 + Math.random() * 0.2).toFixed(1)),
      temp: Number((28 + Math.sin(i / 3) * 2).toFixed(1)),
      turb: Number((15 + Math.random() * 5).toFixed(0)),
      amm: Number((isFuture ? 0.02 + (i - 12) * 0.005 : 0.02).toFixed(3)),
      sal: Number((20 + Math.random()).toFixed(1)),
    });
  }
  return data;
};

const data = generateData();

export default function Predictions({ user, onLogout }) { // <--- Added Props Here
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedPond, setSelectedPond] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState('do');
  const [actionStatus, setActionStatus] = useState('idle');

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const activeCfg = METRICS[selectedMetric];

  const executeProtocol = () => {
    setActionStatus('loading');
    setTimeout(() => setActionStatus('success'), 2000);
  };

  // Helper to determine AI Card Theme
  const getAdvisoryTheme = () => {
    if (['do', 'amm'].includes(selectedMetric)) return 'critical';
    if (['sal'].includes(selectedMetric)) return 'warning';
    return 'safe';
  };

  const advisoryTheme = getAdvisoryTheme();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
        
        {/* Pass props to Header */}
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
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-600 rounded-xl shadow-lg shadow-violet-500/20 text-white">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Predictive Analytics</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
                    LSTM Model Forecasting (24-Hour Horizon)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase rounded-full">
                <Activity className="w-3.5 h-3.5" />
                Model Confidence: 94.2%
              </span>
              <div className="relative">
                <select 
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm transition-all cursor-pointer hover:border-violet-300"
                  value={selectedPond}
                  onChange={(e) => setSelectedPond(e.target.value)}
                >
                  <option value="1">Research Pond A (Shrimp)</option>
                  <option value="2">Research Pond B (Control)</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* --- 2. STRONGER COLORED PARAMETER SELECTOR --- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.values(METRICS).map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id)}
                className={`
                  relative overflow-hidden p-4 rounded-2xl border-2 transition-all duration-300 group
                  ${selectedMetric === m.id 
                    ? `${m.bgActive} border-transparent shadow-lg scale-105 ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 ring-${m.color.replace('#', '')}` 
                    : `${m.bgLight} ${m.bgDark} ${m.border} hover:shadow-md hover:-translate-y-1`
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2 z-10 relative">
                  <m.icon className={`w-6 h-6 ${selectedMetric === m.id ? 'text-white' : m.text}`} />
                  <span className={`text-xs font-extrabold uppercase tracking-wide ${selectedMetric === m.id ? 'text-white' : m.text}`}>
                    {m.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* --- 3. MAIN CONTENT GRID --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: WEATHER & ALERTS */}
            <div className="space-y-6">
              
              {/* ANIMATED WEATHER WIDGET */}
              <div className="relative overflow-hidden bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
                <div className="absolute top-[-20px] right-[-20px] opacity-20">
                  <CloudRain className="w-32 h-32 animate-pulse" />
                </div>
                <h3 className="relative z-10 text-sm font-bold text-blue-100 mb-6 flex items-center gap-2">
                  <CloudLightning className="w-4 h-4" />
                  Live Weather Impact
                </h3>
                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div>
                    <span className="text-5xl font-extrabold tracking-tight">28°C</span>
                    <p className="text-xs font-bold text-blue-100 uppercase mt-1 tracking-wider">Overcast & Rainy</p>
                  </div>
                  <div className="relative">
                    <CloudRain className="w-16 h-16 text-white drop-shadow-lg" />
                    <div className="absolute bottom-0 left-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                    <div className="absolute bottom-2 right-4 w-1 h-1 bg-white rounded-full animate-ping delay-75"></div>
                  </div>
                </div>
                <div className="relative z-10 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-100" />
                      <span className="text-[10px] font-bold text-blue-100 uppercase">Rain Chance</span>
                    </div>
                    <span className="text-lg font-bold">75%</span>
                  </div>
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind className="w-3.5 h-3.5 text-blue-100" />
                      <span className="text-[10px] font-bold text-blue-100 uppercase">Wind Speed</span>
                    </div>
                    <span className="text-lg font-bold">12 km/h</span>
                  </div>
                </div>
              </div>

              {/* DYNAMIC & INTERACTIVE AI ADVISORY */}
              <div className={`rounded-2xl border shadow-lg transition-all duration-500 overflow-hidden relative ${
                advisoryTheme === 'critical' ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-600' :
                advisoryTheme === 'warning' ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-500' :
                'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-500'
              }`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-white/5 opacity-30 pattern-grid-lg"></div>

                <div className="relative p-6 text-white">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-white/90">
                    <BrainCircuit className={`w-5 h-5 ${advisoryTheme === 'critical' ? 'animate-pulse' : ''}`} />
                    AI Advisory: {activeCfg.label}
                  </h3>
                  
                  {/* CRITICAL STATE */}
                  {advisoryTheme === 'critical' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Siren className="w-5 h-5 text-white animate-bounce" />
                          <p className="text-xs font-extrabold text-white uppercase tracking-wider">Critical Prediction</p>
                        </div>
                        <p className="text-sm font-medium text-white/90 leading-relaxed">
                          Unsafe levels detected in forecast. Immediate intervention required to prevent stock loss.
                        </p>
                      </div>

                      {actionStatus === 'success' ? (
                        <div className="w-full py-3 bg-white/20 border border-white/30 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase animate-in zoom-in">
                          <CheckCircle2 className="w-5 h-5" />
                          Protocol Activated
                        </div>
                      ) : (
                        <button 
                          onClick={executeProtocol}
                          disabled={actionStatus === 'loading'}
                          className="group w-full py-3 bg-white text-rose-600 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase shadow-lg hover:bg-rose-50 transition-all active:scale-95"
                        >
                          {actionStatus === 'loading' ? (
                            <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 fill-current group-hover:animate-pulse" />
                              Execute Emergency Protocol
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* WARNING STATE */}
                  {advisoryTheme === 'warning' && (
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                      <p className="text-xs font-bold text-white uppercase mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 animate-pulse" />
                        Weather Warning
                      </p>
                      <p className="text-sm text-white/90">
                        Incoming rain may dilute salinity. Recommendation: <strong>Pause water exchange</strong> for 6 hours.
                      </p>
                    </div>
                  )}

                  {/* SAFE STATE */}
                  {advisoryTheme === 'safe' && (
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex gap-3 items-center">
                      <ShieldCheck className="w-8 h-8 text-white/80" />
                      <div>
                        <p className="text-xs font-bold text-white uppercase mb-1">Stable Forecast</p>
                        <p className="text-xs text-white/90">
                          Conditions optimal. No action needed.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: FORECAST CHART */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" style={{ color: activeCfg.color }} />
                      {activeCfg.label} Forecast
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Historical Data vs LSTM Prediction
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-100 dark:border-slate-700">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeCfg.color }}></span>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">History</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <span className="w-2 h-2 rounded-full border-2 border-dashed" style={{ borderColor: activeCfg.color }}></span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Forecast</span>
                    </div>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={activeCfg.color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={activeCfg.color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600}} 
                        axisLine={false} tickLine={false} 
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} 
                        axisLine={false} tickLine={false} 
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const isFuture = payload[0].payload.type === 'future';
                            const val = payload[0].payload[selectedMetric];
                            return (
                              <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isFuture ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    {isFuture ? 'AI Forecast' : 'Measured'}: <span style={{ color: activeCfg.color }}>{val} {activeCfg.unit}</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />
                      <ReferenceLine x="18:00" stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'NOW', fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                      <Area 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke={activeCfg.color} 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorMetric)" 
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* METRICS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <p className="text-xs font-bold text-slate-400 uppercase">RMSE Score</p>
                  </div>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">0.12</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Horizon</p>
                  </div>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">24 Hours</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-4 h-4 text-slate-400" />
                      <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                    </div>
                    <p className="text-xl font-extrabold text-emerald-500">Trained</p>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
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
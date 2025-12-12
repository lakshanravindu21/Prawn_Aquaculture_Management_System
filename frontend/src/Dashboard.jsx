import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  Droplets, Thermometer, Activity, Wind, AlertTriangle, Power, 
  ChevronDown, CheckCircle2, Moon, Sun, X, Skull, Waves, Camera, BrainCircuit, ShieldCheck, Zap 
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const API_URL = 'http://localhost:3001/api';

// --- CONFIGURATION FOR CHART METRICS ---
const CHART_METRICS = {
  dissolvedOxygen: { label: 'Dissolved Oxygen', color: '#3b82f6', unit: 'mg/L' },
  ph: { label: 'pH Level', color: '#10b981', unit: 'pH' },
  temperature: { label: 'Temperature', color: '#f97316', unit: '°C' },
  turbidity: { label: 'Turbidity', color: '#8b5cf6', unit: 'NTU' },
  ammonia: { label: 'Ammonia', color: '#ef4444', unit: 'mg/L' },
  salinity: { label: 'Salinity', color: '#06b6d4', unit: 'ppt' },
};

// --- SUB-COMPONENT: COLORFUL SENSOR CARD ---
const SensorCard = ({ title, value, unit, icon: Icon, theme }) => {
  const styles = {
    blue: { bg: 'bg-blue-100 dark:bg-slate-800', border: 'border-blue-300 dark:border-slate-700', iconBg: 'bg-blue-200 dark:bg-blue-900/30', iconText: 'text-blue-700 dark:text-blue-400', text: 'text-blue-900 dark:text-blue-100', subtext: 'text-blue-700 dark:text-blue-400/70', ping: 'bg-blue-600' },
    green: { bg: 'bg-emerald-100 dark:bg-slate-800', border: 'border-emerald-300 dark:border-slate-700', iconBg: 'bg-emerald-200 dark:bg-emerald-900/30', iconText: 'text-emerald-700 dark:text-emerald-400', text: 'text-emerald-900 dark:text-emerald-100', subtext: 'text-emerald-700 dark:text-emerald-400/70', ping: 'bg-emerald-600' },
    orange: { bg: 'bg-orange-100 dark:bg-slate-800', border: 'border-orange-300 dark:border-slate-700', iconBg: 'bg-orange-200 dark:bg-orange-900/30', iconText: 'text-orange-700 dark:text-orange-400', text: 'text-orange-900 dark:text-orange-100', subtext: 'text-orange-700 dark:text-orange-400/70', ping: 'bg-orange-600' },
    purple: { bg: 'bg-violet-100 dark:bg-slate-800', border: 'border-violet-300 dark:border-slate-700', iconBg: 'bg-violet-200 dark:bg-violet-900/30', iconText: 'text-violet-700 dark:text-violet-400', text: 'text-violet-900 dark:text-violet-100', subtext: 'text-violet-700 dark:text-violet-400/70', ping: 'bg-violet-600' },
    red: { bg: 'bg-rose-100 dark:bg-slate-800', border: 'border-rose-300 dark:border-slate-700', iconBg: 'bg-rose-200 dark:bg-rose-900/30', iconText: 'text-rose-700 dark:text-rose-400', text: 'text-rose-900 dark:text-rose-100', subtext: 'text-rose-700 dark:text-rose-400/70', ping: 'bg-rose-600' },
    cyan: { bg: 'bg-cyan-100 dark:bg-slate-800', border: 'border-cyan-300 dark:border-slate-700', iconBg: 'bg-cyan-200 dark:bg-cyan-900/30', iconText: 'text-cyan-700 dark:text-cyan-400', text: 'text-cyan-900 dark:text-cyan-100', subtext: 'text-cyan-700 dark:text-cyan-400/70', ping: 'bg-cyan-600' },
  };

  const s = styles[theme] || styles.blue;

  return (
    <div className={`${s.bg} ${s.border} p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${s.iconBg} border border-black/5 dark:border-white/5`}>
          <Icon className={`w-5 h-5 ${s.iconText}`} />
        </div>
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-700/50 border border-white/50 dark:border-slate-600 backdrop-blur-sm shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${s.ping}`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${s.ping}`}></span>
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-wide ${s.subtext}`}>Live</span>
        </span>
      </div>
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-0.5 opacity-90 ${s.text}`}>{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-extrabold tracking-tight ${s.text}`}>{value}</span>
          <span className={`font-bold text-xs ${s.subtext}`}>{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [readings, setReadings] = useState([]);
  const [latest, setLatest] = useState(null);
  const [ponds, setPonds] = useState([]);
  const [selectedPond, setSelectedPond] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [isSystemActive, setIsSystemActive] = useState(true);
  
  // NEW: State for selecting which metric to show on chart
  const [chartMetric, setChartMetric] = useState('dissolvedOxygen');

  const [alerts, setAlerts] = useState([
    { id: 1, title: 'Critical Ammonia', msg: 'Levels rose to 0.05 mg/L. Check bio-filters.', time: '2m ago', type: 'critical' },
    { id: 2, title: 'Low Salinity', msg: 'Rainfall detected. Salinity dropped by 2ppt.', time: '1h ago', type: 'warning' }
  ]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const dismissAlert = (id) => setAlerts(alerts.filter(a => a.id !== id));

  // --- MOCK DATA GENERATOR (All 6 Parameters) ---
  const generateChartData = () => {
    const data = [];
    const now = new Date();
    const currentHour = now.getHours();

    // 1. Generate History
    for (let i = 8; i > 0; i--) {
      data.push({
        time: `${Math.abs(currentHour - i) % 24}:00`,
        dissolvedOxygen: (6 + Math.random() * 0.5).toFixed(2),
        ph: (7.5 + Math.random() * 0.3).toFixed(2),
        temperature: (28 + Math.random() * 1.5).toFixed(1),
        turbidity: Math.floor(10 + Math.random() * 5),
        ammonia: (0.01 + Math.random() * 0.01).toFixed(3),
        salinity: (22 + Math.random() * 1).toFixed(1),
        isForecast: false
      });
    }

    // 2. "NOW" Data Point
    const currentValues = { 
      dissolvedOxygen: 6.2, ph: 7.8, temperature: 28.5, 
      turbidity: 12, ammonia: 0.02, salinity: 22.4 
    };
    
    data.push({
      time: "NOW",
      ...currentValues,
      // Start prediction lines from current values
      pred_dissolvedOxygen: currentValues.dissolvedOxygen,
      pred_ph: currentValues.ph,
      pred_temperature: currentValues.temperature,
      pred_turbidity: currentValues.turbidity,
      pred_ammonia: currentValues.ammonia,
      pred_salinity: currentValues.salinity,
      isForecast: false
    });

    // 3. Generate Forecast (Simulated trends)
    for (let i = 1; i <= 4; i++) {
      data.push({
        time: `${(currentHour + i) % 24}:00`,
        pred_dissolvedOxygen: (currentValues.dissolvedOxygen - (i * 0.3)).toFixed(2), // DO Drops
        pred_ph: (currentValues.ph - (i * 0.05)).toFixed(2),
        pred_temperature: (currentValues.temperature - (i * 0.2)).toFixed(1), // Temp drops at night
        pred_turbidity: currentValues.turbidity + i, // Turbidity rises
        pred_ammonia: (currentValues.ammonia + (i * 0.005)).toFixed(3), // Ammonia rises slowly
        pred_salinity: currentValues.salinity, // Stable
        isForecast: true
      });
    }
    return data;
  };

  useEffect(() => { 
    fetchPonds(); 
    setReadings(generateChartData());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
        setReadings(generateChartData());
        setIsSystemActive(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedPond]);

  const fetchPonds = async () => {
    try {
      const res = await axios.get(`${API_URL}/ponds`);
      if (res.data.length === 0) throw new Error("No Data");
      setPonds(res.data);
    } catch (err) {
      setPonds([
        { id: 1, name: "Research Pond A (Shrimp)" },
        { id: 2, name: "Research Pond B (Control)" },
        { id: 3, name: "Research Pond C (Treatment)" }
      ]);
    }
  };

  // Get config for current chart selection
  const activeChartMetric = CHART_METRICS[chartMetric];

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col">
        
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
          
          {/* --- TOP SECTION --- */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors duration-300">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard Overview</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Intelligent IoT & ML Predictive Framework
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700 text-sm">|</span>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 text-white border border-blue-400/20">
                  <div className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSystemActive ? 'bg-green-400' : 'bg-red-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isSystemActive ? 'bg-green-500' : 'bg-red-600'}`}></span>
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 fill-current ${isSystemActive ? 'animate-pulse' : 'opacity-50'}`} />
                    {isSystemActive ? 'System Active' : 'System Offline'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Status</span>
                
                {/* --- FADE MOTION RISK BADGE --- */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg border border-emerald-400/30 bg-gradient-to-r from-emerald-500 to-teal-500 animate-[pulse_3s_ease-in-out_infinite]">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white uppercase tracking-wide text-shadow-sm">Risk Level: Low</span>
                </div>

              </div>
              <div className="relative w-full md:w-72">
                <select className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm hover:border-blue-300" value={selectedPond} onChange={(e) => setSelectedPond(e.target.value)}>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* --- SENSOR CARDS (ALL 6 VISIBLE) --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <SensorCard title="Dissolved Oxygen" value={latest?.dissolvedOxygen || "6.2"} unit="mg/L" icon={Wind} theme="blue" />
            <SensorCard title="pH Level" value={latest?.ph || "7.8"} unit="pH" icon={Droplets} theme="green" />
            <SensorCard title="Temperature" value={latest?.temperature || "28.5"} unit="°C" icon={Thermometer} theme="orange" />
            <SensorCard title="Turbidity" value={latest?.turbidity || "12"} unit="NTU" icon={Activity} theme="purple" />
            <SensorCard title="Ammonia" value={latest?.ammonia || "0.02"} unit="mg/L" icon={Skull} theme="red" />
            <SensorCard title="Salinity" value={latest?.salinity || "22.4"} unit="ppt" icon={Waves} theme="cyan" />
          </div>

          {/* --- MAIN CONTENT GRID --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: INTERACTIVE CHART (2/3 Width) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* CHART CARD WITH TABS */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="bg-slate-50 dark:bg-slate-700/30 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Water Quality Trends
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time Sensor Data vs AI Forecast</p>
                    </div>
                    <button 
                        onClick={() => setShowForecast(!showForecast)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all
                        ${showForecast 
                            ? 'bg-violet-100 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'}
                        `}
                    >
                        <BrainCircuit className="w-4 h-4" />
                        {showForecast ? 'Hide Forecast' : 'Show AI Forecast'}
                    </button>
                  </div>

                  {/* MINI TABS FOR SELECTING CHART METRIC */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {Object.entries(CHART_METRICS).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setChartMetric(key)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all border
                            ${chartMetric === key 
                                ? `bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900` 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}
                            `}
                        >
                            {config.label}
                        </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 h-[320px] w-full bg-white dark:bg-slate-800/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readings}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600}} 
                        tickFormatter={(str) => str.includes("NOW") ? "NOW" : str} 
                        axisLine={false} tickLine={false}
                      />
                      <YAxis tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                      
                      <ReferenceLine x="NOW" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'NOW', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />

                      {/* DYNAMIC LINE: Changes based on selected tab */}
                      <Line 
                        type="monotone" 
                        dataKey={chartMetric} 
                        stroke={activeChartMetric.color} 
                        strokeWidth={3} 
                        dot={false} 
                        name={`Actual ${activeChartMetric.label}`} 
                        animationDuration={500}
                      />
                      
                      {/* FORECAST LINE: Connected to selected metric */}
                      {showForecast && (
                        <Line 
                            type="monotone" 
                            dataKey={`pred_${chartMetric}`} 
                            stroke={activeChartMetric.color} 
                            strokeWidth={3} 
                            strokeDasharray="5 5" 
                            dot={{ r: 4, strokeWidth: 2 }} 
                            name={`Predicted ${activeChartMetric.label}`}
                            connectNulls={true} 
                            strokeOpacity={0.6}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI DISEASE DETECTION WIDGET */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/20 px-6 py-4 border-b border-indigo-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-500" />
                    AI Disease Detection
                  </h3>
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-600 text-xs font-bold text-indigo-500 dark:text-indigo-300 uppercase shadow-sm">
                    Last Scan: 5m ago
                  </span>
                </div>
                
                <div className="p-6">
                  <div className="flex gap-5 items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 relative overflow-hidden group">
                      <Camera className="w-8 h-8 opacity-50 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-600">VIEW</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200">
                        Analysis Result: <span className="text-emerald-500">Healthy</span>
                      </h4>
                      <p className="text-sm text-slate-500 mt-1 max-w-lg leading-relaxed">
                        CNN Model analysis shows no signs of White Spot Syndrome Virus (WSSV) or Black Gill disease. Prawn activity levels are normal.
                      </p>
                      <button className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 uppercase tracking-wide flex items-center gap-1">
                        View Live Feed &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Controls & Alerts */}
            <div className="space-y-12">
              
              {/* CONTROL PANEL */}
              <div className="bg-indigo-50 dark:bg-slate-800 p-6 rounded-2xl border border-indigo-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                  <Power className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
                  System Control
                </h3>
                 <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-slate-700 transition-colors shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-indigo-900 dark:text-indigo-200">Main Aerator</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                        <CheckCircle2 className="w-3 h-3" /> ON
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Off</button>
                      <button className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase shadow-md hover:bg-indigo-700 transition-colors">Auto</button>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-slate-700 transition-colors shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-indigo-900 dark:text-indigo-200">Feed Pump</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 bg-slate-200 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase">OFF</span>
                    </div>
                    <button className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
                      Manual Override
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE ALERTS */}
              <div className="bg-rose-50 dark:bg-slate-800 p-6 rounded-2xl border border-rose-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-500" />
                    Live Alerts
                  </h3>
                  <span className="text-xs font-bold text-rose-600 bg-rose-200 dark:bg-rose-900/30 px-2 py-1 rounded-lg">{alerts.length} New</span>
                </div>
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="relative group p-4 bg-white dark:bg-slate-900 border-l-4 border-rose-500 dark:border-rose-600 rounded-r-xl shadow-sm hover:shadow-md transition-all">
                      <button onClick={() => dismissAlert(alert.id)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">{alert.title}</h4>
                        <span className="text-[10px] text-rose-500 font-bold uppercase">{alert.time}</span>
                      </div>
                      <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 font-medium">{alert.msg}</p>
                    </div>
                  ))}
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
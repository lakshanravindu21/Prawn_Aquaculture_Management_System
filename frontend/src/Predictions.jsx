import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, BrainCircuit, CloudRain, Wind, TrendingUp, AlertTriangle, 
  CheckCircle2, ChevronDown, Droplets, ThermometerSun, 
  Waves, Skull, Info, CloudLightning, ArrowRight,
  Wifi, WifiOff, Sun, Cloud, CloudFog, MapPin
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import Header from './Header';
import Footer from './Footer';

// --- CONFIGURATION ---
const METRICS = {
  do: { 
    id: 'do', apiKey: 'do', label: 'Dissolved Oxygen', unit: 'mg/L', 
    color: '#2563eb', optimal: 5.0, 
    bgActive: 'bg-blue-600', textActive: 'text-white',
    bgLight: 'bg-blue-100', bgDark: 'dark:bg-blue-900/40',
    border: 'border-blue-300 dark:border-blue-700', 
    icon: Wind 
  },
  ph: { 
    id: 'ph', apiKey: 'ph', label: 'pH Level', unit: 'pH', 
    color: '#059669', optimal: 7.8, 
    bgActive: 'bg-emerald-600', textActive: 'text-white',
    bgLight: 'bg-emerald-100', bgDark: 'dark:bg-emerald-900/40',
    border: 'border-emerald-300 dark:border-emerald-700', 
    icon: Droplets 
  },
  temp: { 
    id: 'temp', apiKey: 'temp', label: 'Temperature', unit: '°C', 
    color: '#ea580c', optimal: 29.0, 
    bgActive: 'bg-orange-600', textActive: 'text-white',
    bgLight: 'bg-orange-100', bgDark: 'dark:bg-orange-900/40',
    border: 'border-orange-300 dark:border-orange-700', 
    icon: ThermometerSun 
  },
  turb: { 
    id: 'turb', apiKey: 'turbidity', label: 'Turbidity', unit: 'NTU', 
    color: '#7c3aed', optimal: 30, 
    bgActive: 'bg-violet-600', textActive: 'text-white',
    bgLight: 'bg-violet-100', bgDark: 'dark:bg-violet-900/40',
    border: 'border-violet-300 dark:border-violet-700', 
    icon: Activity 
  },
  amm: { 
    id: 'amm', apiKey: 'ammonia', label: 'Ammonia', unit: 'mg/L', 
    color: '#dc2626', optimal: 0.05, 
    bgActive: 'bg-red-600', textActive: 'text-white',
    bgLight: 'bg-red-100', bgDark: 'dark:bg-red-900/40',
    border: 'border-red-300 dark:border-red-700', 
    icon: Skull 
  },
  sal: { 
    id: 'sal', apiKey: 'salinity', label: 'Salinity', unit: 'ppt', 
    color: '#0891b2', optimal: 20, 
    bgActive: 'bg-cyan-600', textActive: 'text-white',
    bgLight: 'bg-cyan-100', bgDark: 'dark:bg-cyan-900/40',
    border: 'border-cyan-300 dark:border-cyan-700', 
    icon: Waves 
  },
};

// Safe Number Formatter
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '--';
  return Number(num).toFixed(2);
};

export default function Predictions({ user, onLogout }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedPond, setSelectedPond] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState('do');
  const [viewMode, setViewMode] = useState('history'); 
  
  const [historyData, setHistoryData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', rainChance: 0, wind: 0, humidity: 0 });
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState('offline'); 

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const activeCfg = METRICS[selectedMetric];

  // 1. WEATHER API (Sri Lanka)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=6.9271&longitude=79.8612&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto');
        const current = res.data.current;
        const daily = res.data.daily;

        let condition = "Clear Sky";
        const code = current.weather_code;
        if (code >= 1 && code <= 3) condition = "Partly Cloudy";
        if (code >= 45 && code <= 48) condition = "Foggy";
        if (code >= 51 && code <= 67) condition = "Rainy";
        if (code >= 80 && code <= 99) condition = "Thunderstorms";

        setWeather({
          temp: Math.round(current.temperature_2m),
          condition: condition,
          rainChance: daily.precipitation_probability_max[0],
          wind: Math.round(current.wind_speed_10m),
          humidity: current.relative_humidity_2m
        });
      } catch (err) {
        console.error("Weather Error", err);
      }
    };
    fetchWeather();
  }, []);

  // 2. DATA FETCHING (History + AI)
  useEffect(() => {
    const fetchPondData = async () => {
      setLoading(true);
      try {
        // A. Get History
        const historyRes = await axios.get(`http://localhost:3001/api/readings/${selectedPond}`);
        
        if (historyRes.data.length > 0) {
          const rawHistory = historyRes.data.slice(0, 24).reverse(); 
          const formattedHistory = rawHistory.map(item => ({
            timeLabel: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            originalTime: item.timestamp,
            type: 'history',
            // Mapping Logic
            value: item[activeCfg.id === 'do' ? 'dissolvedOxygen' : 
                        activeCfg.id === 'ph' ? 'ph' : 
                        activeCfg.id === 'temp' ? 'temperature' : 
                        activeCfg.id === 'turb' ? 'turbidity' : 
                        activeCfg.id === 'amm' ? 'ammonia' : 'salinity']
          }));
          setHistoryData(formattedHistory);

          // B. Get AI Prediction
          try {
            const aiRes = await axios.get(`http://localhost:3001/api/predict/${selectedPond}`);
            
            if (aiRes.data && !aiRes.data.warning) {
              setAiStatus('active');
              
              const lastTime = new Date(formattedHistory[formattedHistory.length - 1].originalTime);
              const futureData = [];
              
              const startVal = formattedHistory[formattedHistory.length - 1].value;
              const targetVal = aiRes.data[activeCfg.apiKey]; 

              // SAFETY: If AI returns null/undefined, maintain current value (Flat Line)
              const finalTarget = (targetVal !== undefined && targetVal !== null) ? targetVal : startVal;

              for (let i = 1; i <= 6; i++) {
                const nextTime = new Date(lastTime.getTime() + i * 60 * 60 * 1000);
                // Linear Interpolation
                const val = startVal + ((finalTarget - startVal) * (i / 6));
                
                futureData.push({
                  timeLabel: nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: 'forecast',
                  value: val
                });
              }
              setForecastData(futureData);
            } else {
              setAiStatus('training');
            }
          } catch (aiErr) {
            setAiStatus('offline');
          }
        }
      } catch (err) {
        console.error("Data Error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPondData();
    const interval = setInterval(fetchPondData, 30000);
    return () => clearInterval(interval);

  }, [selectedPond, activeCfg]); 

  const chartData = viewMode === 'history' 
    ? historyData 
    : [...historyData.slice(-5), ...forecastData];

  // Dynamic Scaling to prevent Flat Lines
  const allValues = chartData.map(d => d.value).filter(v => !isNaN(v));
  const minVal = allValues.length > 0 ? Math.min(...allValues, activeCfg.optimal) * 0.95 : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues, activeCfg.optimal) * 1.05 : 10;

  // Icon Helper
  const renderWeatherIcon = () => {
    if (weather.condition.includes('Rain')) return <CloudRain className="w-16 h-16 text-white drop-shadow-md animate-bounce" />;
    if (weather.condition.includes('Cloud')) return <Cloud className="w-16 h-16 text-white drop-shadow-md" />;
    return <Sun className="w-16 h-16 text-yellow-300 drop-shadow-md animate-pulse" />;
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
        
        <Header 
          isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} onLogout={onLogout} 
        />

        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/20 text-white">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Predictive Analytics</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                    AI-Driven Forecasting & Biological Advisory
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase rounded-full border shadow-sm transition-all ${
                aiStatus === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                aiStatus === 'training' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                'bg-rose-100 text-rose-700 border-rose-200'
              }`}>
                {aiStatus === 'active' ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                  </span>
                ) : <WifiOff className="w-3.5 h-3.5" />}
                <span>AI Status: {aiStatus === 'active' ? 'Online' : aiStatus === 'training' ? 'Calibrating' : 'Offline'}</span>
              </div>

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

          {/* PARAMETER SELECTOR */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.values(METRICS).map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelectedMetric(m.id); setViewMode('history'); }} 
                className={`
                  relative overflow-hidden p-4 rounded-2xl border-2 transition-all duration-300 group text-left
                  ${selectedMetric === m.id 
                    ? `${m.bgActive} border-transparent shadow-xl scale-105 ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 ring-${m.color.replace('#', '')}` 
                    : `${m.bgLight} ${m.bgDark} ${m.border} hover:shadow-md hover:-translate-y-1`
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3 z-10 relative">
                  <div className={`p-2 rounded-full ${selectedMetric === m.id ? 'bg-white/20' : 'bg-white dark:bg-slate-800'}`}>
                    <m.icon className={`w-5 h-5 ${selectedMetric === m.id ? 'text-white' : m.text}`} />
                  </div>
                  <span className={`text-xs font-extrabold uppercase tracking-wide ${selectedMetric === m.id ? 'text-white' : m.text}`}>
                    {m.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: GOOGLE-STYLE WEATHER */}
            <div className="space-y-6">
              
              {/* BEAUTIFUL GRADIENT WEATHER CARD */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-[32px] shadow-2xl text-white p-6 transition-all hover:scale-[1.02] duration-300">
                {/* Header Row */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-400/30">Live Feed</span>
                    <h3 className="text-sm font-bold tracking-wide flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> COLOMBO, LK
                    </h3>
                  </div>
                  {/* Weather Icon Box */}
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                    {renderWeatherIcon()}
                  </div>
                </div>

                {/* Temp Row */}
                <div className="mb-8">
                  <div className="flex items-start">
                    <span className="text-8xl font-extrabold tracking-tighter drop-shadow-lg">{weather.temp}°</span>
                    <span className="text-3xl font-medium text-blue-200 mt-2">C</span>
                  </div>
                  <p className="text-lg font-medium text-blue-100 ml-1">{weather.condition}</p>
                </div>

                {/* Bottom Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Rain Card */}
                  <div className="bg-indigo-900/30 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/10 backdrop-blur-sm">
                    <Droplets className="w-5 h-5 text-cyan-300 mb-1" />
                    <span className="text-[10px] font-bold uppercase text-blue-200">Rain</span>
                    <span className="text-sm font-bold">{weather.rainChance}%</span>
                  </div>
                  {/* Wind Card */}
                  <div className="bg-indigo-900/30 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/10 backdrop-blur-sm">
                    <Wind className="w-5 h-5 text-emerald-300 mb-1" />
                    <span className="text-[10px] font-bold uppercase text-blue-200">Wind</span>
                    <span className="text-sm font-bold">{weather.wind} <span className="text-[10px]">km/h</span></span>
                  </div>
                  {/* Humid Card */}
                  <div className="bg-indigo-900/30 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/10 backdrop-blur-sm">
                    <Waves className="w-5 h-5 text-violet-300 mb-1" />
                    <span className="text-[10px] font-bold uppercase text-blue-200">Humid</span>
                    <span className="text-sm font-bold">{weather.humidity}%</span>
                  </div>
                </div>
              </div>

              {/* AI ADVISORY */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-violet-500" />
                  AI Recommendation
                </h3>
                {aiStatus === 'active' ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Conditions Optimal</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 leading-relaxed">
                          Predicted {activeCfg.label} levels remain stable near {activeCfg.optimal} {activeCfg.unit} for the next 6 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-full">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">System Learning</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
                          Waiting for sufficient sensor data (60 points) to initialize LSTM predictions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: CHART */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-6 h-6" style={{ color: activeCfg.color }} />
                      {activeCfg.label} Analysis
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Optimal Threshold: <span className="font-bold text-slate-700 dark:text-slate-200">{activeCfg.optimal} {activeCfg.unit}</span>
                    </p>
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setViewMode('history')}
                      className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                        viewMode === 'history' 
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Past 24H
                    </button>
                    <button
                      onClick={() => setViewMode('forecast')}
                      className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                        viewMode === 'forecast' 
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      AI Forecast <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="h-[450px] w-full">
                  {loading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center animate-pulse">
                      <Activity className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Synchronizing Sensors...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={activeCfg.color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={activeCfg.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                        
                        <XAxis 
                          dataKey="timeLabel" 
                          tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600}} 
                          axisLine={false} tickLine={false} minTickGap={30}
                        />
                        
                        <YAxis 
                          domain={[minVal, maxVal]} 
                          tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} 
                          axisLine={false} 
                          tickLine={false}
                          tickFormatter={(value) => value.toFixed(2)}
                          width={60}
                        />
                        
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const isFuture = payload[0].payload.type === 'forecast';
                              const val = payload[0].payload.value;
                              return (
                                <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isFuture ? 'bg-violet-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                                      {formatNumber(val)} <span className="text-xs text-slate-500 font-medium">{activeCfg.unit}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }} 
                        />
                        
                        {/* OPTIMAL LINE */}
                        <ReferenceLine 
                          y={activeCfg.optimal} 
                          stroke="#10b981" 
                          strokeDasharray="5 5" 
                          strokeWidth={2}
                          label={{ 
                            position: 'insideTopRight', 
                            value: `Optimal: ${activeCfg.optimal}`, 
                            fill: '#10b981', 
                            fontSize: 12, 
                            fontWeight: 'bold',
                            dy: -10 
                          }} 
                        />

                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={activeCfg.color} 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorMetric)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Current Reading</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white">
                    {historyData.length > 0 ? formatNumber(historyData[historyData.length - 1].value) : '--'}
                    <span className="text-sm font-medium text-slate-400 ml-1">{activeCfg.unit}</span>
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">24H Average</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white">
                    {historyData.length > 0 ? (historyData.reduce((acc, curr) => acc + curr.value, 0) / historyData.length).toFixed(2) : '--'}
                    <span className="text-sm font-medium text-slate-400 ml-1">{activeCfg.unit}</span>
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Health Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-lg font-bold text-emerald-600">Stable</span>
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
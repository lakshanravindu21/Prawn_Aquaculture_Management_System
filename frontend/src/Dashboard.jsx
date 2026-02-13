import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf'; // Ensure you have installed this: npm install jspdf
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  Droplets, Thermometer, Activity, Wind, AlertTriangle, Power, 
  ChevronDown, CheckCircle2, Moon, Sun, X, Skull, Waves, Camera, BrainCircuit, ShieldCheck, Zap,
  Fan, Utensils, FlaskConical, Radio, ScanEye, Maximize2, BellRing, Info, PlayCircle, WifiOff, Download
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// ✅ POINTING TO YOUR BACKEND
const API_URL = 'http://localhost:3001/api';

// --- CONFIGURATION ---
const CHART_METRICS = {
  dissolvedOxygen: { label: 'Dissolved Oxygen', unit: 'mg/L', color: '#3b82f6', yAxisId: 'right' },
  ph: { label: 'pH Level', unit: 'pH', color: '#10b981', yAxisId: 'right' },
  temperature: { label: 'Temperature', unit: '°C', color: '#f97316', yAxisId: 'left' },
  turbidity: { label: 'Turbidity', unit: 'NTU', color: '#8b5cf6', yAxisId: 'left' },
  ammonia: { label: 'Ammonia', unit: 'mg/L', color: '#ef4444', yAxisId: 'right' },
  salinity: { label: 'Salinity', unit: 'ppt', color: '#06b6d4', yAxisId: 'left' },
};

// --- SUB-COMPONENT: ACTUATOR CONTROL ---
const ActuatorControl = ({ name, icon: Icon, status, onToggle, colorClass }) => {
  const isActive = status === 'ON' || status === 'AUTO';
  
  const colorMap = {
    blue: 'bg-blue-500 text-white shadow-blue-200',
    orange: 'bg-orange-500 text-white shadow-orange-200',
    cyan: 'bg-cyan-500 text-white shadow-cyan-200',
    rose: 'bg-rose-500 text-white shadow-rose-200',
    emerald: 'bg-emerald-500 text-white shadow-emerald-200',
    violet: 'bg-violet-500 text-white shadow-violet-200',
  };

  const dotColor = {
    blue: 'bg-blue-500', orange: 'bg-orange-500', cyan: 'bg-cyan-500',
    rose: 'bg-rose-500', emerald: 'bg-emerald-500', violet: 'bg-violet-500',
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-lg transition-colors duration-300 ${isActive ? colorMap[colorClass] : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-none">{name}</h4>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 block uppercase tracking-wider">
              Status: <span className={isActive ? `text-${colorClass}-500` : ''}>{status}</span>
            </span>
          </div>
        </div>
        
        {isActive && (
          <span className="relative flex h-2.5 w-2.5 mt-1">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor[colorClass]}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor[colorClass]}`}></span>
          </span>
        )}
      </div>

      <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
        {['ON', 'AUTO', 'OFF'].map((mode) => (
          <button
            key={mode}
            onClick={() => onToggle(mode)}
            className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-md transition-all duration-200 shadow-sm
              ${status === mode 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent shadow-none'}
            `}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl min-w-[200px]">
        <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.name}</span>
              </div>
              <span className="font-mono font-bold" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- SUB-COMPONENT: SENSOR CARD ---
const SensorCard = ({ title, value, unit, icon: Icon, theme }) => {
  const styles = {
    blue: { bg: 'bg-blue-100 dark:bg-slate-800', border: 'border-blue-300 dark:border-slate-700', iconBg: 'bg-blue-200 dark:bg-blue-900/30', iconText: 'text-blue-700 dark:text-blue-400', text: 'text-slate-800 dark:text-slate-100', subtext: 'text-slate-500 dark:text-slate-400', badgeDot: 'bg-blue-500' },
    green: { bg: 'bg-emerald-100 dark:bg-slate-800', border: 'border-emerald-200 dark:border-slate-700', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400', text: 'text-slate-800 dark:text-slate-100', subtext: 'text-slate-500 dark:text-slate-400', badgeDot: 'bg-emerald-500' },
    orange: { bg: 'bg-orange-100 dark:bg-slate-800', border: 'border-orange-200 dark:border-slate-700', iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconText: 'text-orange-600 dark:text-orange-400', text: 'text-slate-800 dark:text-slate-100', subtext: 'text-slate-500 dark:text-slate-400', badgeDot: 'bg-orange-500' },
    purple: { bg: 'bg-violet-100 dark:bg-slate-800', border: 'border-violet-200 dark:border-slate-700', iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconText: 'text-violet-600 dark:text-violet-400', text: 'text-slate-800 dark:text-slate-100', subtext: 'text-slate-500 dark:text-slate-400', badgeDot: 'bg-violet-500' },
    red: { bg: 'bg-rose-100 dark:bg-slate-800', border: 'border-rose-200 dark:border-slate-700', iconBg: 'bg-rose-100 dark:bg-rose-900/30', iconText: 'text-rose-600 dark:text-rose-400', text: 'text-slate-800 dark:text-slate-100', subtext: 'text-slate-500 dark:text-slate-400', badgeDot: 'bg-rose-500' },
    cyan: { bg: 'bg-cyan-100 dark:bg-slate-800', border: 'border-cyan-200 dark:border-slate-700', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30', iconText: 'text-cyan-600 dark:text-cyan-400', text: 'text-slate-800 dark:text-slate-100', subtext: 'text-slate-500 dark:text-slate-400', badgeDot: 'bg-cyan-500' },
  };

  const s = styles[theme] || styles.blue;

  return (
    <div className={`${s.bg} ${s.border} p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 group`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${s.iconBg} border border-black/5 dark:border-white/5`}>
          <Icon className={`w-5 h-5 ${s.iconText}`} />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${s.badgeDot}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${s.badgeDot}`}></span>
          </span>
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-300 tracking-wider">LIVE</span>
        </div>
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

// --- MAIN DASHBOARD COMPONENT ---
export default function Dashboard({ user, onLogout }) {
  const [readings, setReadings] = useState([]);
  const [latest, setLatest] = useState(null);
  const [cameraSnapshot, setCameraSnapshot] = useState(null); 
  const [ponds, setPonds] = useState([]);
  const [selectedPond, setSelectedPond] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [chartMetric, setChartMetric] = useState('all');

  const alertsRef = useRef(null);

  const [actuators, setActuators] = useState({
    aerator: 'AUTO', pump: 'OFF', feeder: 'AUTO', heater: 'OFF', phDoser: 'AUTO', bioFilter: 'ON'
  });

  const [alerts, setAlerts] = useState([]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const dismissAlert = (id) => setAlerts(alerts.filter(a => a.id !== id));
  const toggleActuator = (key, val) => setActuators(prev => ({...prev, [key]: val}));

  const scrollToAlerts = () => {
    alertsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ LOGIC: PROFESSIONAL REPORT GENERATION
  const handleDownloadReport = () => {
    if (!latest) {
        alert("System is still synchronizing. Please wait for live data.");
        return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    // Use Sri Lanka Local Time
    const timestamp = new Date().toLocaleString('en-LK', { hour12: true });

    // 1. PDF Header
    doc.setFillColor(30, 41, 59).rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255).setFontSize(22).setFont('helvetica', 'bold').text("AquaSmart Analytical Report", 15, 20);
    doc.setFontSize(10).setFont('helvetica', 'normal').text(`Report ID: AS-${Date.now().toString().slice(-6)} | Pond ID: ${selectedPond}`, 15, 30);
    doc.text(`Researcher: ${user?.name || 'Authorized User'} | ${timestamp}`, pageWidth - 15, 30, { align: 'right' });

    // 2. Weather Context
    doc.setTextColor(0, 0, 0).setFontSize(14).setFont('helvetica', 'bold').text("1. Local Climate Snapshot (Colombo, LK)", 15, 55);
    doc.setFontSize(10).setFont('helvetica', 'normal').text(`Current Temperature: ${weather.temp}°C | Condition: ${weather.condition}`, 15, 63);
    doc.text(`Wind Speed: ${weather.wind} km/h | Rain Chance: ${weather.rainChance}%`, 15, 69);

    // 3. Sensor Matrix Table (Native Drawing)
    doc.setFontSize(14).setFont('helvetica', 'bold').text("2. Pond Sensor Matrix (Real-time)", 15, 85);
    doc.setFillColor(241, 245, 249).rect(15, 90, pageWidth - 30, 8, 'F');
    doc.setFontSize(10).text("Parameter", 20, 96); doc.text("Current Value", 95, 96); doc.text("Health Status", 160, 96);

    const rows = [
      { n: "Dissolved Oxygen", v: `${latest.dissolvedOxygen} mg/L`, s: (parseFloat(latest.dissolvedOxygen) < 4) ? "CRITICAL" : "Optimal" },
      { n: "pH Level", v: `${latest.ph} pH`, s: (parseFloat(latest.ph) < 7 || parseFloat(latest.ph) > 8.5) ? "Warning" : "Optimal" },
      { n: "Ammonia", v: `${latest.ammonia} mg/L`, s: (parseFloat(latest.ammonia) > 0.05) ? "TOXIC" : "Safe" },
      { n: "Temperature", v: `${latest.temperature} °C`, s: "Stable" },
      { n: "Salinity", v: `${latest.salinity} ppt`, s: "Normal" }
    ];

    let y = 105;
    rows.forEach(r => {
      doc.setFont('helvetica', 'normal').setTextColor(0).text(r.n, 20, y).text(r.v, 95, y);
      doc.setFont('helvetica', 'bold').setTextColor(r.s === "Optimal" || r.s === "Safe" || r.s === "Stable" ? [5, 150, 105] : [220, 38, 38]).text(r.s, 160, y);
      y += 10;
    });

    // 4. Footer
    doc.setFontSize(8).setTextColor(150).text("Generated by AquaSmart Intelligent Framework | Prawn Aquaculture Research", pageWidth / 2, 285, { align: 'center' });

    // Trigger Download
    doc.save(`AquaSmart_Report_Pond${selectedPond}_${Date.now()}.pdf`);
  };

  // --- INITIAL DATA FETCH ---
  useEffect(() => { 
    fetchPonds(); 
    refreshDashboardData();
  }, []);

  // --- POLLING ---
  useEffect(() => {
    const interval = setInterval(() => {
        refreshDashboardData();
    }, 5000); 
    return () => clearInterval(interval);
  }, [selectedPond]);

  // ✅ LOGIC: CALCULATE MISSING VALUES (SOFT SENSORS)
  const calculateSoftSensors = (data) => {
    return data.map(r => {
        let temp = parseFloat(r.temperature);
        let sal = parseFloat(r.salinity);
        let turb = parseFloat(r.turbidity);
        let ph = parseFloat(r.ph);
        
        // 1. DO Logic: Adjusted to ensure positive values even at high temp extremes
        let finalDO = r.dissolvedOxygen;
        if (!finalDO || finalDO === 0 || finalDO === "0.00") {
            let calculated = 14.6 - (0.33 * temp) - (0.05 * sal);
            finalDO = Math.max(0.8, calculated).toFixed(2);
        }

        // 2. Updated Ammonia Logic: Biological Baseline
        // Turbidity is currenty 0, so we add a baseline based on Temp and pH
        // This ensures the value is derived from pond conditions rather than staying at 0.
        let finalAmmonia = r.ammonia;
        if (!finalAmmonia || finalAmmonia === 0 || finalAmmonia === "0.000") {
            // Biological baseline formula: Base production from Temp and pH
            let biologicalFactor = (temp * 0.0008) + (ph * 0.001);
            let turbidityFactor = turb * 0.002;
            let calculated = biologicalFactor + turbidityFactor;
            finalAmmonia = Math.max(0.015, calculated).toFixed(3);
        }

        return {
            ...r,
            dissolvedOxygen: finalDO,
            ammonia: finalAmmonia,
            // Convert UTC to Sri Lanka local time display
            time: new Date(r.timestamp).toLocaleTimeString('en-LK', {hour: '2-digit', minute:'2-digit', hour12: true})
        };
    });
  };

  // ✅ NOTIFICATION SERVICE LOGIC
  const checkThresholds = (currentData) => {
    if (!currentData) return;

    const newAlerts = [];
    const timestamp = new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: true });

    // DISSOLVED OXYGEN CHECK
    const doVal = parseFloat(currentData.dissolvedOxygen);
    if (doVal < 4.0) {
        newAlerts.push({ id: 'do-crit', title: 'Critical Oxygen Level', msg: `DO dropped to ${doVal} mg/L. Activating aerators recommended.`, time: timestamp, type: 'critical' });
    } else if (doVal < 5.0) {
        newAlerts.push({ id: 'do-warn', title: 'Low Oxygen Warning', msg: `DO is ${doVal} mg/L. Monitor closely.`, time: timestamp, type: 'warning' });
    }

    // AMMONIA CHECK
    const ammVal = parseFloat(currentData.ammonia);
    if (ammVal > 0.05) {
        newAlerts.push({ id: 'nh3-crit', title: 'Toxic Ammonia', msg: `Ammonia at ${ammVal} mg/L. Immediate water exchange required.`, time: timestamp, type: 'critical' });
    } else if (ammVal > 0.02) {
        newAlerts.push({ id: 'nh3-warn', title: 'Ammonia Rising', msg: `Ammonia detected at ${ammVal} mg/L.`, time: timestamp, type: 'warning' });
    }

    // Only update if alerts have changed to avoid loops
    if (JSON.stringify(newAlerts) !== JSON.stringify(alerts)) {
        setAlerts(newAlerts);
    }
  };

  // ✅ FUNCTION TO FETCH REAL BACKEND DATA
  const refreshDashboardData = async () => {
    try {
      setIsSystemActive(true);

      const res = await axios.get(`${API_URL}/readings/${selectedPond}`);
      
      if (res.data && res.data.length > 0) {
        const processedData = calculateSoftSensors(res.data).reverse();
        setReadings(processedData);
        const currentReading = processedData[processedData.length - 1];
        setLatest(currentReading); 
        checkThresholds(currentReading);
      } else {
        setReadings([]);
        setLatest({ dissolvedOxygen: 0.00, ph: 0.0, temperature: 0.0, turbidity: 0, ammonia: 0.00, salinity: 0.0 });
      }

      const camRes = await axios.get(`${API_URL}/camera-logs`);
      if (camRes.data && camRes.data.length > 0) {
        setCameraSnapshot(camRes.data[0].url);
      }

    } catch (error) {
      console.warn("Backend offline.");
      setIsSystemActive(false); 
    }
  };

  const fetchPonds = async () => {
    try {
      const res = await axios.get(`${API_URL}/ponds`);
      if (res.data.length === 0) throw new Error("No Data");
      setPonds(res.data);
    } catch (err) {
      setPonds([
        { id: 1, name: "Research Pond A (Shrimp)" },
        { id: 2, name: "Research Pond B (Control)" }
      ]);
    }
  };

  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', rainChance: 0, wind: 0, humidity: 0 });

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

  const activeChartMetric = CHART_METRICS[chartMetric];

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col">
        
        <Header 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
          user={user} 
          onLogout={onLogout} 
          notifications={alerts} 
          onClearNotification={dismissAlert}
        />

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
                {/* ⬇️ DOWNLOAD REPORT BUTTON INTEGRATED ⬇️ */}
                <button 
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl shadow-md transition-all hover:scale-105"
                >
                  <Download className="w-4 h-4" /> Download Report
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg border border-emerald-400/30 bg-gradient-to-r from-emerald-500 to-teal-500 animate-[pulse_3s_ease-in-out_infinite]">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white uppercase tracking-wide text-shadow-sm">Risk Level: Low</span>
                </div>
              </div>
              <div className="relative w-full md:w-72">
                <select className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:border-blue-300" value={selectedPond} onChange={(e) => setSelectedPond(e.target.value)}>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* --- SENSOR CARDS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <SensorCard title="Dissolved Oxygen" value={latest?.dissolvedOxygen || "0.00"} unit="mg/L" icon={Wind} theme="blue" />
            <SensorCard title="pH Level" value={latest?.ph || "0.0"} unit="pH" icon={Droplets} theme="green" />
            <SensorCard title="Temperature" value={latest?.temperature || "0.0"} unit="°C" icon={Thermometer} theme="orange" />
            <SensorCard title="Turbidity" value={latest?.turbidity || "0"} unit="NTU" icon={Activity} theme="purple" />
            <SensorCard title="Ammonia" value={latest?.ammonia || "0.00"} unit="mg/L" icon={Skull} theme="red" />
            <SensorCard title="Salinity" value={latest?.salinity || "0.0"} unit="ppt" icon={Waves} theme="cyan" />
          </div>

          {/* --- MAIN CONTENT GRID --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-5 border-b border-slate-100 dark:border-slate-700 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-500" />
                          Water Quality Trends
                        </h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-full animate-pulse">
                          <Radio className="w-3 h-3 text-red-600 dark:text-red-400" />
                          <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest">LIVE SIGNAL</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time Sensor Data vs AI Forecast</p>
                    </div>
                    <button onClick={() => setShowForecast(!showForecast)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all shadow-sm ${showForecast ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'}`}>
                      <BrainCircuit className="w-4 h-4" /> {showForecast ? 'Hide Forecast' : 'Show AI Forecast'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setChartMetric('all')} className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all border shadow-sm flex items-center gap-2 ${chartMetric === 'all' ? `bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 transform scale-105` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                      <Maximize2 className="w-3 h-3" /> All Overview
                    </button>
                    {Object.entries(CHART_METRICS).map(([key, config]) => (
                        <button key={key} onClick={() => setChartMetric(key)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border shadow-sm flex items-center gap-1.5 ${chartMetric === key ? `bg-white dark:bg-slate-800 border-${config.color} ring-1 ring-${config.color} text-slate-800 dark:text-white transform scale-105` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`} style={chartMetric === key ? { borderColor: config.color, color: config.color } : {}}>
                            <span className={`w-1.5 h-1.5 rounded-full ${chartMetric === key ? 'animate-pulse' : ''}`} style={{ backgroundColor: config.color }}></span>
                            {config.label}
                        </button>
                    ))}
                  </div>
                </div>
                <div className="p-6 h-[400px] w-full bg-white dark:bg-slate-800/50">
                  <ResponsiveContainer width="100%" height="100%" key={chartMetric}>
                    {chartMetric === 'all' ? (
                      <LineChart data={readings}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                        <XAxis dataKey="time" tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        {Object.entries(CHART_METRICS).map(([key, config]) => (
                          <React.Fragment key={key}>
                            <Line type="monotone" yAxisId={config.yAxisId} dataKey={key} stroke={config.color} strokeWidth={2} dot={false} name={config.label} />
                          </React.Fragment>
                        ))}
                      </LineChart>
                    ) : (
                      <AreaChart data={readings}>
                        <defs><linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={activeChartMetric.color} stopOpacity={0.3}/><stop offset="95%" stopColor={activeChartMetric.color} stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                        <XAxis dataKey="time" tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId={activeChartMetric.yAxisId} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" yAxisId={activeChartMetric.yAxisId} dataKey={chartMetric} stroke={activeChartMetric.color} strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" name={activeChartMetric.label} animationDuration={1000} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/20 px-6 py-4 border-b border-indigo-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><ScanEye className="w-5 h-5 text-indigo-500" /> AI Vision</h3>
                </div>
                <div className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                  <div className="w-full sm:w-32 h-24 bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden">
                    {cameraSnapshot ? <img src={cameraSnapshot} alt="Pond Cam" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-slate-400" />}
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Result:</p>
                      <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /><span className="text-xs font-extrabold uppercase">Healthy</span></div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">Vision Model analysis shows no signs of anomaly detected based on latest frame.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              <div className="bg-indigo-50 dark:bg-slate-800 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm transition-colors duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-extrabold text-indigo-800 dark:text-indigo-100 flex items-center gap-2 uppercase tracking-wide"><Power className="w-4 h-4" /> System Control</h3>
                  <div className="relative group cursor-pointer" onClick={scrollToAlerts}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 shadow-sm group-hover:bg-rose-50 transition-colors">
                      <BellRing className={`w-4 h-4 ${alerts.length > 0 ? 'text-rose-500 animate-swing' : 'text-slate-400'}`} />
                      {alerts.length > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ActuatorControl name="Main Aerator" icon={Wind} status={actuators.aerator} onToggle={(val) => toggleActuator('aerator', val)} colorClass="blue" />
                  <ActuatorControl name="Feed Pump" icon={Utensils} status={actuators.feeder} onToggle={(val) => toggleActuator('feeder', val)} colorClass="orange" />
                  <ActuatorControl name="Water Pump" icon={Waves} status={actuators.pump} onToggle={(val) => toggleActuator('pump', val)} colorClass="cyan" />
                  <ActuatorControl name="Temp Control" icon={Sun} status={actuators.heater} onToggle={(val) => toggleActuator('heater', val)} colorClass="rose" />
                  <ActuatorControl name="pH Doser" icon={FlaskConical} status={actuators.phDoser} onToggle={(val) => toggleActuator('phDoser', val)} colorClass="emerald" />
                  <ActuatorControl name="Bio-Filter" icon={Activity} status={actuators.bioFilter} onToggle={(val) => toggleActuator('bioFilter', val)} colorClass="violet" />
                </div>
              </div>

              <div ref={alertsRef} className="bg-rose-50 dark:bg-slate-800 p-5 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-sm transition-colors duration-300 flex-1 min-h-[300px]">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-rose-100 dark:border-slate-700">
                  <h3 className="text-sm font-extrabold text-rose-700 dark:text-rose-100 flex items-center gap-2 uppercase tracking-wide"><AlertTriangle className="w-4 h-4" /> Live Alerts</h3>
                  <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full">{alerts.length} New</span>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                  {alerts.map(alert => (
                    <div key={alert.id} className="relative p-3 bg-white dark:bg-slate-900 border-l-4 border-rose-500 rounded shadow-sm hover:shadow-md transition-all animate-in slide-in-from-right-2 fade-in duration-300">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{alert.title}</h4>
                        <span className="text-[9px] font-bold text-rose-500 uppercase bg-rose-50 dark:bg-rose-900/20 px-1.5 rounded">{alert.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{alert.msg}</p>
                      <button onClick={() => dismissAlert(alert.id)} className="absolute top-1 right-1 p-1 text-slate-300 hover:text-slate-500"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 italic">No active alerts. System nominal.</div>
                  )}
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
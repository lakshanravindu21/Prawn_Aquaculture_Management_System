import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf'; // npm install jspdf
import html2canvas from 'html2canvas'; // ✅ npm install html2canvas
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
const AI_API_URL = 'http://localhost:5000'; // Flask Backend

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
              Status: <span className={isActive ? 'text-slate-900 dark:text-white' : ''}>{status}</span>
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
          {label} {payload[0].payload.isForecast ? '(AI Forecast)' : ''}
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

// ✅ Small chart just for PDF capture (NO UI CHANGE)
const PdfMetricChart = ({ title, color, data, dataKey, yAxisId = 'left' }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="text-xs font-extrabold text-slate-700 mb-2">{title}</div>
      <div style={{ width: 520, height: 170 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId={yAxisId} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip />
            <Line
              type="monotone"
              yAxisId={yAxisId}
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              strokeDasharray={data.some(d => d.isForecast) ? "5 5" : "0"}
              name={title}
            />
          </LineChart>
        </ResponsiveContainer>
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
  const [forecastData, setForecastData] = useState([]);
  const [aiStatus, setAiStatus] = useState("Collecting Data...");
  const [latestRecordedAt, setLatestRecordedAt] = useState(""); // ✅ NEW: time shown inside report/table

  const alertsRef = useRef(null);

  const [actuators, setActuators] = useState({
    aerator: 'AUTO', pump: 'OFF', feeder: 'AUTO', heater: 'OFF', phDoser: 'AUTO', bioFilter: 'ON'
  });

  const [alerts, setAlerts] = useState([]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const dismissAlert = (id) => setAlerts(alerts.filter(a => a.id !== id));
  const toggleActuator = (key, val) => setActuators(prev => ({ ...prev, [key]: val }));

  const scrollToAlerts = () => {
    alertsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ LOGIC: CALCULATE MISSING VALUES (SOFT SENSORS)
  const calculateSoftSensors = (data) => {
    return data.map(r => {
      let temp = parseFloat(r.temperature);
      let sal = parseFloat(r.salinity);
      let turb = parseFloat(r.turbidity);
      let ph = parseFloat(r.ph);

      // 1. DO Logic
      let finalDO = r.dissolvedOxygen;
      if (!finalDO || finalDO === 0 || finalDO === "0.00") {
        let calculated = 14.6 - (0.33 * temp) - (0.05 * sal);
        finalDO = Math.max(0.8, calculated).toFixed(2);
      }

      // 2. Ammonia Logic
      let finalAmmonia = r.ammonia;
      if (!finalAmmonia || finalAmmonia === 0 || finalAmmonia === "0.000") {
        let biologicalFactor = (temp * 0.0008) + (ph * 0.001);
        let turbidityFactor = turb * 0.002;
        let calculated = biologicalFactor + turbidityFactor;
        finalAmmonia = Math.max(0.015, calculated).toFixed(3);
      }

      const ts = r.timestamp ? new Date(r.timestamp) : new Date();
      return {
        ...r,
        dissolvedOxygen: finalDO,
        ammonia: finalAmmonia,
        // ✅ keep same "time" key used by charts, but now it is REAL time from DB
        time: ts.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: true }),
        recordedAt: ts.toLocaleString('en-LK', { hour12: true }),
      };
    });
  };

  // ✅ NOTIFICATION SERVICE LOGIC
  const checkThresholds = (currentData) => {
    if (!currentData || currentData.temperature === "0.0") return;

    const newAlerts = [];
    const timestamp = new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: true });

    const doVal = parseFloat(currentData.dissolvedOxygen);
    if (doVal < 4.0 && doVal > 0) {
      newAlerts.push({ id: 'do-crit', title: 'Critical Oxygen Level', msg: `DO dropped to ${doVal} mg/L. Activating aerators recommended.`, time: timestamp, type: 'critical' });
    } else if (doVal < 5.0 && doVal > 0) {
      newAlerts.push({ id: 'do-warn', title: 'Low Oxygen Warning', msg: `DO is ${doVal} mg/L. Monitor closely.`, time: timestamp, type: 'warning' });
    }

    const ammVal = parseFloat(currentData.ammonia);
    if (ammVal > 0.05) {
      newAlerts.push({ id: 'nh3-crit', title: 'Toxic Ammonia', msg: `Ammonia at ${ammVal} mg/L. Immediate water exchange required.`, time: timestamp, type: 'critical' });
    } else if (ammVal > 0.02) {
      newAlerts.push({ id: 'nh3-warn', title: 'Ammonia Rising', msg: `Ammonia detected at ${ammVal} mg/L.`, time: timestamp, type: 'warning' });
    }

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
        setLatestRecordedAt(currentReading?.recordedAt || "");
        checkThresholds(currentReading);
      } else {
        setReadings([]);
        setLatest({ dissolvedOxygen: "0.00", ph: "0.0", temperature: "0.0", turbidity: "0", ammonia: "0.00", salinity: "0.0" });
        setLatestRecordedAt("");
      }

      const camRes = await axios.get(`${API_URL}/camera-logs`);
      if (camRes.data && camRes.data.length > 0) {
        setCameraSnapshot(camRes.data[0].url);
      }
    } catch (error) {
      console.warn("Backend offline.");
      setIsSystemActive(false);
      setLatest({
        dissolvedOxygen: "0.00", ph: "0.0", temperature: "0.0", turbidity: "0", ammonia: "0.00", salinity: "0.0"
      });
      setLatestRecordedAt("");
      setReadings([]);
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
          temp: Math.round(current.temperature_2m), condition: condition,
          rainChance: daily.precipitation_probability_max[0],
          wind: Math.round(current.wind_speed_10m), humidity: current.relative_humidity_2m
        });
      } catch (err) { console.error("Weather Error", err); }
    };
    fetchWeather();
  }, []);

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

  // ✅ LOGIC: FETCH AI FORECAST TREND
  useEffect(() => {
    const getAIForecast = async () => {
      if (!showForecast || readings.length === 0) return;
      try {
        const last10 = readings.slice(-10).map(r => ({
          temp: r.temperature, ph: r.ph, do: r.dissolvedOxygen,
          ammonia: r.ammonia, turbidity: r.turbidity, salinity: r.salinity
        }));

        const aiRes = await axios.post(`${AI_API_URL}/predict`, { readings: last10 });

        if (aiRes.data) {
          setAiStatus(aiRes.data.status || "Collecting Data...");
        }

        if (aiRes.data && aiRes.data.status !== "Collecting Data...") {
          const startVal = readings[readings.length - 1];
          const isDanger = aiRes.data.status === "Danger";
          const projectedData = [];
          const now = new Date();

          for (let i = 1; i <= 6; i++) {
            const nextTime = new Date(now.getTime() + i * 30 * 60 * 1000);
            const variance = isDanger ? -(i * 0.05) : (Math.random() * 0.02 - 0.01);
            projectedData.push({
              ...startVal,
              time: nextTime.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: true }),
              recordedAt: nextTime.toLocaleString('en-LK', { hour12: true }),
              dissolvedOxygen: (parseFloat(startVal.dissolvedOxygen) + (isDanger ? variance * 0.5 : variance)).toFixed(2),
              ammonia: (parseFloat(startVal.ammonia) + (isDanger ? Math.abs(variance) * 0.1 : 0)).toFixed(3),
              ph: (parseFloat(startVal.ph) + (variance * 0.1)).toFixed(2),
              isForecast: true
            });
          }
          setForecastData(projectedData);
        } else {
          setForecastData([]);
        }
      } catch (err) {
        console.warn("AI Server unreachable for forecast trend.");
        setAiStatus("AI Offline");
        setForecastData([]);
      }
    };
    getAIForecast();
  }, [showForecast, readings]);

  const activeChartMetric = CHART_METRICS[chartMetric];
  const combinedChartData = showForecast ? [...readings.slice(-15), ...forecastData] : readings;

  // ✅ --------- REPORT HELPERS (NO UI CHANGE) ----------
  const safeNum = (v, digits = 2) => {
    const n = parseFloat(v);
    if (Number.isNaN(n)) return "—";
    return n.toFixed(digits);
  };

  const getRiskBadge = (l) => {
    if (!l) return { label: "UNKNOWN", color: [100, 116, 139] };

    const doV = parseFloat(l.dissolvedOxygen);
    const ammV = parseFloat(l.ammonia);
    const phV = parseFloat(l.ph);
    const tempV = parseFloat(l.temperature);
    const turbV = parseFloat(l.turbidity);
    const salV = parseFloat(l.salinity);

    let score = 0;
    if (doV > 0 && doV < 4.0) score += 3;
    else if (doV > 0 && doV < 5.0) score += 2;

    if (ammV > 0.05) score += 3;
    else if (ammV > 0.02) score += 2;

    if (phV < 7.0 || phV > 8.5) score += 2;
    if (tempV > 33 || tempV < 24) score += 1;

    if (!Number.isNaN(turbV)) {
      if (turbV > 80) score += 2;
      else if (turbV > 50) score += 1;
    }

    if (!Number.isNaN(salV)) {
      if (salV < 5 || salV > 35) score += 1;
    }

    if (aiStatus === "Danger") score += 3;
    if (aiStatus === "Warning") score += 1;

    if (score >= 7) return { label: "HIGH", color: [239, 68, 68] };
    if (score >= 3) return { label: "MEDIUM", color: [245, 158, 11] };
    return { label: "LOW", color: [16, 185, 129] };
  };

  const statusText = (param, value) => {
    const v = parseFloat(value);
    if (Number.isNaN(v)) return "—";

    if (param === "do") {
      if (v < 4.0) return "CRITICAL";
      if (v < 5.0) return "WARNING";
      return "OPTIMAL";
    }
    if (param === "ph") {
      if (v < 7.0 || v > 8.5) return "WARNING";
      return "OPTIMAL";
    }
    if (param === "amm") {
      if (v > 0.05) return "TOXIC";
      if (v > 0.02) return "WARNING";
      return "SAFE";
    }
    if (param === "temp") {
      if (v < 24 || v > 33) return "WATCH";
      return "STABLE";
    }
    if (param === "turb") {
      if (v > 80) return "CRITICAL";
      if (v > 50) return "WARNING";
      return "NORMAL";
    }
    if (param === "sal") {
      if (v < 5 || v > 35) return "WATCH";
      return "NORMAL";
    }
    return "NORMAL";
  };

  const statusColor = (s) => {
    if (s === "OPTIMAL" || s === "SAFE" || s === "STABLE" || s === "NORMAL") return [16, 185, 129];
    if (s === "WARNING" || s === "WATCH") return [245, 158, 11];
    return [239, 68, 68];
  };

  const drawChip = (doc, x, y, w, h, text, rgb, textRgb = [255, 255, 255]) => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(String(text), x + w / 2, y + h / 2 + 3, { align: 'center' });
  };

  // ✅ PDF "mode buttons" (ON / AUTO / OFF) — colored + aligned
  const drawModeButtons = (doc, x, y, activeMode, accentRgb) => {
    const modes = ["ON", "AUTO", "OFF"];
    const w = 14;
    const h = 6.8;
    const gap = 1.6;

    const modeFill = (m) => {
      if (m === "ON") return [16, 185, 129];
      if (m === "AUTO") return accentRgb;
      return [100, 116, 139];
    };

    modes.forEach((m, i) => {
      const bx = x + i * (w + gap);
      const isActive = activeMode === m;

      if (isActive) {
        const c = modeFill(m);
        doc.setFillColor(c[0], c[1], c[2]);
        doc.roundedRect(bx, y, w, h, 2.6, 2.6, 'F');
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(bx, y, w, h, 2.6, 2.6, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(bx, y, w, h, 2.6, 2.6, 'S');
        doc.setTextColor(100, 116, 139);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.text(m, bx + w / 2, y + h / 2 + 2.6, { align: 'center' });
    });
  };

  const drawKpiCard = (doc, x, y, w, h, title, value, unit, accentRgb) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, w, h, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, 6, 6, 'S');

    doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.roundedRect(x, y, 8, h, 6, 6, 'F');

    const titleY = y + 10;
    const valueY = y + h - 7;

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, x + 14, titleY);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`${value}`, x + 14, valueY);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(unit, x + w - 10, valueY, { align: 'right' });
  };

  const drawMiniSparkline = (doc, x, y, w, h, values, lineRgb, drawFrame = true) => {
    const nums = values
      .map(v => parseFloat(v))
      .filter(v => !Number.isNaN(v));

    if (drawFrame) {
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, w, h, 4, 4, 'S');
    }

    if (nums.length < 2) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8.6);
      doc.text("Trend unavailable", x + 3, y + 11);
      return;
    }

    const minV = Math.min(...nums);
    const maxV = Math.max(...nums);
    const range = Math.max(0.0001, maxV - minV);
    const step = w / (nums.length - 1);

    doc.setDrawColor(lineRgb[0], lineRgb[1], lineRgb[2]);
    doc.setLineWidth(1.25);

    const px = (i) => x + i * step;
    const py = (v) => y + h - ((v - minV) / range) * (h - 6) - 3;

    for (let i = 0; i < nums.length - 1; i++) {
      doc.line(px(i), py(nums[i]), px(i + 1), py(nums[i + 1]));
    }

    doc.setFillColor(lineRgb[0], lineRgb[1], lineRgb[2]);
    doc.circle(px(nums.length - 1), py(nums[nums.length - 1]), 0.85, 'F');
  };

  const drawWrappedText = (doc, text, x, y, maxW, lineH = 5.2, options = {}) => {
    const t = String(text ?? "");
    const lines = doc.splitTextToSize(t, maxW);
    doc.text(lines, x, y, options);
    return y + (lines.length * lineH);
  };

  const drawSectionTitle = (doc, title, x, y, w) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y - 6, w, 10, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y - 6, w, 10, 4, 4, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x + 6, y + 1);
    return y + 10;
  };

  const drawDivider = (doc, x, y, w) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(x, y, x + w, y);
  };

  const drawPageNumber = (doc, pageW, pageH, pageIndex, totalPages) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${pageIndex} / ${totalPages}`, pageW - 14, pageH - 8, { align: 'right' });
  };

  const computeStatusStats = (data12, latestRow) => {
    const base = data12?.length ? data12 : [];
    const rows = base.length ? base : (latestRow ? [latestRow] : []);

    let ok = 0, warn = 0, crit = 0;
    rows.forEach(r => {
      const doS = statusText("do", r.dissolvedOxygen);
      const ammS = statusText("amm", r.ammonia);
      const phS = statusText("ph", r.ph);
      const tS = statusText("temp", r.temperature);
      const turbS = statusText("turb", r.turbidity);
      const salS = statusText("sal", r.salinity);

      const statuses = [doS, ammS, phS, tS, turbS, salS];
      if (statuses.some(s => (s === "CRITICAL" || s === "TOXIC"))) crit += 1;
      else if (statuses.some(s => (s === "WARNING" || s === "WATCH"))) warn += 1;
      else ok += 1;
    });

    const total = Math.max(1, ok + warn + crit);
    return { ok, warn, crit, total };
  };

  const drawStatusBar = (doc, x, y, w, h, stats) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, w, h, 5, 5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, 5, 5, 'S');

    const innerX = x + 6;
    const innerY = y + 11;
    const innerW = w - 12;
    const barH = 5.6;

    const okW = (stats.ok / stats.total) * innerW;
    const warnW = (stats.warn / stats.total) * innerW;
    const critW = (stats.crit / stats.total) * innerW;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.6);
    doc.setTextColor(15, 23, 42);
    doc.text("Quality Distribution (last samples)", x + 6, y + 8);

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(innerX, innerY, innerW, barH, 3, 3, 'F');

    let segX = innerX;
    if (okW > 0) {
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(segX, innerY, okW, barH, 3, 3, 'F');
      segX += okW;
    }
    if (warnW > 0) {
      doc.setFillColor(245, 158, 11);
      doc.rect(segX, innerY, warnW, barH, 'F');
      segX += warnW;
    }
    if (critW > 0) {
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(segX, innerY, critW, barH, 3, 3, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.setTextColor(51, 65, 85);

    const legendY = y + h - 4.2;
    doc.setFillColor(16, 185, 129); doc.circle(x + 10, legendY - 2.2, 1.1, 'F');
    doc.text(`OK: ${stats.ok}`, x + 14, legendY);

    doc.setFillColor(245, 158, 11); doc.circle(x + 40, legendY - 2.2, 1.1, 'F');
    doc.text(`Warn: ${stats.warn}`, x + 44, legendY);

    doc.setFillColor(239, 68, 68); doc.circle(x + 78, legendY - 2.2, 1.1, 'F');
    doc.text(`Critical: ${stats.crit}`, x + 82, legendY);
  };

  // ✅ Trend mini-card (PDF) — clearer (adds "Latest" value text)
  const drawTrendCard = (doc, x, y, w, h, label, values, rgb) => {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, 6, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);

    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.circle(x + 8.5, y + 8.6, 1.2, 'F');
    doc.text(label, x + 12, y + 9.6);

    // ✅ Latest value (right side) for clarity
    const nums = values.map(v => parseFloat(v)).filter(v => !Number.isNaN(v));
    const last = nums.length ? nums[nums.length - 1] : null;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`Latest: ${last !== null ? last.toFixed(2) : "—"}`, x + w - 6, y + 9.6, { align: 'right' });

    drawMiniSparkline(doc, x + 5.5, y + 12, w - 11, h - 15.5, values, rgb, false);
  };

  // ✅ Actions when critical (in report)
  const getRecommendedActions = (l) => {
    if (!l) return [];
    const actions = [];
    const doV = parseFloat(l.dissolvedOxygen);
    const ammV = parseFloat(l.ammonia);
    const phV = parseFloat(l.ph);
    const tempV = parseFloat(l.temperature);
    const turbV = parseFloat(l.turbidity);
    const salV = parseFloat(l.salinity);

    if (!Number.isNaN(doV) && doV > 0) {
      if (doV < 4.0) actions.push("CRITICAL DO: Turn ON main aerator immediately, increase surface agitation, and re-check DO within 10–15 minutes.");
      else if (doV < 5.0) actions.push("LOW DO: Keep aerator in AUTO/ON during night, reduce feeding temporarily, and monitor trend.");
    }

    if (!Number.isNaN(ammV)) {
      if (ammV > 0.05) actions.push("TOXIC NH3: Perform partial water exchange, stop feeding for a short period, and ensure bio-filter is ON.");
      else if (ammV > 0.02) actions.push("RISING NH3: Reduce feeding slightly, confirm bio-filter operation, and schedule water exchange if trend increases.");
    }

    if (!Number.isNaN(phV)) {
      if (phV < 7.0) actions.push("LOW pH: Verify pH probe calibration, add buffer strategy via pH doser (as per lab guidance), and avoid sudden changes.");
      if (phV > 8.5) actions.push("HIGH pH: Reduce algae bloom risk (shade/management), verify probe calibration, and stabilize with controlled dosing if available.");
    }

    if (!Number.isNaN(tempV)) {
      if (tempV < 24) actions.push("LOW TEMP: Enable temperature control (if available) and reduce feeding to prevent stress.");
      if (tempV > 33) actions.push("HIGH TEMP: Increase aeration, improve water circulation, and avoid heavy feeding during peak heat.");
    }

    if (!Number.isNaN(turbV)) {
      if (turbV > 80) actions.push("HIGH TURBIDITY: Check inlet/outlet flow, reduce disturbance, and confirm filter/settling process.");
      else if (turbV > 50) actions.push("TURBIDITY WARNING: Monitor solids build-up and improve circulation / filtration if needed.");
    }

    if (!Number.isNaN(salV)) {
      if (salV < 5 || salV > 35) actions.push("SALINITY WATCH: Confirm salinity sensor, and adjust water mixing gradually (avoid rapid salinity shifts).");
    }

    if (aiStatus === "Danger") actions.push("AI DANGER FORECAST: Prepare preventive actions (aeration + water exchange readiness) and increase monitoring frequency.");
    if (aiStatus === "AI Offline") actions.push("AI OFFLINE: Use sensor thresholds only; verify AI server connection and continue manual monitoring.");

    actions.push("General guideline: Cross-check any critical reading with a manual test kit before major interventions.");
    actions.push("General guideline: Log actions taken (time, change, result) to improve future AI forecasting accuracy.");

    return Array.from(new Set(actions));
  };

  // ✅ --------- REAL CHART IMAGE CAPTURE FOR PDF ----------
  const pdfChartsWrapRef = useRef(null);
  const pdfChartRefs = useRef({
    dissolvedOxygen: null,
    ph: null,
    temperature: null,
    turbidity: null,
    ammonia: null,
    salinity: null,
  });

  const captureNodeToPng = async (node) => {
    if (!node) return null;
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    });
    return canvas.toDataURL('image/png', 1.0);
  };

  const addImageFit = (doc, imgData, x, y, w, h) => {
    const props = doc.getImageProperties(imgData);
    const imgW = props.width;
    const imgH = props.height;
    const imgRatio = imgW / imgH;
    const boxRatio = w / h;

    let drawW = w;
    let drawH = h;
    let drawX = x;
    let drawY = y;

    if (imgRatio > boxRatio) {
      drawH = w / imgRatio;
      drawY = y + (h - drawH) / 2;
    } else {
      drawW = h * imgRatio;
      drawX = x + (w - drawW) / 2;
    }

    doc.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH, undefined, 'FAST');
  };

  // ✅ LOGIC: PROFESSIONAL REPORT GENERATION
  // ✅ FIXED: (4) Recommended Actions now ALWAYS starts on PAGE 3
  // ✅ Also: Recent Trends & Quality Stats clearer (trend cards show Latest)
  const handleDownloadReport = async () => {
    if (!latest) {
      alert("System is still synchronizing. Please wait for live data.");
      return;
    }

    const last12 = readings.slice(-12);
    const chartBaseData = (showForecast ? [...readings.slice(-15), ...forecastData] : readings).slice(-18);
    const stats = computeStatusStats(last12, latest);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    const now = new Date();
    const timestamp = now.toLocaleString('en-LK', { hour12: true });
    const reportId = `AS-${Date.now().toString().slice(-6)}`;

    const pondName = ponds.find(p => String(p.id) === String(selectedPond))?.name || `Pond ${selectedPond}`;
    const risk = getRiskBadge(latest);

    // ✅ Capture 6 charts as real images (NO UI CHANGE)
    await new Promise(res => setTimeout(res, 140));
    const chartImgs = {};
    for (const key of Object.keys(pdfChartRefs.current)) {
      const node = pdfChartRefs.current[key];
      chartImgs[key] = await captureNodeToPng(node);
    }

    // ---------- PAGE 1 ----------
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 48, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 44, pageW, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text("AquaSmart Analytical Report", margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Report ID: ${reportId}`, margin, 30);
    doc.text(`Pond: ${pondName}  |  Pond ID: ${selectedPond}`, margin, 36);
    doc.text(`Generated: ${timestamp}`, pageW - margin, 30, { align: 'right' });
    doc.text(`Researcher: ${user?.name || 'Authorized User'}`, pageW - margin, 36, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Latest Reading: ${latestRecordedAt || "—"}`, margin, 42);

    drawChip(doc, pageW - margin - 44, 12, 44, 10, `RISK: ${risk.label}`, risk.color);

    // KPI cards
    const kpiY = 56;
    const kpiW = (pageW - margin * 2 - 10) / 3;
    const kpiH = 26;
    const kpiRowGap = 8;
    const kpiBlockGap = 14;
    const kpiRow2Y = kpiY + kpiH + kpiRowGap;

    drawKpiCard(doc, margin, kpiY, kpiW, kpiH, "Dissolved Oxygen", safeNum(latest.dissolvedOxygen, 2), "mg/L", [59, 130, 246]);
    drawKpiCard(doc, margin + kpiW + 5, kpiY, kpiW, kpiH, "pH Level", safeNum(latest.ph, 2), "pH", [16, 185, 129]);
    drawKpiCard(doc, margin + (kpiW + 5) * 2, kpiY, kpiW, kpiH, "Temperature", safeNum(latest.temperature, 2), "°C", [249, 115, 22]);

    drawKpiCard(doc, margin, kpiRow2Y, kpiW, kpiH, "Turbidity", safeNum(latest.turbidity, 0), "NTU", [139, 92, 246]);
    drawKpiCard(doc, margin + kpiW + 5, kpiRow2Y, kpiW, kpiH, "Ammonia", safeNum(latest.ammonia, 3), "mg/L", [239, 68, 68]);
    drawKpiCard(doc, margin + (kpiW + 5) * 2, kpiRow2Y, kpiW, kpiH, "Salinity", safeNum(latest.salinity, 2), "ppt", [6, 182, 212]);

    // Context Snapshot
    const boxY = kpiRow2Y + kpiH + kpiBlockGap;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, boxY, pageW - margin * 2, 34, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, boxY, pageW - margin * 2, 34, 6, 6, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("Context Snapshot", margin + 6, boxY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    const wTemp = weather?.temp ?? '--';
    const wCond = weather?.condition ?? '—';
    const wWind = weather?.wind ?? 0;
    const wRain = weather?.rainChance ?? 0;
    const wHum = weather?.humidity ?? 0;

    doc.text(`Location: Colombo, Sri Lanka`, margin + 6, boxY + 18);
    doc.text(`Weather: ${wCond}  |  Temp: ${wTemp}°C  |  Humidity: ${wHum}%`, margin + 6, boxY + 25);
    doc.text(`Wind: ${wWind} km/h  |  Rain Chance: ${wRain}%`, margin + 6, boxY + 32);

    // AI Prediction block
    const aiY = boxY + 42;
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(margin, aiY, pageW - margin * 2, 38, 6, 6, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, aiY, pageW - margin * 2, 38, 6, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(12);
    doc.text("AI Water Quality Prediction", margin + 6, aiY + 10);

    const aiLabel = aiStatus || "Collecting Data...";
    const aiChipColor =
      aiLabel === "Danger" ? [239, 68, 68] :
        aiLabel === "Warning" ? [245, 158, 11] :
          aiLabel === "Safe" ? [16, 185, 129] :
            aiLabel === "AI Offline" ? [100, 116, 139] :
              [59, 130, 246];

    drawChip(doc, pageW - margin - 46, aiY + 6, 46, 10, aiLabel.toUpperCase(), aiChipColor);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);

    const f0 = forecastData?.[0];
    const f1 = forecastData?.[1];

    const nextLine = (f) => f
      ? `Next: DO ${safeNum(f.dissolvedOxygen, 2)} mg/L | pH ${safeNum(f.ph, 2)} | NH3 ${safeNum(f.ammonia, 3)} @ ${f.time}`
      : "Next: Forecast not available (enable ‘Show AI Forecast’ to generate).";

    let textY = aiY + 18;
    textY = drawWrappedText(doc, nextLine(f0), margin + 6, textY, pageW - margin * 2 - 56, 5.1);
    if (f1) drawWrappedText(doc, `Then: DO ${safeNum(f1.dissolvedOxygen, 2)} | pH ${safeNum(f1.ph, 2)} | NH3 ${safeNum(f1.ammonia, 3)} @ ${f1.time}`, margin + 6, textY, pageW - margin * 2 - 10, 5.1);

    // ✅ 1) Recent Trends & Quality Stats (clearer + no overlap)
    const footerSafeBottom = pageH - 18;
    const trendCardY = aiY + 50;
    const maxTrendH = Math.max(58, footerSafeBottom - trendCardY);

    const pad = 6;
    const headerH = 16;
    const gap = 4.5;
    const rowGap = 4.5;

    const desiredSparkH = 16;
    const desiredBarH = 22;
    let sparkH = desiredSparkH;
    let barH = desiredBarH;

    const usableH = maxTrendH - (pad * 2) - headerH - (gap * 2) - rowGap;
    const needH = (sparkH * 2) + barH;
    if (needH > usableH) {
      const scale = Math.max(0.75, usableH / Math.max(1, needH));
      sparkH = Math.max(12, sparkH * scale);
      barH = Math.max(16, barH * scale);
    }

    const trendCardH = (pad * 2) + headerH + gap + sparkH + rowGap + sparkH + gap + barH;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, trendCardY, pageW - margin * 2, trendCardH, 8, 8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, trendCardY, pageW - margin * 2, trendCardH, 8, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Recent Trends & Quality Stats", margin + pad, trendCardY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Last 12 readings summary (sparklines) + distribution", margin + pad, trendCardY + 15);

    const contentX = margin + pad;
    const contentW = pageW - margin * 2 - pad * 2;

    const sparkGap = 6;
    const sparkW = (contentW - sparkGap * 2) / 3;

    const sX0 = contentX;
    const sX1 = contentX + sparkW + sparkGap;
    const sX2 = contentX + (sparkW + sparkGap) * 2;

    const sparkRow1Y = trendCardY + pad + headerH;
    drawTrendCard(doc, sX0, sparkRow1Y, sparkW, sparkH, "DO (Last 12)", last12.map(r => r.dissolvedOxygen), [59, 130, 246]);
    drawTrendCard(doc, sX1, sparkRow1Y, sparkW, sparkH, "pH (Last 12)", last12.map(r => r.ph), [16, 185, 129]);
    drawTrendCard(doc, sX2, sparkRow1Y, sparkW, sparkH, "Temp (Last 12)", last12.map(r => r.temperature), [249, 115, 22]);

    const sparkRow2Y = sparkRow1Y + sparkH + rowGap;
    drawTrendCard(doc, sX0, sparkRow2Y, sparkW, sparkH, "Turb (Last 12)", last12.map(r => r.turbidity), [139, 92, 246]);
    drawTrendCard(doc, sX1, sparkRow2Y, sparkW, sparkH, "NH3 (Last 12)", last12.map(r => r.ammonia), [239, 68, 68]);
    drawTrendCard(doc, sX2, sparkRow2Y, sparkW, sparkH, "Sal (Last 12)", last12.map(r => r.salinity), [6, 182, 212]);

    const barY = sparkRow2Y + sparkH + gap;
    drawStatusBar(doc, contentX, barY, contentW, barH, stats);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by AquaSmart Intelligent Framework | Prawn Aquaculture Research", pageW / 2, pageH - 8, { align: 'center' });

    // ---------- PAGE 2 ----------
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Detailed Report — ${pondName}`, margin, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Report ID: ${reportId}`, pageW - margin, 11, { align: 'right' });

    const contentW2 = pageW - margin * 2;
    let cursorY = 26;

    // Section: Sensor Matrix
    cursorY = drawSectionTitle(doc, "1) Pond Sensor Matrix (Real-time)", margin, cursorY, contentW2);

    const rowH = 9;
    const col1W = contentW2 * 0.46;
    const col2W = contentW2 * 0.30;
    const col3W = contentW2 - col1W - col2W;

    const headY = cursorY;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, headY, contentW2, rowH, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, headY, contentW2, rowH, 4, 4, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text("Parameter", margin + 6, headY + 6);
    doc.text("Current (with time)", margin + col1W + 6, headY + 6);
    doc.text("Status", margin + col1W + col2W + 6, headY + 6);

    const rows = [
      { name: "Dissolved Oxygen", val: `${safeNum(latest.dissolvedOxygen, 2)} mg/L`, st: statusText("do", latest.dissolvedOxygen) },
      { name: "pH Level", val: `${safeNum(latest.ph, 2)} pH`, st: statusText("ph", latest.ph) },
      { name: "Temperature", val: `${safeNum(latest.temperature, 2)} °C`, st: statusText("temp", latest.temperature) },
      { name: "Turbidity", val: `${safeNum(latest.turbidity, 0)} NTU`, st: statusText("turb", latest.turbidity) },
      { name: "Ammonia (NH3)", val: `${safeNum(latest.ammonia, 3)} mg/L`, st: statusText("amm", latest.ammonia) },
      { name: "Salinity", val: `${safeNum(latest.salinity, 2)} ppt`, st: statusText("sal", latest.salinity) },
    ];

    cursorY = headY + rowH + 3;

    rows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.roundedRect(margin, cursorY, contentW2, rowH, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, contentW2, rowH, 3, 3, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);

      const pText = doc.splitTextToSize(r.name, col1W - 12);
      doc.text(pText, margin + 6, cursorY + 6);

      doc.setTextColor(51, 65, 85);
      const currentWithTime = `${r.val}  @  ${latest?.time || "—"}`;
      const cText = doc.splitTextToSize(currentWithTime, col2W - 12);
      doc.text(cText, margin + col1W + 6, cursorY + 6);

      const chipW = Math.min(col3W - 10, 42);
      const chipX = margin + col1W + col2W + (col3W / 2) - (chipW / 2);
      const chipY = cursorY + 1;
      const c = statusColor(r.st);
      drawChip(doc, chipX, chipY, chipW, 7, r.st, c);

      cursorY += rowH + 2;
    });

    cursorY += 4;
    drawDivider(doc, margin, cursorY, contentW2);
    cursorY += 8;

    // ✅ 2) System Control Modes
    cursorY = drawSectionTitle(doc, "2) System Control Modes", margin, cursorY, contentW2);

    const ctrlItems = [
      { k: "Main Aerator", v: actuators.aerator, accent: [59, 130, 246] },
      { k: "Feed Pump", v: actuators.feeder, accent: [249, 115, 22] },
      { k: "Water Pump", v: actuators.pump, accent: [6, 182, 212] },
      { k: "Temp Control", v: actuators.heater, accent: [244, 63, 94] },
      { k: "pH Doser", v: actuators.phDoser, accent: [16, 185, 129] },
      { k: "Bio-Filter", v: actuators.bioFilter, accent: [139, 92, 246] },
    ];

    const ctrlPad = 6;
    const ctrlRowH = 12.5;
    const ctrlGapY = 4.2;

    const ctrlBoxH = (ctrlPad * 2) + (ctrlRowH + ctrlGapY) * 3 - ctrlGapY;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, cursorY, contentW2, ctrlBoxH, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentW2, ctrlBoxH, 6, 6, 'S');

    const cellGap = 7;
    const cellW = (contentW2 - ctrlPad * 2 - cellGap) / 2;
    const cellInnerY = cursorY + ctrlPad;

    ctrlItems.forEach((it, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);

      const x = margin + ctrlPad + col * (cellW + cellGap);
      const y = cellInnerY + row * (ctrlRowH + ctrlGapY);

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cellW, ctrlRowH, 4.5, 4.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cellW, ctrlRowH, 4.5, 4.5, 'S');

      doc.setFillColor(it.accent[0], it.accent[1], it.accent[2]);
      doc.circle(x + 6, y + ctrlRowH / 2, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.2);
      doc.setTextColor(51, 65, 85);
      doc.text(it.k, x + 9.5, y + ctrlRowH / 2 + 3.2);

      const btnTotalW = (14 * 3) + (1.6 * 2);
      const btnX = x + cellW - btnTotalW - 4.5;
      const btnY = y + (ctrlRowH - 6.8) / 2;
      drawModeButtons(doc, btnX, btnY, it.v, it.accent);
    });

    cursorY += ctrlBoxH + 8;
    drawDivider(doc, margin, cursorY, contentW2);
    cursorY += 8;

    // 3) Alerts Summary
    cursorY = drawSectionTitle(doc, "3) Alerts Summary", margin, cursorY, contentW2);

    doc.setFillColor(255, 241, 242);
    doc.roundedRect(margin, cursorY, contentW2, 46, 6, 6, 'F');
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, cursorY, contentW2, 46, 6, 6, 'S');

    const alertCount = alerts.length;
    const critCount = alerts.filter(a => a.type === 'critical').length;
    const warnCount = alerts.filter(a => a.type === 'warning').length;

    drawChip(doc, margin + contentW2 - 44, cursorY + 6, 40, 10, `${alertCount} NEW`, alertCount > 0 ? [239, 68, 68] : [16, 185, 129]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(159, 18, 57);
    doc.text(`Critical: ${critCount}`, margin + 6, cursorY + 14);
    doc.setTextColor(180, 83, 9);
    doc.text(`Warnings: ${warnCount}`, margin + 44, cursorY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);

    const alertLines = alerts.slice(0, 4).map(a => `• ${a.time} — ${a.title}: ${a.msg}`);
    let ay = cursorY + 24;

    if (alertLines.length === 0) {
      doc.text("No active alerts. System nominal.", margin + 6, ay);
    } else {
      alertLines.forEach((t) => {
        ay = drawWrappedText(doc, t, margin + 6, ay, contentW2 - 12, 5.0);
      });
      if (alerts.length > 4) {
        doc.setTextColor(100, 116, 139);
        doc.text(`(+${alerts.length - 4} more alerts in dashboard)`, margin + 6, cursorY + 42);
      }
    }

    // End of Page 2 (no Recommended Actions here anymore)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("AquaSmart — Intelligent IoT & ML Predictive Framework", pageW / 2, pageH - 8, { align: 'center' });

    // ---------- PAGE 3 (Recommended Actions STARTS HERE) ----------
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Recommended Actions (When Critical) — ${pondName}`, margin, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Report ID: ${reportId}`, pageW - margin, 11, { align: 'right' });

    const actionsAll = getRecommendedActions(latest);
    const pageBottomSafe = pageH - 18;

    const drawActionsBox = (startIndex, yStart) => {
      const innerPad = 6;
      const maxBoxH = Math.max(40, pageBottomSafe - yStart - 6);

      doc.setFillColor(240, 253, 250);
      doc.roundedRect(margin, yStart, contentW2, maxBoxH, 6, 6, 'F');
      doc.setDrawColor(153, 246, 228);
      doc.roundedRect(margin, yStart, contentW2, maxBoxH, 6, 6, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      let y = yStart + 10;
      let idx = startIndex;

      while (idx < actionsAll.length) {
        const line = `• ${actionsAll[idx]}`;
        const lines = doc.splitTextToSize(line, contentW2 - innerPad * 2);
        const needed = lines.length * 5.0;

        if (y + needed > yStart + maxBoxH - 8) break;

        doc.text(lines, margin + innerPad, y);
        y += needed;
        idx += 1;
      }

      return { nextIndex: idx };
    };

    if (actionsAll.length === 0) {
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(margin, 26, contentW2, 44, 6, 6, 'F');
      doc.setDrawColor(153, 246, 228);
      doc.roundedRect(margin, 26, contentW2, 44, 6, 6, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("No action guidance available (insufficient sensor data).", margin + 6, 40);
    } else {
      let start = 0;
      let yStart = 26;

      while (start < actionsAll.length) {
        const res = drawActionsBox(start, yStart);
        start = res.nextIndex;

        if (start < actionsAll.length) {
          // continue on new page
          doc.addPage();
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, pageW, 16, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text(`Recommended Actions — Continued`, margin, 11);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`Report ID: ${reportId}`, pageW - margin, 11, { align: 'right' });

          yStart = 26;
        }
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("AquaSmart — Intelligent IoT & ML Predictive Framework", pageW / 2, pageH - 8, { align: 'center' });

    // ---------- NEXT PAGE (REAL 6 CHARTS) ----------
    // ✅ Charts come AFTER Recommended Actions pages (so actions always begin on page 3)
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Sensor Charts (Real Data) — ${pondName}`, margin, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Report ID: ${reportId}`, pageW - margin, 11, { align: 'right' });

    const gridX = margin;
    const gridW = pageW - margin * 2;
    const cellW2 = (gridW - 6) / 2;
    const cellH2 = 58;
    let gridY = 24;

    const chartOrder = [
      { k: 'dissolvedOxygen', title: 'Dissolved Oxygen', unit: 'mg/L' },
      { k: 'ph', title: 'pH Level', unit: 'pH' },
      { k: 'temperature', title: 'Temperature', unit: '°C' },
      { k: 'turbidity', title: 'Turbidity', unit: 'NTU' },
      { k: 'ammonia', title: 'Ammonia (NH3)', unit: 'mg/L' },
      { k: 'salinity', title: 'Salinity', unit: 'ppt' },
    ];

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Based on latest samples (${Math.max(1, chartBaseData.length)} points). Forecast is dashed when enabled.`, margin, 20);

    chartOrder.forEach((it, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gridX + col * (cellW2 + 6);
      const y = gridY + row * (cellH2 + 8);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, cellW2, cellH2, 6, 6, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cellW2, cellH2, 6, 6, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${it.title} (${it.unit})`, x + 6, y + 10);

      const img = chartImgs[it.k];
      if (img) {
        addImageFit(doc, img, x + 4, y + 12, cellW2 - 8, cellH2 - 16);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Chart unavailable", x + 6, y + 28);
      }
    });

    // ✅ Page numbers (dynamic)
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      drawPageNumber(doc, pageW, pageH, p, totalPages);
    }

    doc.save(`AquaSmart_Report_${pondName.replace(/\s+/g, '_')}_${reportId}.pdf`);
  };

  // ✅ Data used for hidden PDF charts (real readings + optional forecast)
  const pdfChartData = (showForecast ? [...readings.slice(-15), ...forecastData] : readings).slice(-18);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {/* ✅ Hidden chart render area for PDF capture (NO UI CHANGE) */}
      <div
        ref={pdfChartsWrapRef}
        style={{
          position: 'absolute',
          left: -10000,
          top: 0,
          width: 560,
          padding: 12,
          background: '#ffffff',
          zIndex: -1
        }}
        aria-hidden="true"
      >
        <div className="space-y-3">
          <div ref={(el) => (pdfChartRefs.current.dissolvedOxygen = el)}>
            <PdfMetricChart
              title="Dissolved Oxygen"
              color={CHART_METRICS.dissolvedOxygen.color}
              data={pdfChartData}
              dataKey="dissolvedOxygen"
              yAxisId={CHART_METRICS.dissolvedOxygen.yAxisId}
            />
          </div>
          <div ref={(el) => (pdfChartRefs.current.ph = el)}>
            <PdfMetricChart
              title="pH Level"
              color={CHART_METRICS.ph.color}
              data={pdfChartData}
              dataKey="ph"
              yAxisId={CHART_METRICS.ph.yAxisId}
            />
          </div>
          <div ref={(el) => (pdfChartRefs.current.temperature = el)}>
            <PdfMetricChart
              title="Temperature"
              color={CHART_METRICS.temperature.color}
              data={pdfChartData}
              dataKey="temperature"
              yAxisId={CHART_METRICS.temperature.yAxisId}
            />
          </div>
          <div ref={(el) => (pdfChartRefs.current.turbidity = el)}>
            <PdfMetricChart
              title="Turbidity"
              color={CHART_METRICS.turbidity.color}
              data={pdfChartData}
              dataKey="turbidity"
              yAxisId={CHART_METRICS.turbidity.yAxisId}
            />
          </div>
          <div ref={(el) => (pdfChartRefs.current.ammonia = el)}>
            <PdfMetricChart
              title="Ammonia (NH3)"
              color={CHART_METRICS.ammonia.color}
              data={pdfChartData}
              dataKey="ammonia"
              yAxisId={CHART_METRICS.ammonia.yAxisId}
            />
          </div>
          <div ref={(el) => (pdfChartRefs.current.salinity = el)}>
            <PdfMetricChart
              title="Salinity"
              color={CHART_METRICS.salinity.color}
              data={pdfChartData}
              dataKey="salinity"
              yAxisId={CHART_METRICS.salinity.yAxisId}
            />
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col">
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} onLogout={onLogout} notifications={alerts} onClearNotification={dismissAlert} />
        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
          {/* --- TOP SECTION --- */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors duration-300">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard Overview</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5" /> Intelligent IoT & ML Predictive Framework
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700 text-sm">|</span>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 text-white border border-blue-400/20">
                  <div className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSystemActive ? 'bg-green-400' : 'bg-red-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isSystemActive ? 'bg-green-500' : 'bg-red-600'}`}></span>
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 fill-current ${isSystemActive ? 'animate-pulse' : 'opacity-50'}`} /> {isSystemActive ? 'System Active' : 'System Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl shadow-md transition-all hover:scale-105">
                  <Download className="w-4 h-4" /> Download Report
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg border border-emerald-400/30 bg-gradient-to-r from-emerald-500 to-teal-500 animate-[pulse_3s_ease-in-out_infinite]">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white uppercase tracking-wide text-shadow-sm">Risk Level: Low</span>
                </div>
              </div>
              <div className="relative w-full md:w-72">
                <select
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:border-blue-300"
                  value={selectedPond}
                  onChange={(e) => setSelectedPond(Number(e.target.value))}
                >
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
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Water Quality Trends</h3>
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
                    <button onClick={() => setChartMetric('all')} className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all border shadow-sm flex items-center gap-2 ${chartMetric === 'all' ? `bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 transform scale-105` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}><Maximize2 className="w-3 h-3" /> All Overview</button>
                    {Object.entries(CHART_METRICS).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setChartMetric(key)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border shadow-sm flex items-center gap-1.5 ${chartMetric === key ? `bg-white dark:bg-slate-800 text-slate-800 dark:text-white transform scale-105` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                        style={chartMetric === key ? { borderColor: config.color, color: config.color } : {}}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${chartMetric === key ? 'animate-pulse' : ''}`} style={{ backgroundColor: config.color }}></span>
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-6 h-[400px] w-full bg-white dark:bg-slate-800/50">
                  <ResponsiveContainer width="100%" height="100%" key={chartMetric}>
                    {chartMetric === 'all' ? (
                      <LineChart data={combinedChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                        <XAxis dataKey="time" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        {Object.entries(CHART_METRICS).map(([key, config]) => (
                          <Line key={key} type="monotone" yAxisId={config.yAxisId} dataKey={key} stroke={config.color} strokeWidth={2} dot={false} strokeDasharray={combinedChartData.some(d => d.isForecast) ? "5 5" : "0"} name={config.label} />
                        ))}
                      </LineChart>
                    ) : (
                      <AreaChart data={combinedChartData}>
                        <defs><linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={activeChartMetric.color} stopOpacity={0.3} /><stop offset="95%" stopColor={activeChartMetric.color} stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                        <XAxis dataKey="time" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId={activeChartMetric.yAxisId} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" yAxisId={activeChartMetric.yAxisId} dataKey={chartMetric} stroke={activeChartMetric.color} strokeWidth={3} strokeDasharray={combinedChartData.some(d => d.isForecast) ? "5 5" : "0"} fillOpacity={1} fill="url(#colorMetric)" name={activeChartMetric.label} />
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
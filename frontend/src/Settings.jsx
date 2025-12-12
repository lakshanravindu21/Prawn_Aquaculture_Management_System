import React, { useState } from 'react';
import { 
  Save, Bell, Sliders, Cpu, ShieldAlert, Mail, Smartphone, 
  Wind, Droplets, ThermometerSun, Activity, Skull, Waves, 
  CheckCircle2, RefreshCw, Download, FlaskConical, AlertTriangle,
  Plus, Minus, Zap
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// --- CONFIGURATION (Added absMin/absMax for the visual bar scaling) ---
const METRICS = {
  do: { label: 'Dissolved Oxygen', unit: 'mg/L', color: 'blue', icon: Wind, step: 0.1, absMin: 0, absMax: 20 },
  ph: { label: 'pH Level', unit: 'pH', color: 'emerald', icon: Droplets, step: 0.1, absMin: 0, absMax: 14 },
  temp: { label: 'Temperature', unit: '°C', color: 'orange', icon: ThermometerSun, step: 0.5, absMin: 0, absMax: 50 },
  turb: { label: 'Turbidity', unit: 'NTU', color: 'violet', icon: Activity, step: 1, absMin: 0, absMax: 100 },
  amm: { label: 'Ammonia', unit: 'mg/L', color: 'rose', icon: Skull, step: 0.01, absMin: 0, absMax: 1 },
  sal: { label: 'Salinity', unit: 'ppt', color: 'cyan', icon: Waves, step: 0.5, absMin: 0, absMax: 40 },
};

// --- HELPER: CUSTOM STEPPER ---
const NumberStepper = ({ value, onChange, step, color }) => {
  const btnStyles = {
    blue: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:border-blue-900 dark:text-blue-400',
    emerald: 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-slate-800 dark:border-emerald-900 dark:text-emerald-400',
    orange: 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50 dark:bg-slate-800 dark:border-orange-900 dark:text-orange-400',
    violet: 'bg-white text-violet-600 border-violet-200 hover:bg-violet-50 dark:bg-slate-800 dark:border-violet-900 dark:text-violet-400',
    rose: 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50 dark:bg-slate-800 dark:border-rose-900 dark:text-rose-400',
    cyan: 'bg-white text-cyan-600 border-cyan-200 hover:bg-cyan-50 dark:bg-slate-800 dark:border-cyan-900 dark:text-cyan-400',
  }[color];

  return (
    <div className="flex items-center shadow-sm">
      <button onClick={() => onChange(Math.max(0, parseFloat((value - step).toFixed(2))))} className={`p-2 rounded-l-lg border ${btnStyles} transition-colors active:scale-95`}>
        <Minus className="w-3 h-3" />
      </button>
      <div className="w-16 py-1.5 text-center border-t border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm text-slate-700 dark:text-slate-200">
        {value}
      </div>
      <button onClick={() => onChange(parseFloat((value + step).toFixed(2)))} className={`p-2 rounded-r-lg border ${btnStyles} transition-colors active:scale-95`}>
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};

// --- HELPER: TOGGLE SWITCH ---
const ToggleSwitch = ({ checked, onChange, colorClass }) => (
  <div onClick={() => onChange(!checked)} className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? colorClass : 'bg-slate-300 dark:bg-slate-600'}`}>
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
  </div>
);

// --- SUB-COMPONENT: THRESHOLD CARD ---
const ThresholdCard = ({ id, config, values, onChange }) => {
  // Stronger Backgrounds & Borders
  const theme = {
    blue: 'bg-blue-100 dark:bg-slate-800 border-blue-300 dark:border-blue-700',
    emerald: 'bg-emerald-100 dark:bg-slate-800 border-emerald-300 dark:border-emerald-700',
    orange: 'bg-orange-100 dark:bg-slate-800 border-orange-300 dark:border-orange-700',
    violet: 'bg-violet-100 dark:bg-slate-800 border-violet-300 dark:border-violet-700',
    rose: 'bg-rose-100 dark:bg-slate-800 border-rose-300 dark:border-rose-700',
    cyan: 'bg-cyan-100 dark:bg-slate-800 border-cyan-300 dark:border-cyan-700',
  }[config.color];

  const iconTheme = {
    blue: 'text-blue-700 bg-white dark:bg-slate-800',
    emerald: 'text-emerald-700 bg-white dark:bg-slate-800',
    orange: 'text-orange-700 bg-white dark:bg-slate-800',
    violet: 'text-violet-700 bg-white dark:bg-slate-800',
    rose: 'text-rose-700 bg-white dark:bg-slate-800',
    cyan: 'text-cyan-700 bg-white dark:bg-slate-800',
  }[config.color];

  const barColor = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    orange: 'bg-orange-600',
    violet: 'bg-violet-600',
    rose: 'bg-rose-600',
    cyan: 'bg-cyan-600',
  }[config.color];

  // Logic to calculate dynamic bar width and position
  const totalRange = config.absMax - config.absMin;
  const leftPercent = Math.max(0, Math.min(100, ((values.min - config.absMin) / totalRange) * 100));
  const rightPercent = Math.max(0, Math.min(100, 100 - ((values.max - config.absMin) / totalRange) * 100));

  return (
    <div className={`p-5 rounded-2xl border-2 ${theme} shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg shadow-sm border border-black/5 dark:border-white/10 ${iconTheme}`}>
            <config.icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wide">{config.label}</h4>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Trigger Alerts Outside Range</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Min</span>
          <NumberStepper value={values.min} step={config.step} color={config.color} onChange={(val) => onChange(id, 'min', val)} />
        </div>

        {/* Dynamic Range Bar */}
        <div className="flex-1 px-2 mt-4">
          <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <div 
              className={`absolute top-0 bottom-0 ${barColor} shadow-sm transition-all duration-300`}
              style={{ left: `${leftPercent}%`, right: `${rightPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Max</span>
          <NumberStepper value={values.max} step={config.step} color={config.color} onChange={(val) => onChange(id, 'max', val)} />
        </div>
      </div>
    </div>
  );
};

export default function Settings() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Initialize with some default values similar to your prompt
  const [thresholds, setThresholds] = useState({
    do: { min: 4.0, max: 10.0 },
    ph: { min: 7.6, max: 8.5 },
    temp: { min: 26.0, max: 32.0 },
    turb: { min: 12, max: 50 },
    amm: { min: 0.0, max: 0.05 },
    sal: { min: 23.5, max: 30.0 }, // Adjusted max to logical value, can be changed
  });

  const [automation, setAutomation] = useState({ aerator: true, pump: false });
  const [notifications, setNotifications] = useState({ emailCritical: true, smsCritical: true, emailWarning: false, smsWarning: true });

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const updateThreshold = (metric, field, value) => {
    setThresholds(prev => ({ ...prev, [metric]: { ...prev[metric], [field]: value } }));
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
        
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
          
          {/* --- PAGE HEADER --- */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700">
                  <Sliders className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Configuration</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
                    Define safety protocols, automation logic, and alert preferences.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase shadow-sm hover:bg-slate-50 transition-all">
                <Download className="w-4 h-4" /> Export Logs
              </button>
              <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg transition-all ${isSaving ? 'bg-emerald-500 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/30 active:scale-95'}`}>
                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- LEFT COLUMN: SAFETY THRESHOLDS --- */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* THRESHOLD GRID */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-500" />
                    Safety Thresholds
                  </h3>
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Simulation Mode</span>
                    <ToggleSwitch checked={isSimulating} onChange={setIsSimulating} colorClass="bg-indigo-600" />
                  </div>
                </div>

                {isSimulating && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-2 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <FlaskConical className="w-4 h-4" />
                    SIMULATION ACTIVE: Alerts will be logged but actuators won't trigger physically.
                  </div>
                )}

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(METRICS).map(([key, config]) => (
                    <ThresholdCard key={key} id={key} config={config} values={thresholds[key]} onChange={updateThreshold} />
                  ))}
                </div>
              </div>

              {/* AUTOMATION LOGIC */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-violet-500" />
                    Actuator Automation Logic
                  </h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Aerator Rule */}
                  <div className={`p-5 rounded-2xl border transition-all ${automation.aerator ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 text-indigo-600">
                        <Wind className="w-5 h-5" />
                      </div>
                      <ToggleSwitch checked={automation.aerator} onChange={(v) => setAutomation({...automation, aerator: v})} colorClass="bg-indigo-600" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Auto-Aeration Protocol</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                      Engage Aerators if <span className="font-bold text-indigo-600">DO &lt; {thresholds.do.min}</span> or <span className="font-bold text-indigo-600">Temp &gt; {thresholds.temp.max}</span>
                    </p>
                    {automation.aerator && (
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase bg-white dark:bg-slate-800 px-2 py-1 rounded w-fit border border-indigo-100 dark:border-indigo-900/50">
                        <Zap className="w-3 h-3 fill-current" /> System Active
                      </div>
                    )}
                  </div>

                  {/* Pump Rule */}
                  <div className={`p-5 rounded-2xl border transition-all ${automation.pump ? 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 text-rose-600">
                        <Skull className="w-5 h-5" />
                      </div>
                      <ToggleSwitch checked={automation.pump} onChange={(v) => setAutomation({...automation, pump: v})} colorClass="bg-rose-600" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Emergency Exchange</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                      Activate Pumps if <span className="font-bold text-rose-600">Ammonia &gt; {thresholds.amm.max}</span>
                    </p>
                    {automation.pump && (
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase bg-white dark:bg-slate-800 px-2 py-1 rounded w-fit border border-rose-100 dark:border-rose-900/50">
                        <Zap className="w-3 h-3 fill-current" /> System Active
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* --- RIGHT COLUMN: NOTIFICATIONS --- */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Alert Preferences
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* Critical Alerts - RED THEME */}
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
                    <h4 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> Critical Events
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><Mail className="w-4 h-4" /> Email Alerts</div>
                        <ToggleSwitch checked={notifications.emailCritical} onChange={() => setNotifications({...notifications, emailCritical: !notifications.emailCritical})} colorClass="bg-rose-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><Smartphone className="w-4 h-4" /> SMS / Push</div>
                        <ToggleSwitch checked={notifications.smsCritical} onChange={() => setNotifications({...notifications, smsCritical: !notifications.smsCritical})} colorClass="bg-rose-500" />
                      </div>
                    </div>
                  </div>

                  {/* Warning Alerts - AMBER THEME */}
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                    <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> Warnings & Advisories
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><Mail className="w-4 h-4" /> Email Alerts</div>
                        <ToggleSwitch checked={notifications.emailWarning} onChange={() => setNotifications({...notifications, emailWarning: !notifications.emailWarning})} colorClass="bg-amber-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><Smartphone className="w-4 h-4" /> SMS / Push</div>
                        <ToggleSwitch checked={notifications.smsWarning} onChange={() => setNotifications({...notifications, smsWarning: !notifications.smsWarning})} colorClass="bg-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Version</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">v2.4.0 (Research Build)</p>
                <div className="mt-4 flex justify-center gap-2 items-center">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">Cloud Sync Active</p>
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
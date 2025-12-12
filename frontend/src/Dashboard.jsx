import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Thermometer, Activity, Wind, AlertTriangle, Power } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

// --- SUB-COMPONENT: SENSOR CARD ---
const SensorCard = ({ title, value, unit, icon: Icon, color }) => (
  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg hover:border-slate-600 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {/* Simulation of status dot */}
      <span className="flex h-3 w-3 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <div className="flex items-baseline mt-1">
      <span className="text-3xl font-bold text-white">{value}</span>
      <span className="ml-1 text-slate-500 text-sm">{unit}</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [readings, setReadings] = useState([]);
  const [latest, setLatest] = useState(null);
  const [ponds, setPonds] = useState([]);
  const [selectedPond, setSelectedPond] = useState(1);

  // 1. Fetch Data on Load
  useEffect(() => {
    fetchPonds();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    fetchData(); // Initial call
    return () => clearInterval(interval);
  }, [selectedPond]);

  const fetchPonds = async () => {
    try {
      const res = await axios.get(`${API_URL}/ponds`);
      if (res.data.length > 0) setPonds(res.data);
    } catch (err) { console.error("Error fetching ponds", err); }
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/readings/${selectedPond}`);
      // Reverse to show oldest to newest on chart
      const data = res.data.reverse(); 
      setReadings(data);
      if (data.length > 0) setLatest(data[data.length - 1]);
    } catch (err) { console.error("Error fetching readings", err); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Prawn Aquaculture Monitor
          </h1>
          <p className="text-slate-400 mt-1">Real-time IoT & AI Analysis System</p>
        </div>
        
        <select 
          className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedPond}
          onChange={(e) => setSelectedPond(e.target.value)}
        >
          {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          {ponds.length === 0 && <option value="1">Research Pond 01</option>}
        </select>
      </div>

      {/* SENSOR GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorCard 
          title="Dissolved Oxygen" 
          value={latest?.dissolvedOxygen || "--"} 
          unit="mg/L" 
          icon={Wind} 
          color="bg-blue-500" 
        />
        <SensorCard 
          title="pH Level" 
          value={latest?.ph || "--"} 
          unit="pH" 
          icon={Droplets} 
          color="bg-emerald-500" 
        />
        <SensorCard 
          title="Temperature" 
          value={latest?.temperature || "--"} 
          unit="°C" 
          icon={Thermometer} 
          color="bg-orange-500" 
        />
        <SensorCard 
          title="Turbidity" 
          value={latest?.turbidity || "--"} 
          unit="NTU" 
          icon={Activity} 
          color="bg-purple-500" 
        />
      </div>

      {/* MAIN CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Water Quality Trends (DO & pH)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{fill: '#94a3b8'}} 
                  tickFormatter={(str) => new Date(str).toLocaleTimeString()} 
                />
                <YAxis tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff'}}
                />
                <Line type="monotone" dataKey="dissolvedOxygen" stroke="#3b82f6" strokeWidth={3} dot={false} name="DO (mg/L)" />
                <Line type="monotone" dataKey="ph" stroke="#10b981" strokeWidth={3} dot={false} name="pH" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACTUATORS / ALERTS SIDEBAR */}
        <div className="space-y-6">
          
          {/* CONTROL PANEL */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Power className="w-5 h-5 text-red-400" /> Control Panel
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                <span className="text-slate-300">Main Aerator</span>
                <button className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors">
                  Turn ON
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                <span className="text-slate-300">Water Pump</span>
                <button className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-sm font-medium transition-colors">
                  OFF
                </button>
              </div>
            </div>
          </div>

          {/* ALERTS */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" /> Recent Alerts
            </h2>
            <div className="space-y-3">
              {/* Fake alerts for demo */}
              <div className="p-3 bg-red-900/30 border border-red-900/50 rounded-lg text-sm text-red-200">
                ⚠️ Critical: DO level dropped below 4.0 mg/L
              </div>
              <div className="p-3 bg-yellow-900/30 border border-yellow-900/50 rounded-lg text-sm text-yellow-200">
                ⚡ Warning: High Turbidity detected
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { 
  Upload, Camera, CheckCircle2, AlertTriangle, X, Activity, 
  ChevronRight, Stethoscope, Microscope, Scan, FileImage, ShieldCheck,
  Zap, ArrowUpRight, RefreshCw, Video, History, Clock, FileText, Info, 
  Download, FileBarChart, BookOpen, XCircle, HelpCircle
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// --- 🔔 TOAST NOTIFICATION COMPONENT ---
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-300 border-l-8 backdrop-blur-md
    ${type === 'error' ? 'bg-white/95 border-rose-500 text-slate-800' : 'bg-white/95 border-emerald-500 text-slate-800'}
  `}>
    <div className={`p-2 rounded-full ${type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
      {type === 'error' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
    </div>
    <div>
      <h4 className="font-bold text-sm uppercase tracking-wide text-slate-900">{type === 'error' ? 'Attention' : 'Success'}</h4>
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
    <button onClick={onClose} className="ml-4 p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
  </div>
);

// --- 📘 USER MANUAL MODAL ---
const UserManualModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 flex justify-between items-center">
          <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
            <BookOpen className="w-8 h-8" /> Diagnostic Reports Guide
          </h2>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="flex gap-6 items-start">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl h-fit shadow-sm">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">1. Diagnostic Scan Report</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Generates a detailed PDF for the <strong>single specimen</strong> currently being viewed. It includes the analyzed image, specific disease classification (e.g., White Spot), confidence score, and AI-driven treatment recommendations.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl h-fit shadow-sm">
              <FileBarChart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">2. Population Health Summary</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Analyzes <strong>all scans in this session</strong> to calculate infection rates. Use this to determine if the entire pond needs quarantine or treatment.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 text-center border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg">
            Got it, Thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Health({ user, onLogout, isDarkMode, toggleTheme }) {
  // --- STATE ---
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [systemStatus, setSystemStatus] = useState('checking'); 
  const [inputMode, setInputMode] = useState('upload'); 
  const [history, setHistory] = useState([]); 
  
  // UX State
  const [showManual, setShowManual] = useState(false);
  const [toast, setToast] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const imgRef = useRef(null); 

  // ✅ LocalStorage keys
  const HISTORY_KEY = "aqua_health_history_v1";
  const POND_KEY = "aqua_selected_pond_id_v1"; // optional (if you store pond id elsewhere)

  // ✅ Backend session log API
  const API_BASE = "http://localhost:3001";
  const DEVICE_KEY = "aqua_device_id_v1";

  // Helpers
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ✅ Try get pond id from localStorage (best practical way without breaking existing logic)
  const getPondId = () => {
    const raw = localStorage.getItem(POND_KEY);
    const id = parseInt(raw || "1", 10);
    return Number.isFinite(id) ? id : 1;
  };

  // ✅ Device id (so backend can separate sessions per device even without login)
  const getDeviceId = () => {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  };

  // ✅ Auth headers (keeps optional JWT logic; does not break if missing)
  const getAuthHeaders = () => {
    const token = user?.token || localStorage.getItem("token") || localStorage.getItem("authToken");
    const headers = { "x-device-id": getDeviceId() };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  // ✅ Load history on mount (fix refresh clearing) - LocalStorage (existing)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (e) {}
  }, []);

  // ✅ Load history from backend too (does NOT remove localStorage logic)
  useEffect(() => {
    const loadServerHistory = async () => {
      try {
        const pondId = getPondId();
        const res = await axios.get(`${API_BASE}/api/health-session`, {
          params: { pondId, limit: 10 },
          headers: getAuthHeaders()
        });

        const serverLogs = res?.data?.logs;
        if (Array.isArray(serverLogs) && serverLogs.length > 0) {
          // Keep same shape you already use in UI
          setHistory(serverLogs);
        }
      } catch (e) {
        // Silent fail (no UX disruption). LocalStorage still works.
      }
    };
    loadServerHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Save history whenever it changes - LocalStorage (existing)
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  // 1. System Health Check
  useEffect(() => {
    const checkSystem = async () => {
      try {
        await axios.get('http://localhost:5000/'); // Pointing to your Flask port 5000
        setSystemStatus('online');
      } catch (e) {
        setSystemStatus('offline');
        showToast("AI Service Offline. Check backend.", "error");
      }
    };
    checkSystem();
    const interval = setInterval(checkSystem, 30000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { return () => stopCamera(); }, []);

  // --- UPDATED BEHAVIOR MAPPING ---
  const getBehaviorAnalysis = (condition) => {
    if (condition === 'White Spot Syndrome') return ["Lethargy", "Swimming near surface", "White spots on carapace"];
    if (condition === 'Black Gill Disease') return ["Respiratory distress", "Loss of appetite", "Blackened gill filaments"];
    if (condition === 'BG & WSSV Coinfection') return ["Extreme lethargy", "Severe gill fouling", "Mass mortality signs"];
    return ["Normal activity", "Responsive to stimuli", "Clear shell"];
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      setInputMode('camera');
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      showToast("Webcam access denied. Check permissions.", "error");
      setInputMode('upload');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        stopCamera();
        setInputMode('preview');
        showToast("Image captured successfully.", "success");
      }, 'image/jpeg');
    }
  };

  const cancelCamera = () => {
    stopCamera();
    setInputMode('upload');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setInputMode('preview');
    }
  };

  const handleScan = async () => {
    if (!selectedImage) {
      showToast("Please upload or capture an image first.", "error");
      return;
    }
    setAnalyzing(true);

    // ✅ Faster UX (reduced artificial delay)
    await new Promise(resolve => setTimeout(resolve, 250));

    const formData = new FormData();
    formData.append('prawnImage', selectedImage);

    try {
      // Aligned with the Flask /api/analyze-health route on port 5000
      const res = await axios.post('http://localhost:5000/api/analyze-health', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newResult = res.data;
      const behaviors = getBehaviorAnalysis(newResult.condition);
      const fullResult = { ...newResult, behaviors }; 
      setResult(fullResult);

      // ✅ Build the exact history item you already use
      const historyItem = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        date: new Date().toLocaleDateString(),
        researcher: user?.name || "Researcher",
        pondId: getPondId(),
        ...fullResult,
        img: previewUrl
      };

      setHistory(prev => [historyItem, ...prev].slice(0, 10));

      // ✅ ALSO persist to backend (so refresh always reloads same session)
      // (Does not affect your current localStorage logic)
      try {
        await axios.post(`${API_BASE}/api/health-session`, {
          pondId: historyItem.pondId,
          researcher: historyItem.researcher,
          condition: historyItem.condition,
          status: historyItem.status,
          confidence: historyItem.confidence,
          advice: historyItem.advice,
          behaviors: historyItem.behaviors,
          img: historyItem.img
        }, {
          headers: getAuthHeaders()
        });
      } catch (e) {
        // Silent fail -> localStorage still keeps it
      }

      showToast("Analysis Complete. Report ready.", "success");

    } catch (error) {
      showToast("AI Analysis failed. Check server.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAll = () => {
    setPreviewUrl(null);
    setSelectedImage(null);
    setResult(null);
    setInputMode('upload');
  };

  const loadFromHistory = (item) => {
    setPreviewUrl(item.img);
    setResult({
      condition: item.condition,
      status: item.status,
      confidence: item.confidence,
      advice: item.advice,
      behaviors: item.behaviors
    });
    setInputMode('preview');
    showToast("Loaded scan from history.", "success");
  };

  // ✅ Report helpers (NO change to your AI logic; only formatting)
  const makeReportId = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `AS-${ts}-${rnd}`;
  };

  const getRiskProfile = (condition, confidence, status) => {
    const conf = Number(confidence || 0);

    if (condition === 'Analysis Inconclusive') {
      return { level: "UNCERTAIN", severity: "Review Required", note: "Low confidence output. Rescan recommended." };
    }

    if (status === 'healthy') {
      if (conf >= 90) return { level: "LOW", severity: "Stable", note: "No critical indicators detected." };
      return { level: "LOW", severity: "Monitor", note: "Likely healthy, but keep observation." };
    }

    // unhealthy
    if (condition === 'BG & WSSV Coinfection') return { level: "CRITICAL", severity: "Emergency", note: "High mortality risk. Immediate response required." };
    if (condition === 'White Spot Syndrome') return conf >= 85 ? { level: "CRITICAL", severity: "High", note: "Highly contagious. Quarantine recommended." } : { level: "HIGH", severity: "High", note: "Suspicious WSSV markers. Confirm and isolate." };
    if (condition === 'Black Gill Disease') return conf >= 85 ? { level: "HIGH", severity: "Moderate-High", note: "Respiratory stress likely. Improve aeration & soil." } : { level: "MODERATE", severity: "Moderate", note: "Possible gill pathology. Improve conditions & rescan." };

    // fallback
    return conf >= 85 ? { level: "HIGH", severity: "High", note: "Unhealthy markers detected." } : { level: "MODERATE", severity: "Moderate", note: "Uncertain unhealthy. Rescan recommended." };
  };

  // ---------- 🔥 NEXT LEVEL PDF THEME HELPERS ----------
  const drawWatermark = (doc, pageWidth, pageHeight, text = "AquaSmart") => {
    // Lightweight watermark (safe on all jsPDF builds)
    doc.saveGraphicsState?.();
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(58);
    try {
      if (doc.GState) {
        doc.setGState(new doc.GState({ opacity: 0.12 }));
      }
    } catch (e) {}
    doc.text(text, pageWidth / 2, pageHeight / 2, { align: "center", angle: 35 });
    doc.restoreGraphicsState?.();
  };

  const drawTopGradient = (doc, pageWidth) => {
    // layered bands to simulate gradient
    doc.setFillColor(14, 165, 233);  // sky/cyan
    doc.rect(0, 0, pageWidth, 14, 'F');
    doc.setFillColor(16, 185, 129);  // emerald
    doc.rect(0, 14, pageWidth, 10, 'F');
    doc.setFillColor(245, 158, 11);  // amber
    doc.rect(0, 24, pageWidth, 8, 'F');
  };

  const drawGlassCard = (doc, x, y, w, h) => {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 7, 7, 'FD');
  };

  const drawFooter = (doc, pageWidth, pageHeight, leftText, rightText, pageNo, totalPages) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(leftText, 14, pageHeight - 11);
    doc.text(rightText, pageWidth - 14, pageHeight - 11, { align: "right" });

    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${pageNo} / ${totalPages}`, pageWidth / 2, pageHeight - 11, { align: "center" });
  };

  const drawHeaderBrand = (doc, pageWidth, title, subtitle, metaRight) => {
    drawTopGradient(doc, pageWidth);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("AquaSmart", 14, 10);
    doc.setFontSize(9);
    doc.text("Research Group 16 • AI Diagnostic Engine", 14, 18);

    doc.setFontSize(14);
    doc.text(title, 14, 32);
    doc.setFontSize(9);
    doc.text(subtitle, 14, 38);

    doc.setFontSize(9);
    doc.text(metaRight, pageWidth - 14, 14, { align: "right" });

    doc.setDrawColor(220);
    doc.line(14, 44, pageWidth - 14, 44);
  };

  const drawKeyValue = (doc, x, y, k, v) => {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(`${k}`, x, y);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(`${v}`, x + 42, y);
  };

  const drawBadge = (doc, x, y, text, type) => {
    if (type === "ok") doc.setFillColor(16, 185, 129);
    else if (type === "warn") doc.setFillColor(245, 158, 11);
    else if (type === "danger") doc.setFillColor(244, 63, 94);
    else doc.setFillColor(100, 116, 139);

    const width = Math.max(46, Math.min(74, text.length * 4.3));
    doc.roundedRect(x, y - 7, width, 11, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(text, x + width / 2, y + 1, { align: "center" });
  };

  const drawConfidenceBar = (doc, x, y, w, valuePct) => {
    const v = Math.max(0, Math.min(100, Number(valuePct || 0)));
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, w, 8, 2, 2, 'FD');

    if (v >= 85) doc.setFillColor(16, 185, 129);
    else if (v >= 60) doc.setFillColor(245, 158, 11);
    else doc.setFillColor(244, 63, 94);

    const fillW = (w * v) / 100;
    doc.roundedRect(x, y, Math.max(0.5, fillW), 8, 2, 2, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(`${v.toFixed(2)}%`, x + w + 6, y + 7);
  };

  const safeAddImage = (doc, imgEl, type, x, y, w, h) => {
    try {
      if (imgEl) doc.addImage(imgEl, type, x, y, w, h);
    } catch (e) {}
  };

  const buildDetailedPlan = (condition) => {
    // Pure content mapping (does not change your AI logic)
    if (condition === "White Spot Syndrome") {
      return {
        title: "WSSV Response Plan",
        bullets: [
          "Immediate isolation: avoid moving infected stock between ponds.",
          "Reduce stress: stabilize temperature, pH, salinity; avoid sudden water exchange.",
          "Increase monitoring: scan 3–5 random specimens every 2–4 hours.",
          "Biosecurity: disinfect tools, nets; restrict visitors; foot-bath entry recommended."
        ],
        checklist: [
          "Quarantine / isolate",
          "Aeration increased",
          "Water parameters stabilized",
          "Rescan performed",
          "Supervisor notified"
        ]
      };
    }
    if (condition === "Black Gill Disease") {
      return {
        title: "Black Gill Mitigation Plan",
        bullets: [
          "Improve aeration: raise dissolved oxygen and reduce organic load.",
          "Check sludge/soil: remove excessive waste; consider bottom cleaning schedule.",
          "Reduce suspended solids: improve filtration/settling, avoid overfeeding.",
          "Rescan at different angle: focus gill region under better lighting."
        ],
        checklist: [
          "Aeration optimized",
          "Feeding reduced (temporary)",
          "Solids reduced",
          "Bottom checked",
          "Rescan performed"
        ]
      };
    }
    if (condition === "BG & WSSV Coinfection") {
      return {
        title: "Critical Coinfection Protocol",
        bullets: [
          "Emergency response: isolate immediately; high mortality risk.",
          "Maximize oxygen: 24/7 aeration; monitor DO closely.",
          "Minimize handling: avoid transport; reduce any additional stress.",
          "Consider lab confirmation: PCR/rapid methods if available."
        ],
        checklist: [
          "Quarantine activated",
          "Emergency aeration",
          "Strict access control",
          "Rescan multiple specimens",
          "Lab confirmation requested"
        ]
      };
    }
    return {
      title: "Healthy Monitoring Plan",
      bullets: [
        "Maintain stable water parameters and routine feeding schedule.",
        "Scan 1–2 specimens daily as preventive monitoring.",
        "Keep consistent lighting for comparable images over time.",
        "Log anomalies early to prevent outbreak spread."
      ],
      checklist: [
        "Routine scan logged",
        "Parameters stable",
        "No abnormal behavior",
        "Daily check completed",
        "Next scan scheduled"
      ]
    };
  };

  // --- REPORT GENERATORS ---
  const generateSingleReport = () => {
    if (!result) {
      showToast("No active scan found. Please scan an image first.", "error");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const pondId = getPondId();
    const researcherName = user?.name || "Researcher";
    const reportId = makeReportId();
    const now = new Date();
    const metaRight = `Report ID: ${reportId}\n${now.toLocaleString()}`;

    const risk = getRiskProfile(result.condition, result.confidence, result.status);
    const riskType =
      risk.level === "LOW" ? "ok" :
      risk.level === "MODERATE" ? "warn" :
      risk.level === "UNCERTAIN" ? "warn" : "danger";

    const totalPages = 2;

    // Layout constants (for perfect alignments)
    const M = 14;
    const GAP = 4;

    // ---------------- Page 1 (Structured Summary) ----------------
    drawHeaderBrand(doc, pageWidth, "Visual Disease Diagnostic Report", "Neural image classification • Action recommendations", metaRight);
    drawWatermark(doc, pageWidth, pageHeight, "AquaSmart");

    // Summary strip
    drawGlassCard(doc, M, 52, pageWidth - 2 * M, 30);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("Specimen Snapshot", M + 4, 62);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text("Structured report with aligned sections for fast review and audit.", M + 4, 69);

    drawBadge(doc, pageWidth - M - 64, 62, risk.level, riskType);

    // Meta grid card
    drawGlassCard(doc, M, 88, pageWidth - 2 * M, 32);

    const leftX = M + 4;
    const rightX = pageWidth / 2 + 6;

    drawKeyValue(doc, leftX, 100, "Researcher", researcherName);
    drawKeyValue(doc, leftX, 108, "Pond ID", String(pondId));
    drawKeyValue(doc, leftX, 116, "Capture", inputMode === 'camera' ? "Webcam" : "Upload");

    drawKeyValue(doc, rightX, 100, "Model", "MobileNetV2 (CNN)");
    drawKeyValue(doc, rightX, 108, "Task", "BG / Healthy / WSSV / WSSV_BG");
    drawKeyValue(doc, rightX, 116, "Engine", "AquaSmart v1.0");

    // Two-column: Evidence + Diagnosis (same height)
    const blockY = 126;
    const blockH = 74;
    const colW = (pageWidth - 2 * M - GAP) / 2;

    // Evidence
    drawGlassCard(doc, M, blockY, colW, blockH);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Visual Evidence", M + 4, blockY + 10);

    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(M + 4, blockY + 14, colW - 8, blockH - 20, 6, 6, 'S');
    safeAddImage(doc, imgRef.current, 'JPEG', M + 5, blockY + 15, colW - 10, blockH - 22);

    // Diagnosis
    drawGlassCard(doc, M + colW + GAP, blockY, colW, blockH);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Diagnosis Panel", M + colW + GAP + 4, blockY + 10);

    const isHealthy = result.status === "healthy";
    const statusBadge = isHealthy ? "HEALTHY" : (result.condition === "Analysis Inconclusive" ? "INCONCLUSIVE" : "INFECTION");
    drawBadge(doc, M + colW + GAP + colW - 58, blockY + 10, statusBadge, isHealthy ? "ok" : (statusBadge === "INCONCLUSIVE" ? "warn" : "danger"));

    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(result.condition || "Unknown", M + colW + GAP + 4, blockY + 25);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Confidence", M + colW + GAP + 4, blockY + 36);
    drawConfidenceBar(doc, M + colW + GAP + 4, blockY + 39, colW - 30, result.confidence);

    doc.setTextColor(71, 85, 105);
    doc.text("Severity", M + colW + GAP + 4, blockY + 56);
    drawBadge(doc, M + colW + GAP + 28, blockY + 56, risk.severity, riskType);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(risk.note, colW - 8);
    doc.text(noteLines.slice(0, 2), M + colW + GAP + 4, blockY + 70);

    // Bottom two cards: Symptoms + Recommendation (same height)
    const bottomY = 206;
    const bottomH = 66;

    drawGlassCard(doc, M, bottomY, colW, bottomH);
    drawGlassCard(doc, M + colW + GAP, bottomY, colW, bottomH);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Observed Symptom Pattern", M + 4, bottomY + 12);

    const symptoms = (result.behaviors && result.behaviors.length > 0) ? result.behaviors : ["Not provided"];
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    let sy = bottomY + 22;
    symptoms.slice(0, 6).forEach((s) => {
      doc.text(`• ${s}`, M + 4, sy);
      sy += 6;
    });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("AI Recommendation Summary", M + colW + GAP + 4, bottomY + 12);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    const adviceText = result.advice || "No advisory text returned by AI.";
    const adviceLines = doc.splitTextToSize(adviceText, colW - 8);
    doc.text(adviceLines.slice(0, 10), M + colW + GAP + 4, bottomY + 22);

    drawFooter(
      doc,
      pageWidth,
      pageHeight,
      "AquaSmart • Disease Control Center • Research assistance only",
      `Signed: ${researcherName}`,
      1,
      totalPages
    );

    // ---------------- Page 2 (Detailed Action Plan) ----------------
    doc.addPage();
    drawHeaderBrand(doc, pageWidth, "Detailed Action Plan", "Operational checklist • Biosecurity notes • Monitoring guide", metaRight);
    drawWatermark(doc, pageWidth, pageHeight, "AquaSmart");

    const plan = buildDetailedPlan(result.condition);

    // Plan card
    drawGlassCard(doc, M, 52, pageWidth - 2 * M, 50);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text(plan.title, M + 4, 64);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    let py = 74;
    plan.bullets.forEach((b) => {
      const lines = doc.splitTextToSize(`• ${b}`, pageWidth - 2 * M - 12);
      doc.text(lines, M + 4, py);
      py += lines.length * 5 + 1;
    });

    // Checklist + Notes (aligned columns)
    const col2Y = 110;
    const col2H = 120;

    drawGlassCard(doc, M, col2Y, colW, col2H);
    drawGlassCard(doc, M + colW + GAP, col2Y, colW, col2H);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("Checklist (Mark during operations)", M + 4, col2Y + 14);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    let cy = col2Y + 26;
    plan.checklist.slice(0, 10).forEach((c) => {
      doc.setDrawColor(148, 163, 184);
      doc.rect(M + 4, cy - 4, 4, 4, 'S');
      doc.text(c, M + 12, cy);
      cy += 8;
    });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("Monitoring Notes", M + colW + GAP + 4, col2Y + 14);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    const notes = [
      "• Use consistent lighting and focus on carapace + gill region for best accuracy.",
      "• For low confidence outputs: rescan with better focus and reduced glare.",
      "• Keep specimen handling minimal to avoid stress-related artifacts.",
      "• If infection suspected: restrict movement between ponds and disinfect tools."
    ];
    let ny = col2Y + 26;
    notes.forEach((n) => {
      const lines = doc.splitTextToSize(n, colW - 8);
      doc.text(lines, M + colW + GAP + 4, ny);
      ny += lines.length * 5 + 2;
    });

    drawFooter(
      doc,
      pageWidth,
      pageHeight,
      "AquaSmart • Detailed Plan • Generated for research assistance",
      `Report: ${reportId}`,
      2,
      totalPages
    );

    doc.save(`AquaSmart_Diagnostic_${reportId}.pdf`);
    showToast("Next-Level Diagnostic Report Downloaded", "success");
  };

  const generateSummaryReport = () => {
    if (history.length === 0) {
      showToast("Session history is empty. Perform scans first.", "error");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const pondId = getPondId();
    const researcherName = user?.name || "Researcher";
    const reportId = makeReportId();
    const now = new Date();
    const metaRight = `Report ID: ${reportId}\n${now.toLocaleString()}`;

    const totalPages = 2;

    // compute stats
    const total = history.length;
    const healthyCount = history.filter(h => h.status === "healthy").length;
    const infectedCount = total - healthyCount;

    const avgConf = total > 0
      ? (history.reduce((acc, h) => acc + (Number(h.confidence || 0)), 0) / total)
      : 0;

    const byCondition = history.reduce((acc, h) => {
      const k = h.condition || "Unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(byCondition).sort((a,b) => b[1] - a[1]);
    const dominant = sorted.length ? `${sorted[0][0]} (${sorted[0][1]})` : "N/A";

    const infectionRate = total > 0 ? (infectedCount / total) * 100 : 0;

    // ---------------- Page 1 (Premium Summary) ----------------
    drawHeaderBrand(doc, pageWidth, "Population Health Summary", "Session epidemiology • Outbreak screening overview", metaRight);
    drawWatermark(doc, pageWidth, pageHeight, "AquaSmart");

    const M = 14;
    const GAP = 4;
    const colW = (pageWidth - 2 * M - GAP) / 2;

    drawGlassCard(doc, M, 52, pageWidth - 2 * M, 34);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("Session Overview", M + 4, 64);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text("Aggregated session view to estimate outbreak risk and dominant findings.", M + 4, 71);

    drawGlassCard(doc, M, 92, pageWidth - 2 * M, 38);
    drawKeyValue(doc, M + 4, 104, "Researcher", researcherName);
    drawKeyValue(doc, M + 4, 112, "Pond ID", String(pondId));
    drawKeyValue(doc, M + 4, 120, "Total Scans", String(total));

    drawKeyValue(doc, pageWidth / 2 + 6, 104, "Healthy", String(healthyCount));
    drawKeyValue(doc, pageWidth / 2 + 6, 112, "Infected", String(infectedCount));
    drawKeyValue(doc, pageWidth / 2 + 6, 120, "Avg Confidence", `${avgConf.toFixed(2)}%`);

    // Infection rate (big aligned bar)
    drawGlassCard(doc, M, 136, pageWidth - 2 * M, 34);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Infection Rate", M + 4, 148);
    drawConfidenceBar(doc, M + 4, 154, 128, infectionRate);

    // Condition distribution
    drawGlassCard(doc, M, 176, pageWidth - 2 * M, 74);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Condition Distribution", M + 4, 188);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text(`Dominant Finding: ${dominant}`, M + 4, 196);

    let y = 206;
    sorted.slice(0, 6).forEach(([cond, cnt]) => {
      const pct = (cnt / total) * 100;

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text(`${cond}`, M + 4, y);

      // bar bg
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(M + 58, y - 4, pageWidth - (M + 58) - M - 18, 6, 2, 2, 'F');

      // bar fill (red for infected types)
      if ((cond || "").toLowerCase().includes("healthy")) doc.setFillColor(16, 185, 129);
      else if (cond === "Analysis Inconclusive") doc.setFillColor(245, 158, 11);
      else doc.setFillColor(244, 63, 94);

      const barW = pageWidth - (M + 58) - M - 18;
      doc.roundedRect(M + 58, y - 4, (barW * pct) / 100, 6, 2, 2, 'F');

      doc.setTextColor(71, 85, 105);
      doc.text(`${cnt} (${pct.toFixed(1)}%)`, pageWidth - M - 4, y, { align: "right" });

      y += 10;
    });

    // Pond-level guidance
    drawGlassCard(doc, M, 256, pageWidth - 2 * M, 26);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);

    const pondAdvice =
      infectionRate >= 60
        ? "High infection rate detected. Quarantine recommended. Increase aeration & notify supervisor."
        : infectionRate >= 30
        ? "Moderate infection signals. Increase monitoring frequency and rescan multiple specimens."
        : "Low infection signals. Continue routine monitoring and rescan if behavior changes.";

    const adviceLines = doc.splitTextToSize(`Recommended: ${pondAdvice}`, pageWidth - 2 * M - 8);
    doc.text(adviceLines.slice(0, 2), M + 4, 268);

    drawFooter(
      doc,
      pageWidth,
      pageHeight,
      "AquaSmart • Population Summary • Research assistance",
      `Signed: ${researcherName}`,
      1,
      totalPages
    );

    // ---------------- Page 2 (Session Table) ----------------
    doc.addPage();
    drawHeaderBrand(doc, pageWidth, "Session Scan Table", "Chronological list for auditing & review", metaRight);
    drawWatermark(doc, pageWidth, pageHeight, "AquaSmart");

    drawGlassCard(doc, M, 52, pageWidth - 2 * M, 18);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Scan Records (latest first)", M + 4, 64);

    // Table header
    drawGlassCard(doc, M, 76, pageWidth - 2 * M, 12);
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text("Time", M + 4, 84);
    doc.text("Condition", M + 36, 84);
    doc.text("Status", M + 126, 84);
    doc.text("Conf.", pageWidth - M - 4, 84, { align: "right" });

    let ty = 96;
    const rows = history.slice(0, 12);
    rows.forEach((h) => {
      if (ty > pageHeight - 28) return;

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(M, ty - 8, pageWidth - 2 * M, 12, 4, 4, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text(`${h.time || "-"}`, M + 4, ty);

      const cond = (h.condition || "Unknown");
      const condLines = doc.splitTextToSize(cond, 84);
      doc.text(condLines[0], M + 36, ty);

      const st = (h.status || "-").toString().toUpperCase();
      doc.setTextColor(st === "HEALTHY" ? 16 : 244, st === "HEALTHY" ? 185 : 63, st === "HEALTHY" ? 129 : 94);
      doc.text(st, M + 126, ty);

      doc.setTextColor(15, 23, 42);
      doc.text(`${Number(h.confidence || 0).toFixed(1)}%`, pageWidth - M - 4, ty, { align: "right" });

      ty += 14;
    });

    drawFooter(
      doc,
      pageWidth,
      pageHeight,
      "AquaSmart • Session Table • For review and auditing",
      `Report: ${reportId}`,
      2,
      totalPages
    );

    doc.save(`AquaSmart_Population_Summary_${reportId}.pdf`);
    showToast("Next-Level Population Summary Downloaded", "success");
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
        
        {/* TOAST & MODAL */}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <UserManualModal isOpen={showManual} onClose={() => setShowManual(false)} />

        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} onLogout={onLogout} />

        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
          
          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/20 text-white transform hover:rotate-3 transition-transform duration-300">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Disease Control Center</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">Visual Pathology & Population Health</span>
                  <button onClick={() => setShowManual(true)} className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg transition-colors border border-amber-100 dark:border-amber-800">
                    <BookOpen className="w-3.5 h-3.5" /> User Manual
                  </button>
                </div>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-sm transition-all shadow-sm
              ${systemStatus === 'online' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-rose-50/80 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'}
            `}>
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${systemStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${systemStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">
                AI Service: {systemStatus === 'checking' ? 'Connecting...' : systemStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: SCANNER (2/3 Width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative group h-[600px] rounded-[32px] overflow-hidden border-4 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 shadow-xl transition-all hover:border-amber-400 dark:hover:border-amber-700">
                {inputMode === 'camera' && (
                  <div className="w-full h-full relative bg-black">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 pointer-events-none border-[20px] border-black/30">
                        <div className="absolute top-4 left-4 text-white/50 text-xs font-mono">REC ● LIVE</div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/30 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/50 rounded-full"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 pointer-events-auto">
                      <button onClick={cancelCamera} className="p-3 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-md"><X className="w-6 h-6" /></button>
                      <button onClick={capturePhoto} className="p-1 rounded-full border-4 border-white/30 hover:border-white transition-all scale-100 hover:scale-110 active:scale-95"><div className="w-16 h-16 rounded-full bg-white"></div></button>
                    </div>
                  </div>
                )}
                {(inputMode === 'upload' || inputMode === 'preview') && (
                  <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer relative" onClick={() => !previewUrl && fileInputRef.current.click()}>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    {previewUrl ? (
                      <>
                        <img ref={imgRef} src={previewUrl} alt="Report Source" className="hidden" />
                        <img src={previewUrl} alt="Scan Target" className="w-full h-full object-contain p-6 z-10" />
                        {analyzing && <div className="absolute inset-0 z-20"><div className="w-full h-1 bg-amber-500 shadow-[0_0_30px_#f59e0b] animate-scan absolute top-0"></div></div>}
                        <button onClick={(e) => { e.stopPropagation(); resetAll(); }} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-all z-30 shadow-sm"><RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
                      </>
                    ) : (
                      <div className="text-center p-8">
                        <div className="flex justify-center gap-8 mb-10">
                          <div className="flex flex-col items-center gap-3 group/btn">
                            <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center text-amber-500 shadow-md border border-amber-200 dark:border-slate-600 group-hover/btn:bg-amber-500 group-hover/btn:text-white transition-all duration-300">
                                <Upload className="w-10 h-10" />
                            </div>
                            <span className="text-xs font-bold text-amber-700 dark:text-slate-400 group-hover/btn:text-amber-600 transition-colors uppercase tracking-wider">Upload File</span>
                          </div>
                          
                          <div className="h-24 w-[2px] bg-amber-200 dark:bg-slate-700 mx-2 rounded-full"></div>

                          <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="flex flex-col items-center gap-3 group/btn">
                            <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center text-orange-500 shadow-md border border-orange-200 dark:border-slate-600 group-hover/btn:bg-orange-500 group-hover/btn:text-white transition-all duration-300">
                                <Video className="w-10 h-10" />
                            </div>
                            <span className="text-xs font-bold text-orange-700 dark:text-slate-400 group-hover/btn:text-orange-600 transition-colors uppercase tracking-wider">Use Webcam</span>
                          </button>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Scan Specimen</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                          Upload a high-resolution image or use your device camera to detect WSSV, Black Gill, and other anomalies.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {previewUrl && !analyzing && (
                <button onClick={handleScan} disabled={systemStatus === 'offline'} className="w-full py-5 rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3">
                  <Scan className="w-6 h-6" /> Start Neural Analysis
                </button>
              )}
              {analyzing && <div className="w-full py-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 text-slate-500 animate-pulse shadow-sm"><Activity className="w-6 h-6 animate-spin text-amber-600" /> Processing Specimen...</div>}
            </div>

            {/* RIGHT: REPORT CENTER & HISTORY */}
            <div className="flex flex-col h-full space-y-6">
              <div className="flex-grow min-h-[250px]">
                {!result ? (
                  <div className="h-full bg-cyan-50 dark:from-slate-800 dark:to-slate-900 rounded-[32px] border border-cyan-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 shadow-sm text-cyan-500">
                        <Microscope className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-cyan-900 dark:text-white">Ready for Analysis</h3>
                    <p className="text-sm text-cyan-700/70 dark:text-slate-400 mt-2 font-medium">Results will appear here.</p>
                  </div>
                ) : (
                  <div className={`relative h-full rounded-[32px] p-8 shadow-xl text-white overflow-hidden flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500
                    ${result.status === 'healthy' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' : 'bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-500/30'}
                  `}>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">{result.status === 'healthy' ? <ShieldCheck className="w-6 h-6"/> : <AlertTriangle className="w-6 h-6"/>}</div>
                        <div><p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Diagnosis</p><span className="text-sm font-bold uppercase tracking-wide text-white">{result.status === 'healthy' ? 'Clear' : 'Infection'}</span></div>
                      </div>
                      <h2 className="text-4xl font-black mb-1">{result.condition}</h2>
                      <p className="text-white/80 text-sm mb-4">Confidence: {result.confidence}%</p>
                      <div className="p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
                        <p className="text-xs font-medium leading-relaxed mb-2">{result.advice}</p>
                        {result.behaviors && result.behaviors.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-[10px] font-bold uppercase mb-1">Observed Symptoms:</p>
                            <ul className="list-disc list-inside text-[10px] opacity-80">
                              {result.behaviors.map((b, idx) => <li key={idx}>{b}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Report Center
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex justify-between items-center transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-xl text-blue-700 dark:text-blue-200 shadow-sm">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-900 dark:text-blue-100">Diagnostic Report</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-300">Next-Level Premium PDF</p>
                        </div>
                    </div>
                    <button onClick={generateSingleReport} className={`p-2.5 rounded-xl transition-all ${result ? 'bg-white text-blue-600 shadow-sm hover:scale-110' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}><Download className="w-5 h-5" /></button>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800 flex justify-between items-center transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-xl text-purple-700 dark:text-purple-200 shadow-sm">
                            <FileBarChart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-purple-900 dark:text-purple-100">Health Summary</p>
                            <p className="text-[10px] text-purple-600 dark:text-purple-300">Premium Session PDF</p>
                        </div>
                    </div>
                    <button onClick={generateSummaryReport} className={`p-2.5 rounded-xl transition-all ${history.length > 0 ? 'bg-white text-purple-600 shadow-sm hover:scale-110' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}><Download className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-slate-800 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm p-6 flex flex-col h-[280px]">
                <div className="flex items-center gap-2 mb-4 border-b border-purple-200 dark:border-slate-700 pb-3">
                    <div className="p-1.5 bg-purple-200 rounded-md text-purple-700"><History className="w-4 h-4" /></div>
                    <h4 className="text-xs font-bold uppercase text-purple-900 dark:text-purple-100 tracking-wider">Session History</h4>
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center text-purple-400 dark:text-slate-500 text-xs py-8 italic font-medium">Session is empty.</div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} onClick={() => loadFromHistory(item)} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-700/50 hover:bg-purple-100 dark:hover:bg-slate-600 rounded-xl cursor-pointer transition-colors group border border-purple-100 dark:border-slate-600 shadow-sm">
                                <img src={item.img} alt="thumb" className="w-10 h-10 rounded-lg object-cover border border-slate-100 dark:border-slate-500" />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[10px] font-bold truncate ${item.status === 'healthy' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.condition}</p>
                                  <div className="flex items-center gap-2 text-[9px] text-slate-400"><Clock className="w-3 h-3" /> {item.time}</div>
                                </div>
                            </div>
                        ))
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
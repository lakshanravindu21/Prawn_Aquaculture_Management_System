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

  // Helpers
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. System Health Check
  useEffect(() => {
    const checkSystem = async () => {
      try {
        await axios.get('http://localhost:3001/');
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

  // --- BEHAVIOR MAPPING ---
  const getBehaviorAnalysis = (condition) => {
    if (condition === 'White Spot Syndrome') return ["Lethargy", "Swimming near surface", "Reddish discoloration"];
    if (condition === 'Black Gill Disease') return ["Respiratory distress", "Loss of appetite", "Gill fouling"];
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
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const formData = new FormData();
    formData.append('prawnImage', selectedImage);

    try {
      const res = await axios.post('http://localhost:3001/api/analyze-health', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newResult = res.data;
      const behaviors = getBehaviorAnalysis(newResult.condition);
      const fullResult = { ...newResult, behaviors }; 
      setResult(fullResult);

      setHistory(prev => [{
        id: Date.now(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        ...fullResult,
        img: previewUrl 
      }, ...prev].slice(0, 10));

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
        advice: item.status === 'healthy' 
          ? "Specimen appears healthy. Continue regular monitoring." 
          : "Consult a specialist for detailed treatment."
    });
    setInputMode('preview');
    showToast("Loaded scan from history.", "success");
  };

  // --- REPORT GENERATORS ---
  const generateSingleReport = () => {
    if (!result) {
      showToast("No active scan found. Please scan an image first.", "error");
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(245, 158, 11); // Amber
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("DIAGNOSTIC SCAN REPORT", 15, 17);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleString()}`, pageWidth - 15, 17, { align: 'right' });

    doc.setTextColor(0,0,0);
    doc.setFontSize(14);
    doc.text("1. Visual Analysis", 15, 40);
    
    try {
        if (imgRef.current) doc.addImage(imgRef.current, 'JPEG', 15, 45, 60, 45);
        doc.setDrawColor(200);
        doc.rect(15, 45, 60, 45);
    } catch(e) {}

    doc.setFontSize(12);
    doc.text(`Condition: ${result.condition}`, 80, 50);
    doc.text(`Confidence: ${result.confidence}%`, 80, 60);
    doc.text(`Status: ${result.status.toUpperCase()}`, 80, 70);

    doc.text("2. Recommended Actions", 15, 105);
    doc.setFontSize(10);
    doc.setTextColor(50);
    const splitText = doc.splitTextToSize(result.advice, pageWidth - 40);
    doc.text(splitText, 15, 115);

    doc.save(`Diagnostic_Scan_${Date.now()}.pdf`);
    showToast("Diagnostic Report Downloaded", "success");
  };

  const generateSummaryReport = () => {
    if (history.length === 0) {
      showToast("Session history is empty. Perform scans first.", "error");
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(124, 58, 237); // Violet
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("POPULATION HEALTH SUMMARY", 15, 17);
    
    doc.setTextColor(0,0,0);
    doc.setFontSize(12);
    doc.text(`Total Scans: ${history.length}`, 15, 40);
    
    let yPos = 50;
    history.forEach((h, i) => {
        doc.text(`${i+1}. ${h.time} - ${h.condition} (${h.confidence}%)`, 15, yPos);
        yPos += 10;
    });

    doc.save(`Population_Summary_${Date.now()}.pdf`);
    showToast("Population Summary Downloaded", "success");
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
            
            {/* LEFT: SCANNER (2/3 Width) - AMBER/YELLOW THEME */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SCANNER CONTAINER (UPDATED: Amber/Orange Theme like Dashboard Temp) */}
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

              {/* Action Button */}
              {previewUrl && !analyzing && (
                <button onClick={handleScan} disabled={systemStatus === 'offline'} className="w-full py-5 rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3">
                  <Scan className="w-6 h-6" /> Start Neural Analysis
                </button>
              )}
              {analyzing && <div className="w-full py-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 text-slate-500 animate-pulse shadow-sm"><Activity className="w-6 h-6 animate-spin text-amber-600" /> Processing Specimen...</div>}
            </div>

            {/* RIGHT: REPORT CENTER & HISTORY (1/3 Width) */}
            <div className="flex flex-col h-full space-y-6">
              
              {/* 1. VISUAL RESULT */}
              <div className="flex-grow min-h-[250px]">
                {!result ? (
                  // EMPTY STATE - BLUE/CYAN THEME
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
                      <div className="p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10"><p className="text-xs font-medium leading-relaxed">{result.advice}</p></div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. REPORT CENTER - BLUE & PURPLE THEME */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Report Center
                </h3>
                <div className="space-y-4">
                  
                  {/* Card A: Blue (Pastel) */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex justify-between items-center transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-xl text-blue-700 dark:text-blue-200 shadow-sm">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-900 dark:text-blue-100">Diagnostic Report</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-300">Analysis & Actions</p>
                        </div>
                    </div>
                    <button onClick={generateSingleReport} className={`p-2.5 rounded-xl transition-all ${result ? 'bg-white text-blue-600 shadow-sm hover:scale-110' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}><Download className="w-5 h-5" /></button>
                  </div>

                  {/* Card B: Purple (Pastel) */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800 flex justify-between items-center transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-xl text-purple-700 dark:text-purple-200 shadow-sm">
                            <FileBarChart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-purple-900 dark:text-purple-100">Health Summary</p>
                            <p className="text-[10px] text-purple-600 dark:text-purple-300">Session Statistics</p>
                        </div>
                    </div>
                    <button onClick={generateSummaryReport} className={`p-2.5 rounded-xl transition-all ${history.length > 0 ? 'bg-white text-purple-600 shadow-sm hover:scale-110' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}><Download className="w-5 h-5" /></button>
                  </div>

                </div>
              </div>

              {/* 3. HISTORY SIDEBAR - PURPLE THEME */}
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
                                <div className="flex-1 min-w-0"><p className={`text-[10px] font-bold truncate ${item.status === 'healthy' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.condition}</p><div className="flex items-center gap-2 text-[9px] text-slate-400"><Clock className="w-3 h-3" /> {item.time}</div></div>
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
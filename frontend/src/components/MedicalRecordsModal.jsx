import React, { useState, useEffect } from 'react';
import { 
  X, Upload, FileText, Image, Download, Trash2, Eye, Lock, Search, 
  Filter, HeartPulse, Clock, Sparkles, Pin, Star, Share2, Plus, 
  ChevronRight, Compass, ShieldCheck, Activity, Award, User, RefreshCw, 
  ZoomIn, ZoomOut, AlertCircle, Sparkle, Heart, PlusCircle, Check
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { 
  extractDocumentIntelligence, 
  translateTerm, 
  checkDuplicateDocument 
} from '../utils/medicalIntelligenceEngine';

// Local Shared Core UI Components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'sm', className = '', ...props }) => {
  const baseStyle = "font-bold rounded-2xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-700",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
  };
  const sizes = {
    sm: "px-4 py-2 text-xs min-h-[36px]",
    md: "px-6 py-3 text-sm min-h-[44px]"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const IconButton = ({ children, label, className = '', ...props }) => (
  <button 
    className={`p-2 hover:bg-slate-100 rounded-xl transition-all border border-transparent ${className}`} 
    title={label} 
    aria-label={label}
    {...props}
  >
    {children}
  </button>
);

const Field = ({ label, children, error }) => (
  <div className="space-y-1">
    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">{label}</span>
    {children}
    {error && <span className="text-xs text-rose-600 block">{error}</span>}
  </div>
);

const MedicalRecordsModal = ({ onClose, user }) => {
  const [records, setRecords] = useState([]);
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [vitals, setVitals] = useState({});
  const [healthScore, setHealthScore] = useState(84);
  const [loading, setLoading] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Favorites & Pinned local simulated settings
  const [favorites, setFavorites] = useState(['fav-1']);
  const [pinned, setPinned] = useState(['pin-1', 'pin-2']);

  // Document Upload details
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState('');
  const [docCategory, setDocCategory] = useState('lab');
  const [docDoctor, setDocDoctor] = useState('Dr. Gregory House');
  const [docHospital, setDocHospital] = useState('Helio General Hospital');
  const [docNotes, setDocNotes] = useState('');
  const [docTags, setDocTags] = useState('');

  // AI Intelligent Processing Pipeline States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('ocr'); // 'ocr', 'entity', 'complete'
  const [showReviewConsole, setShowReviewConsole] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [explainedTerms, setExplainedTerms] = useState([]);

  // Share Panel states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareConfig, setShareConfig] = useState({ duration: '24h', type: 'read-only' });
  const [generatedShareLink, setGeneratedShareLink] = useState('');

  // Quick Preview Modal state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(100);

  // Fetch complete care data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/health/dashboard');
      setRecords(data.records || []);
      setMedications(data.medications || []);
      setAppointments(data.appointments || []);
      setNotes(data.notes || []);
      setVitals(data.profile?.vitals || {});
      setHealthScore(data.profile?.healthScore || 84);
    } catch (err) {
      console.error('Failed to load clinical care dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Construct unified health timeline events
  const buildTimeline = () => {
    const events = [];

    // 1. Records
    records.forEach(r => {
      events.push({
        id: r._id,
        type: 'record',
        category: r.type, // 'lab', 'prescription', etc.
        title: r.title,
        date: r.date || r.createdAt,
        doctor: r.metadata?.doctor || 'Clinical Vault',
        hospital: r.metadata?.hospital || 'Helio Clinic',
        desc: r.summary || 'Uploaded diagnostic report.',
        tags: r.metadata?.tags ? r.metadata.tags.split(',') : ['Report'],
        source: r
      });
    });

    // 2. Medications
    medications.forEach(m => {
      events.push({
        id: m._id,
        type: 'medication',
        category: 'medicine',
        title: `Routine Started: ${m.name}`,
        date: m.createdAt,
        doctor: 'Dr. Gregory House',
        hospital: 'Internal Medicine Wing',
        desc: `${m.dosage} • ${m.frequency} | Dosing times: ${m.times?.join(', ')}`,
        tags: ['Prescribed', m.name],
        source: m
      });
    });

    // 3. Appointments
    appointments.forEach(a => {
      events.push({
        id: a._id,
        type: 'appointment',
        category: 'consultation',
        title: `Appointment: Dr. ${a.doctorName}`,
        date: a.date,
        doctor: a.doctorName,
        hospital: a.clinicAddress || 'Helio outpatient wing',
        desc: `Status: ${a.status} | Reason: ${a.notes || 'Routine follow-up'}`,
        tags: [a.status, a.specialty || 'General'],
        source: a
      });
    });

    // 4. Consultation Notes
    notes.forEach(n => {
      events.push({
        id: n._id,
        type: 'note',
        category: 'doctor-note',
        title: `Consultation Note: ${n.title}`,
        date: n.createdAt,
        doctor: 'Dr. Gregory House',
        hospital: 'Primary Care wing',
        desc: n.content,
        tags: [n.category || 'Care Plan'],
        source: n
      });
    });

    // Apply Search Term
    let filtered = events.filter(e => 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.hospital.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply Dropdown Filters
    if (filterCategory !== 'all') {
      filtered = filtered.filter(e => e.category.toLowerCase() === filterCategory.toLowerCase() || e.type.toLowerCase() === filterCategory.toLowerCase());
    }
    if (filterDoctor !== 'all') {
      filtered = filtered.filter(e => e.doctor.toLowerCase().includes(filterDoctor.toLowerCase()));
    }
    if (filterYear !== 'all') {
      filtered = filtered.filter(e => new Date(e.date).getFullYear().toString() === filterYear);
    }
    if (onlyFavorites) {
      filtered = filtered.filter(e => favorites.includes(e.id));
    }
    if (onlyPinned) {
      filtered = filtered.filter(e => pinned.includes(e.id));
    }

    // Sort chronologically descending
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const timelineEvents = buildTimeline();

  // Favorite / Pin Toggles
  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(f => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const togglePin = (id) => {
    if (pinned.includes(id)) {
      setPinned(pinned.filter(p => p !== id));
    } else {
      setPinned([...pinned, id]);
    }
  };

  // UPLOAD CENTER MANAGEMENT
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = [...e.dataTransfer.files];
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = [...e.target.files];
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    for (const file of files) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setUploadingName(file.name);
        setUploadProgress(10);
        setIsProcessing(true);
        setProcessingStep('ocr');

        // Stage 1: Simulating OCR processing
        setTimeout(() => {
          setUploadProgress(40);
          setProcessingStep('entity');
          
          // Stage 2: Simulating Entity recognition
          setTimeout(() => {
            setUploadProgress(80);
            setProcessingStep('complete');

            // Stage 3: Compiles result
            setTimeout(() => {
              setUploadProgress(100);
              const data = extractDocumentIntelligence(file.name);
              const dup = checkDuplicateDocument(records, data.title);
              const terms = translateTerm(data.summary + ' ' + data.diagnosis);

              setExtractedData({
                ...data,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type
              });
              setDuplicateWarning(dup);
              setExplainedTerms(terms);
              setIsProcessing(false);
              setShowReviewConsole(true);
            }, 600);

          }, 1000);

        }, 1000);
      } else {
        alert('Unsupported file type. Please upload a PDF or image.');
      }
    }
  };

  const commitExtractedData = async () => {
    try {
      setLoading(true);
      
      // 1. Save Health Record document log
      await apiRequest('/health/records', {
        method: 'POST',
        body: JSON.stringify({
          type: extractedData.type,
          title: extractedData.title,
          summary: extractedData.summary,
          metadata: {
            fileName: extractedData.fileName,
            fileSize: extractedData.fileSize,
            mimeType: extractedData.mimeType,
            doctor: extractedData.doctor,
            hospital: extractedData.hospital,
            tags: extractedData.type
          }
        })
      });

      // 2. Synchronize Prescription medicines to active medication schedules
      if (extractedData.type === 'prescription' && extractedData.medicines?.length > 0) {
        for (const rx of extractedData.medicines) {
          await apiRequest('/health/medications', {
            method: 'POST',
            body: JSON.stringify({
              name: rx.name,
              dosage: rx.dosage,
              frequency: rx.frequency,
              times: rx.times || ['08:00'],
              notes: rx.notes || 'Prescribed via AI extraction.'
            })
          });
        }
      }

      setShowReviewConsole(false);
      setExtractedData(null);
      setUploadingName('');
      setUploadProgress(0);
      await fetchDashboardData();
    } catch (err) {
      alert(`Sync failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this medical record?')) return;
    try {
      await apiRequest(`/health/records/${id}`, {
        method: 'DELETE'
      });
      await fetchDashboardData();
    } catch (err) {
      alert(`Failed to delete record: ${err.message}`);
    }
  };

  // SHARE LINKS COMPILER
  const generateShareLink = () => {
    const code = `H-SHARE-${Math.random().toString(36).substring(3, 9).toUpperCase()}`;
    const link = `${window.location.origin}/share/patient/${user.id}?code=${code}&duration=${shareConfig.duration}&type=${shareConfig.type}`;
    setGeneratedShareLink(link);
  };

  // Color mappings for document categories
  const categoryColors = {
    'lab': 'bg-emerald-50 text-emerald-800 border-emerald-100',
    'prescription': 'bg-sky-50 text-sky-800 border-sky-100',
    'medicine': 'bg-teal-50 text-teal-800 border-teal-100',
    'consultation': 'bg-blue-50 text-blue-800 border-blue-100',
    'doctor-note': 'bg-violet-50 text-violet-800 border-violet-100',
    'sos': 'bg-rose-50 text-rose-800 border-rose-100'
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-card-strong max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* 1. COMPREHENSIVE HEADER HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-2xl shadow-lg mr-4">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Digital Health Journey</h2>
              <p className="text-xs text-gray-500 font-medium">Your complete medical life, interconnected chronologically with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => { generateShareLink(); setShowShareModal(true); }}
              className="text-xs py-1.5 min-h-9 flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" /> Share Access
            </Button>
            <IconButton 
              label="Close Panel" 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 border-slate-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </IconButton>
          </div>
        </div>

        {/* 2. OVERVIEW METRICS BANNER */}
        <section className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0" aria-label="Health Overview Dashboard">
          <div className="text-center md:border-r border-slate-200/80 last:border-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Total Reports</span>
            <span className="text-lg font-extrabold text-slate-800 mt-1 block">{records.length} files</span>
          </div>
          <div className="text-center md:border-r border-slate-200/80 last:border-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Active Medicines</span>
            <span className="text-lg font-extrabold text-teal-800 mt-1 block">{medications.filter(m => m.active).length} active</span>
          </div>
          <div className="text-center md:border-r border-slate-200/80 last:border-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Consultations</span>
            <span className="text-lg font-extrabold text-blue-800 mt-1 block">{notes.length} logs</span>
          </div>
          <div className="text-center md:border-r border-slate-200/80 last:border-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Health Score</span>
            <span className="text-lg font-extrabold text-emerald-800 mt-1 block">{healthScore}% Index</span>
          </div>
          <div className="col-span-2 md:col-span-1 text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Storage Usage</span>
            <span className="text-xs font-semibold text-slate-700 mt-1 block">{(records.length * 1.8).toFixed(1)} MB of 100MB</span>
            <div className="w-20 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(records.length * 2, 100)}%` }} />
            </div>
          </div>
        </section>

        {/* 3. CORE CONTENT AREA */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT INTERACTIVE TIMELINE WORKSPACE */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* SEARCH & ACCORDION FILTERS CONTROL */}
            <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, doctor, conditions, symptoms..."
                  className="input-field pl-9 py-1.5 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input-field py-1.5 text-xs bg-white flex-1 md:flex-none max-w-[120px]"
                >
                  <option value="all">Categories</option>
                  <option value="lab">Lab Reports</option>
                  <option value="prescription">Prescriptions</option>
                  <option value="medicine">Medications</option>
                  <option value="consultation">Consults</option>
                  <option value="doctor-note">Notes</option>
                </select>

                <select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="input-field py-1.5 text-xs bg-white flex-1 md:flex-none max-w-[120px]"
                >
                  <option value="all">Doctors</option>
                  <option value="house">Dr. House</option>
                  <option value="clinical">Clinical Vault</option>
                </select>

                <button
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={`p-2 rounded-2xl border transition-all ${
                    onlyFavorites ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white border-slate-200 text-slate-400'
                  }`}
                  title="Filter Favorites"
                >
                  <Star className="h-4.5 w-4.5 fill-current" />
                </button>

                <button
                  onClick={() => setOnlyPinned(!onlyPinned)}
                  className={`p-2 rounded-2xl border transition-all ${
                    onlyPinned ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white border-slate-200 text-slate-400'
                  }`}
                  title="Filter Pinned"
                >
                  <Pin className="h-4.5 w-4.5 fill-current" />
                </button>
              </div>
            </Card>

            {/* LIVING MEDICAL JOURNEY TIMELINE */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Living Health Journey</h3>
              
              <div className="space-y-6 pl-4 border-l border-emerald-100 relative">
                {timelineEvents.length > 0 ? (
                  timelineEvents.map((evt) => {
                    const isFav = favorites.includes(evt.id);
                    const isPin = pinned.includes(evt.id);
                    const colorClass = categoryColors[evt.category] || 'bg-slate-50 text-slate-700 border-slate-200';

                    return (
                      <div key={evt.id} className="relative group">
                        
                        {/* Timeline node bullet */}
                        <span className="absolute -left-[22px] top-2 h-3.5 w-3.5 rounded-full bg-emerald-600 border border-white ring-2 ring-emerald-50 group-hover:scale-125 transition-transform" />

                        {/* Event Content Box */}
                        <Card className="p-4 bg-white/70 hover:bg-white border-slate-100 hover:border-emerald-200/50 hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono font-bold text-slate-400">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(evt.date).toLocaleDateString()}</span>
                              <span className={`uppercase font-sans font-extrabold px-2 py-0.2 rounded-full border ${colorClass}`}>
                                {evt.category}
                              </span>
                            </div>
                            
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{evt.title}</h4>
                              <p className="text-xs text-slate-500 mt-1 leading-normal max-w-xl">{evt.desc}</p>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                              <span>Clinic: <strong className="text-slate-600">{evt.hospital}</strong></span>
                              <span>•</span>
                              <span>Doctor: <strong className="text-slate-600">{evt.doctor}</strong></span>
                            </div>
                            
                            {evt.tags && evt.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {evt.tags.map(t => (
                                  <span key={t} className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full border border-slate-200/40">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action Items */}
                          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 self-stretch min-w-[120px] shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                            <div className="flex gap-1">
                              <IconButton 
                                label="Toggle Favorite" 
                                onClick={() => toggleFavorite(evt.id)}
                                className={`h-8 w-8 border-0 ${isFav ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
                              >
                                <Star className="h-4 w-4 fill-current" />
                              </IconButton>
                              <IconButton 
                                label="Toggle Pin" 
                                onClick={() => togglePin(evt.id)}
                                className={`h-8 w-8 border-0 ${isPin ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                              >
                                <Pin className="h-4 w-4 fill-current" />
                              </IconButton>
                            </div>

                            <div className="flex gap-1.5 mt-auto">
                              {evt.type === 'record' && (
                                <>
                                  <button
                                    onClick={() => setSelectedDoc(evt)}
                                    className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded"
                                  >
                                    Preview
                                  </button>
                                  <IconButton 
                                    label="Delete File" 
                                    onClick={() => deleteRecord(evt.id)}
                                    className="h-7 w-7 text-slate-400 hover:text-rose-600 border-0 bg-transparent hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </IconButton>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    No timeline matches found. Adjust search terms.
                  </div>
                )}
              </div>
            </div>

          </main>

          {/* RIGHT SIDEBAR: UPLOAD CENTER & PINNED LIST */}
          <aside className="w-full lg:w-[320px] bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200/80 p-6 space-y-6 shrink-0 overflow-y-auto">
            
            {/* PINNED CARD VIEW */}
            <section className="space-y-3" aria-labelledby="pinned-records-heading">
              <h3 id="pinned-records-heading" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pinned Care Files</h3>
              <div className="space-y-2">
                <Card className="p-3 bg-indigo-50/30 border-indigo-100 flex items-center justify-between text-xs hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">Allergen Panel Card</p>
                      <span className="text-[9px] text-slate-400">Allergies: Penicillin</span>
                    </div>
                  </div>
                  <Pin className="h-3.5 w-3.5 text-indigo-700 fill-current shrink-0" />
                </Card>

                <Card className="p-3 bg-indigo-50/30 border-indigo-100 flex items-center justify-between text-xs hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">Emergency SOS Specs</p>
                      <span className="text-[9px] text-slate-400">Blood group: O+</span>
                    </div>
                  </div>
                  <Pin className="h-3.5 w-3.5 text-indigo-700 fill-current shrink-0" />
                </Card>
              </div>
            </section>

            {/* PREMIUM UPLOAD CENTER */}
            <section className="space-y-3" aria-labelledby="upload-heading">
              <h3 id="upload-heading" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Interactive Upload Center</h3>
              <Card className="p-4 space-y-4">
                
                {/* Drag-drop target */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    dragActive 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-700 block">Upload Document</span>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Drag files or click below</p>
                  
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileInput}
                    className="hidden"
                    id="sidebar-file-upload"
                  />
                  <label
                    htmlFor="sidebar-file-upload"
                    className="btn-secondary text-[10px] py-1 px-3 mt-3 inline-block cursor-pointer min-h-8"
                  >
                    Select File
                  </label>
                </div>

                {/* Simulated uploading progress bar */}
                {uploadingName && (
                  <div className="space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-700 truncate">{uploadingName}</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Upload attributes config */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <Field label="Category Tag">
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="input-field py-1.5 text-xs bg-white"
                    >
                      <option value="lab">Lab Chemistry Report</option>
                      <option value="prescription">Prescription Slip</option>
                      <option value="mri">MRI Scan file</option>
                      <option value="xray">Chest X-Ray scan</option>
                      <option value="doctor-note">Doctor Note log</option>
                    </select>
                  </Field>

                  <Field label="Diagnosing Physician">
                    <input 
                      type="text" 
                      value={docDoctor}
                      onChange={(e) => setDocDoctor(e.target.value)}
                      className="input-field py-1.5 text-xs" 
                    />
                  </Field>

                  <Field label="Observation Tags">
                    <input 
                      type="text" 
                      value={docTags}
                      onChange={(e) => setDocTags(e.target.value)}
                      placeholder="e.g. Lab, Cardiac, Allergy" 
                      className="input-field py-1.5 text-xs" 
                    />
                  </Field>

                  <Field label="Notes / Comments">
                    <textarea 
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      placeholder="Enter clinical report summaries..." 
                      className="input-field py-1.5 text-xs resize-none" 
                      rows={2}
                    />
                  </Field>
                </div>

              </Card>
            </section>

          </aside>

        </div>

      </div>

      {/* AI PROCESSING MODAL LOADER */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" role="dialog">
          <Card className="p-8 max-w-sm w-full text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-emerald-600 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">HELIO Medical Intelligence</h3>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">
                {processingStep === 'ocr' && '⚡ Initiating High-Precision OCR...'}
                {processingStep === 'entity' && '🧠 Running Clinical Entity NER...'}
                {processingStep === 'complete' && '📝 Structuring Medical Models...'}
              </p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300" 
                style={{ width: `${processingStep === 'ocr' ? 30 : processingStep === 'entity' ? 70 : 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Extracting diagnoses, medicines and references automatically.</p>
          </Card>
        </div>
      )}

      {/* AI COMPREHENSION MANUAL REVIEW CONSOLE */}
      {showReviewConsole && extractedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-rise-in">
            
            {/* Review Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkle className="h-5 w-5 text-emerald-600 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Intelligent Verification Console</h3>
                  <p className="text-[10px] text-slate-500">Audit and verify automatically parsed information before synchronization</p>
                </div>
              </div>
              <IconButton label="Cancel Review" onClick={() => setShowReviewConsole(false)} className="h-8 w-8">
                <X className="h-4 w-4 text-slate-400" />
              </IconButton>
            </div>

            {/* Scrollable Layout */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* EDITABLE FIELDS (Left 2 Columns) */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* General Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Document Title">
                    <input 
                      type="text" 
                      value={extractedData.title}
                      onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                      className="input-field py-2 text-xs" 
                    />
                  </Field>
                  <Field label="Document Type">
                    <select
                      value={extractedData.type}
                      onChange={(e) => setExtractedData({ ...extractedData, type: e.target.value })}
                      className="input-field py-2 text-xs bg-white"
                    >
                      <option value="prescription">Prescription Slip</option>
                      <option value="lab">Lab Blood report</option>
                    </select>
                  </Field>
                  <Field label="Physician Assigned">
                    <input 
                      type="text" 
                      value={extractedData.doctor}
                      onChange={(e) => setExtractedData({ ...extractedData, doctor: e.target.value })}
                      className="input-field py-2 text-xs" 
                    />
                  </Field>
                  <Field label="Hospital Wing">
                    <input 
                      type="text" 
                      value={extractedData.hospital}
                      onChange={(e) => setExtractedData({ ...extractedData, hospital: e.target.value })}
                      className="input-field py-2 text-xs" 
                    />
                  </Field>
                </div>

                {/* Summaries */}
                <div className="space-y-4">
                  <Field label="Extracted Primary Diagnosis">
                    <input 
                      type="text" 
                      value={extractedData.diagnosis}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExtractedData({ ...extractedData, diagnosis: val });
                        setExplainedTerms(translateTerm(val + ' ' + extractedData.summary));
                      }}
                      className="input-field py-2 text-xs" 
                    />
                  </Field>
                  <Field label="Structured Summary">
                    <textarea 
                      value={extractedData.summary}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExtractedData({ ...extractedData, summary: val });
                        setExplainedTerms(translateTerm(extractedData.diagnosis + ' ' + val));
                      }}
                      className="input-field py-2 text-xs resize-none" 
                      rows={2}
                    />
                  </Field>
                </div>

                {/* MEDICINE EXTRACTION GRID */}
                {extractedData.type === 'prescription' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">Medicines Discovered ({extractedData.medicines?.length || 0})</span>
                      <button
                        onClick={() => {
                          const list = [...(extractedData.medicines || [])];
                          list.push({ name: 'New Medicine', dosage: '500mg', frequency: 'Once daily', times: ['08:00'], notes: '' });
                          setExtractedData({ ...extractedData, medicines: list });
                        }}
                        className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                      >
                        <PlusCircle className="h-4 w-4" /> Add Medicine
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left" role="table">
                        <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Medicine</th>
                            <th className="p-3">Dosage</th>
                            <th className="p-3">Frequency</th>
                            <th className="p-3">Times</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {extractedData.medicines?.map((med, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/40">
                              <td className="p-2">
                                <input 
                                  type="text" 
                                  value={med.name} 
                                  onChange={(e) => {
                                    const list = [...extractedData.medicines];
                                    list[idx].name = e.target.value;
                                    setExtractedData({ ...extractedData, medicines: list });
                                  }}
                                  className="w-full border-0 bg-transparent focus:ring-0 font-bold text-slate-800 p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="text" 
                                  value={med.dosage} 
                                  onChange={(e) => {
                                    const list = [...extractedData.medicines];
                                    list[idx].dosage = e.target.value;
                                    setExtractedData({ ...extractedData, medicines: list });
                                  }}
                                  className="w-full border-0 bg-transparent focus:ring-0 text-slate-600 p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="text" 
                                  value={med.frequency} 
                                  onChange={(e) => {
                                    const list = [...extractedData.medicines];
                                    list[idx].frequency = e.target.value;
                                    setExtractedData({ ...extractedData, medicines: list });
                                  }}
                                  className="w-full border-0 bg-transparent focus:ring-0 text-slate-600 p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="text" 
                                  value={med.times?.join(', ')} 
                                  onChange={(e) => {
                                    const list = [...extractedData.medicines];
                                    list[idx].times = e.target.value.split(',').map(s => s.trim());
                                    setExtractedData({ ...extractedData, medicines: list });
                                  }}
                                  className="w-full border-0 bg-transparent focus:ring-0 text-slate-600 p-1 font-mono"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => {
                                    const list = extractedData.medicines.filter((_, i) => i !== idx);
                                    setExtractedData({ ...extractedData, medicines: list });
                                  }}
                                  className="text-rose-600 hover:text-rose-700"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* LAB TEST VALUE DISCOVERY GRID */}
                {extractedData.type === 'lab' && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">Chemical Parameters Discovered ({extractedData.labValues?.length || 0})</span>
                    
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left" role="table">
                        <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Test</th>
                            <th className="p-3">Value</th>
                            <th className="p-3">Range</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {extractedData.labValues?.map((lb, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/40">
                              <td className="p-3 font-bold text-slate-800">{lb.name}</td>
                              <td className="p-3">
                                <input 
                                  type="text" 
                                  value={lb.value} 
                                  onChange={(e) => {
                                    const list = [...extractedData.labValues];
                                    list[idx].value = e.target.value;
                                    setExtractedData({ ...extractedData, labValues: list });
                                  }}
                                  className="w-16 border border-slate-200 rounded p-1 text-slate-700 font-mono text-center"
                                />
                                <span className="text-slate-400 ml-1 font-semibold">{lb.unit}</span>
                              </td>
                              <td className="p-3 font-mono text-slate-500">{lb.range}</td>
                              <td className="p-3">
                                <select
                                  value={lb.status}
                                  onChange={(e) => {
                                    const list = [...extractedData.labValues];
                                    list[idx].status = e.target.value;
                                    setExtractedData({ ...extractedData, labValues: list });
                                  }}
                                  className="border border-slate-200 rounded p-1 text-[10px] font-bold bg-white"
                                >
                                  <option value="stable">Stable</option>
                                  <option value="attention">Attention</option>
                                  <option value="critical">Critical</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* MEDICAL INTELLIGENCE SIDEBAR (Right 1 Column) */}
              <div className="space-y-5 lg:border-l lg:border-slate-100 lg:pl-6">
                
                {/* DUPLICATE CAUTION BANNER */}
                {duplicateWarning && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex gap-2 text-xs leading-normal">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold">Duplicate File Alert</p>
                      <p className="text-[10px] text-amber-700 mt-1">A record with the title "{extractedData.title}" matches files in your history. Review names to avoid duplicate logs.</p>
                    </div>
                  </div>
                )}

                {/* ACCESSIBLE MEDICAL TERMS SIDEBAR */}
                <div className="space-y-3" aria-labelledby="terms-heading">
                  <h4 id="terms-heading" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Medical Terms Explained</h4>
                  
                  {explainedTerms.length > 0 ? (
                    <div className="space-y-2">
                      {explainedTerms.map((t, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 space-y-1">
                          <p className="font-extrabold text-slate-800 text-[10px] flex items-center gap-1">
                            <Heart className="h-3 w-3 text-emerald-600 fill-current" />
                            {t.friendly} <span className="text-[9px] text-slate-400 font-mono">({t.term})</span>
                          </p>
                          <p className="text-[10px] text-slate-500 leading-normal">{t.meaning}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">No complex diagnostic terminologies registered in this summary.</p>
                  )}
                </div>

                {/* AI DISCLAIMER */}
                <div className="p-3 rounded-xl bg-slate-50 text-[10px] text-slate-400 leading-relaxed border border-slate-200/30">
                  <span className="font-bold text-slate-500 block mb-1">🏥 Clinical Intelligence Notice</span>
                  Extraction algorithms augment record indexing. Never replace professional medical consultation. Review all dosages before confirmation.
                </div>

              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3 shrink-0">
              <Button variant="secondary" size="md" onClick={() => setShowReviewConsole(false)} className="px-6">Cancel</Button>
              <Button 
                variant="primary" 
                size="md" 
                onClick={commitExtractedData}
                disabled={loading}
                className="px-8 min-h-11 text-xs"
              >
                {loading ? 'Synchronizing...' : 'Confirm & Sync to Timeline'}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* SECURE SHARING ACCESS CONTROLLER MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="surface-card-strong max-w-sm w-full p-5 space-y-4 animate-rise-in">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Secure Sharing Manager</h2>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">Access Duration limit</span>
                <select
                  value={shareConfig.duration}
                  onChange={(e) => setShareConfig({ ...shareConfig, duration: e.target.value })}
                  className="input-field py-1.5 text-xs bg-white"
                >
                  <option value="1h">1 hour temporary</option>
                  <option value="24h">24 hours temporary</option>
                  <option value="7d">7 days temporary</option>
                  <option value="permanent">Permanent access</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">Permission Level</span>
                <select
                  value={shareConfig.type}
                  onChange={(e) => setShareConfig({ ...shareConfig, type: e.target.value })}
                  className="input-field py-1.5 text-xs bg-white"
                >
                  <option value="read-only">Read-only (Summary only)</option>
                  <option value="full-clinical">Full Clinical Access</option>
                </select>
              </label>

              <Button 
                variant="primary" 
                size="sm" 
                onClick={generateShareLink}
                className="w-full text-xs py-2 min-h-9"
              >
                Compile Sharing Code
              </Button>

              {generatedShareLink && (
                <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-xl space-y-2">
                  <p className="font-bold text-[10px] uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                    Share code created:
                  </p>
                  <input 
                    type="text" 
                    readOnly 
                    value={generatedShareLink.split('?code=')[1]} 
                    className="w-full text-center font-mono font-bold text-slate-900 border border-emerald-200 bg-white p-1 rounded uppercase tracking-widest text-xs" 
                  />
                  <div className="mx-auto w-24 h-24 bg-white border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-400">
                    [ QR Code Render ]
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => { setShowShareModal(false); setGeneratedShareLink(''); }} className="text-xs min-h-9">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK DOCUMENT PREVIEW MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="surface-card-strong max-w-md w-full p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {selectedDoc.category}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-1">{selectedDoc.title}</h3>
              </div>
              <div className="flex items-center gap-1">
                <IconButton label="Zoom In" onClick={() => setPreviewZoom(prev => Math.min(prev + 20, 180))} className="h-8 w-8 border-0">
                  <ZoomIn className="h-4 w-4" />
                </IconButton>
                <IconButton label="Zoom Out" onClick={() => setPreviewZoom(prev => Math.max(prev - 20, 60))} className="h-8 w-8 border-0">
                  <ZoomOut className="h-4 w-4" />
                </IconButton>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl h-[260px] flex items-center justify-center overflow-auto border border-slate-950 p-4">
              <div 
                className="bg-white rounded p-4 max-w-[280px] w-full text-center space-y-3 shadow-md"
                style={{ transform: `scale(${previewZoom / 100})` }}
              >
                <h4 className="font-bold text-[9px] text-slate-800 uppercase tracking-widest">Helio Diagnostic Laboratory</h4>
                <div className="text-[9px] text-slate-500 space-y-1 text-left leading-normal border-t border-slate-100 pt-2">
                  <p><strong>Clinician:</strong> {selectedDoc.doctor}</p>
                  <p><strong>Wing:</strong> {selectedDoc.hospital}</p>
                  <p><strong>Note summary:</strong> BMP & Glucose chemistry assessment falls in clinical targets.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-semibold">
              <span>Zoom level: {previewZoom}%</span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedDoc(null)} className="text-xs min-h-8 py-1">Close</Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MedicalRecordsModal;
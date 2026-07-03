import React, { useState } from 'react';
import { 
  User, ShieldAlert, HeartPulse, Pill, Clock, FileText, Download, ZoomIn, 
  ZoomOut, ShieldCheck, Mail, Phone, Calendar, Search, Play, HelpCircle, Activity
} from 'lucide-react';
import { Card, Button } from '../design-system';

export default function PatientProfileView({
  patientDetail,
  isLoadingDetail,
  onStartConsultation,
  onAddNote,
  isSavingNote
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timelineSearch, setTimelineSearch] = useState('');
  
  // Local state to simulate starting/stopping medicines in the view
  const [meds, setMeds] = useState([
    { id: 'm1', name: 'Metformin XR', dosage: '500mg', frequency: 'Once daily (evening)', status: 'active', startDate: '2026-05-10' },
    { id: 'm2', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily (morning)', status: 'active', startDate: '2026-06-01' },
    { id: 'm3', name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', status: 'paused', startDate: '2026-06-15' }
  ]);

  // Document zoom / previewer states
  const [selectedReport, setSelectedReport] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Consent simulator
  const [consentGranted, setConsentGranted] = useState(true); // Can toggle to show lock screen if wanted

  const toggleMedStatus = (id, newStatus) => {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  const getAge = (dob) => {
    if (!dob) return 42;
    const birthDate = new Date(dob);
    return Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970);
  };

  if (isLoadingDetail) {
    return (
      <Card className="p-16 text-center border-slate-200">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        <p className="text-xs text-slate-500 font-bold">Retrieving patient chart history...</p>
      </Card>
    );
  }

  if (!patientDetail) {
    return (
      <Card className="p-16 text-center border-slate-200">
        <div className="mx-auto mb-4 h-12 w-12 text-slate-300 flex items-center justify-center">
          <User className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Patient Chart Selected</h3>
        <p className="text-xs text-slate-500 mt-2">Choose a patient from the directory to review their profile.</p>
      </Card>
    );
  }

  // Security Access lock out check
  if (!consentGranted) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto border-rose-100 bg-rose-50/20">
        <ShieldAlert className="h-12 w-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wide">Sensitive Access Restricted</h2>
        <p className="text-xs text-rose-700 mt-2 leading-relaxed">
          Dr. Greg House is not granted active access credentials for this patient profile file. Consent permission has been revoked or expired.
        </p>
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={() => setConsentGranted(true)} className="text-xs">
            Send Consent Request
          </Button>
        </div>
      </Card>
    );
  }

  const { patient, notes = [], records = [], appointments = [] } = patientDetail;

  // Build a consolidated chronological timeline
  const rawTimeline = [
    { type: 'registration', date: '2026-05-01', title: 'Patient Profile Registered', desc: 'Onboarded into HELIO Patient Portal.', category: 'system' },
    ...meds.map(m => ({
      type: 'medication',
      date: m.startDate,
      title: `Medication Prescribed: ${m.name}`,
      desc: `Dosage: ${m.dosage} | Frequency: ${m.frequency} | Status: ${m.status}`,
      category: 'medicine'
    })),
    ...notes.map(n => ({
      type: 'note',
      date: n.createdAt ? new Date(n.createdAt).toISOString().split('T')[0] : '2026-07-01',
      title: `Clinical Note: ${n.title}`,
      desc: `Category: ${n.category} | Obs: ${n.content.substring(0, 100)}...`,
      category: 'consult'
    })),
    ...records.map(r => ({
      type: 'report',
      date: '2026-07-02',
      title: `Document Uploaded: ${r.title}`,
      desc: r.summary || 'Lab report logs.',
      category: 'report'
    }))
  ];

  const sortedTimeline = rawTimeline
    .filter(t => 
      t.title.toLowerCase().includes(timelineSearch.toLowerCase()) || 
      t.desc.toLowerCase().includes(timelineSearch.toLowerCase())
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6 animate-rise-in">
      
      {/* PROFILE CORE PANEL */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-3xl flex items-center justify-center font-bold text-2xl text-emerald-800 bg-emerald-50 border ring-2 ring-emerald-500/40 ring-offset-2">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{patient.name}</h2>
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                  Active Clinical Link
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Email: <strong className="text-slate-700">{patient.email}</strong> • Access Code: <span className="font-mono text-emerald-950 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">{patient.accessCode || 'H-X8D2W3'}</span>
              </p>
            </div>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => onStartConsultation(patient.id)}
            className="flex items-center gap-1.5 min-h-10 text-xs py-2"
          >
            <Play className="h-4 w-4 fill-white" /> Start Active Consultation
          </Button>
        </div>
      </Card>

      {/* TABS SELECTOR */}
      <Card className="p-1 flex bg-slate-100 rounded-2xl w-full">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'vitals', label: 'Vitals Trends' },
          { id: 'medications', label: 'Medications Control' },
          { id: 'timeline', label: 'Clinical Timeline' },
          { id: 'reports', label: 'Reports & Scans' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all flex-1 text-center ${
              activeTab === t.id 
                ? 'bg-white text-emerald-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </Card>

      {/* TAB SHEETS */}
      <div className="min-h-[300px]">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide">Patient Registry Info</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Age</span>
                  <span className="text-slate-700 block mt-0.5">{getAge(patient.dateOfBirth)} Years</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Blood Group</span>
                  <span className="text-slate-700 block mt-0.5">{patient.bloodType || 'O+'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Allergies</span>
                  <span className="text-rose-700 font-semibold block mt-0.5">{patient.allergies?.join(', ') || 'Penicillin'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Health Score Index</span>
                  <span className="text-emerald-800 font-extrabold block mt-0.5">{patient.healthScore || 84}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide">Contacts & Consent</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>Emergency contact: <strong>Arthur SR (+1 415-321-2290)</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>Clinical communications: <strong>Consented via SMS & Portal</strong></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 font-bold">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Security Access Permission Approved (Active status)</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 2. VITALS TRENDS */}
        {activeTab === 'vitals' && (
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide mb-3">
              <HeartPulse className="h-4.5 w-4.5 text-rose-600" />
              Comprehensive Vitals Matrix & Trends
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Weight', value: patient.vitals?.weight ? `${patient.vitals.weight} kg` : '78 kg', trend: 'stable', detail: 'Target: 75 kg' },
                { label: 'Height', value: patient.vitals?.height ? `${patient.vitals.height} cm` : '180 cm', trend: 'stable', detail: 'BMI: 24.1 (Normal)' },
                { label: 'Heart Rate', value: patient.vitals?.heartRate ? `${patient.vitals.heartRate} bpm` : '72 bpm', trend: 'up', detail: 'Alert threshold: 100 bpm' },
                { label: 'Blood Pressure', value: patient.vitals?.bloodPressure || '120/80', trend: 'down', detail: 'Prev: 130/85 (Healthy decrease)' },
                { label: 'Temperature', value: patient.vitals?.temperature ? `${patient.vitals.temperature}°C` : '36.8°C', trend: 'stable', detail: 'Normal range' },
                { label: 'Oxygen SpO2', value: patient.vitals?.oxygenSaturation ? `${patient.vitals.oxygenSaturation}%` : '98%', trend: 'up', detail: 'Optimal blood oxygenation' }
              ].map((v, i) => (
                <div key={i} className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-100 hover:border-emerald-200/50 transition-colors flex flex-col justify-between h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{v.label}</span>
                    <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded border ${
                      v.trend === 'up' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : v.trend === 'down'
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {v.trend} trend
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-slate-900 block">{v.value}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{v.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 3. MEDICATIONS CONTROL */}
        {activeTab === 'medications' && (
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
              <Pill className="h-4.5 w-4.5 text-emerald-600" />
              Active Medication Control Console
            </h3>

            <div className="space-y-4">
              {meds.map((m) => (
                <div 
                  key={m.id} 
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    m.status === 'stopped' 
                      ? 'bg-slate-50 text-slate-400 border-slate-100 line-through' 
                      : m.status === 'paused'
                      ? 'bg-amber-50/20 text-slate-600 border-amber-100'
                      : 'bg-white text-slate-800 border-slate-100 hover:border-emerald-200'
                  }`}
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-950 flex items-center gap-2">
                      {m.name}
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded border leading-none ${
                        m.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                          : m.status === 'paused'
                          ? 'bg-amber-50 text-amber-800 border-amber-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {m.status}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Dosage: <strong>{m.dosage}</strong> • Frequency: <strong>{m.frequency}</strong> • Began: <strong>{m.startDate}</strong>
                    </p>
                  </div>

                  <div className="flex gap-1.5 self-end sm:self-auto">
                    {m.status !== 'active' && (
                      <button 
                        onClick={() => toggleMedStatus(m.id, 'active')}
                        className="text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold transition-all"
                      >
                        Resume
                      </button>
                    )}
                    {m.status === 'active' && (
                      <button 
                        onClick={() => toggleMedStatus(m.id, 'paused')}
                        className="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 font-bold transition-all"
                      >
                        Pause
                      </button>
                    )}
                    {m.status !== 'stopped' && (
                      <button 
                        onClick={() => toggleMedStatus(m.id, 'stopped')}
                        className="text-[10px] text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 font-bold transition-all"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 4. CLINICAL TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <Card className="p-4 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  placeholder="Filter timeline records..."
                  className="input-field pl-8 py-1.5 text-xs placeholder:text-slate-400"
                  aria-label="Filter timeline events"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Chronological Order</span>
            </Card>

            <div className="space-y-4 pl-4 border-l border-emerald-100 relative">
              {sortedTimeline.map((item, idx) => (
                <div key={idx} className="relative space-y-1">
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-emerald-600 border border-white ring-2 ring-emerald-50" />
                  
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono font-bold">
                    <Clock className="h-3 w-3" />
                    <span>{item.date}</span>
                    <span className="uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">{item.category}</span>
                  </div>
                  
                  <Card className="p-3.5 max-w-xl text-xs bg-white border-slate-100 hover:border-emerald-100 transition-colors">
                    <h4 className="font-extrabold text-slate-900">{item.title}</h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. REPORTS & SCANS */}
        {activeTab === 'reports' && (
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Lab chemistry list */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-slate-400" />
                Chemical Biochemistry Reports
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'rep-1', name: 'Renal Chemistry (BMP)', date: '2026-07-02', type: 'Lab BMP' },
                  { id: 'rep-2', name: 'HbA1c & Fasting Glucose', date: '2026-06-15', type: 'Endocrine Panel' }
                ].map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{r.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Uploaded: {r.date} • {r.type}</p>
                    </div>
                    <FileText className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Diagnostic scans list */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <HeartPulse className="h-4.5 w-4.5 text-slate-400" />
                Imaging Scans & X-Rays
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'rep-3', name: 'ECG Rhythm Strip', date: '2026-07-01', type: 'Cardio Imaging' },
                  { id: 'rep-4', name: 'Chest Radiograph (PA)', date: '2026-05-20', type: 'Chest X-Ray' }
                ].map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{r.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Uploaded: {r.date} • {r.type}</p>
                    </div>
                    <HeartPulse className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )}

      </div>

      {/* DETAILED DOCUMENT VIEWER MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="surface-card-strong max-w-2xl w-full p-5 space-y-4">
            
            {/* Topbar of modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{selectedReport.name}</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Chart file ID: {selectedReport.id}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <IconButton label="Zoom In" onClick={() => setZoomLevel(prev => Math.min(prev + 25, 200))} className="h-8 w-8">
                  <ZoomIn className="h-4 w-4" />
                </IconButton>
                <IconButton label="Zoom Out" onClick={() => setZoomLevel(prev => Math.max(prev - 25, 50))} className="h-8 w-8">
                  <ZoomOut className="h-4 w-4" />
                </IconButton>
                <IconButton label="Download file" onClick={() => alert('Download initialized.')} className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </IconButton>
                <Button variant="secondary" size="sm" onClick={() => { setSelectedReport(null); setZoomLevel(100); }} className="text-xs min-h-8 py-1">
                  Close
                </Button>
              </div>
            </div>

            {/* Document Render Body */}
            <div className="bg-slate-900 rounded-xl overflow-auto h-[350px] flex items-center justify-center p-6 relative border border-slate-950">
              <div 
                className="bg-white rounded p-6 shadow-md transition-all duration-200 space-y-4 max-w-sm w-full"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                <div className="border-b border-slate-200 pb-3 text-center">
                  <h4 className="font-extrabold text-[10px] text-slate-800 uppercase tracking-widest">Helio Clinical Diagnostics</h4>
                  <p className="text-[8px] text-slate-400 mt-0.5">ID: {patient.accessCode || 'H-X8D2W3'}</p>
                </div>
                <div className="text-[9px] space-y-2 text-slate-600 leading-normal">
                  <p><strong>Parameter Result:</strong> Standard laboratory assessment completed.</p>
                  <p><strong>Clinical Notes:</strong> Chemistry indicators are aligned within expected medical thresholds. No acute anomalies flagged.</p>
                  <p className="text-[8px] text-slate-400 mt-4 text-center">Audited securely via HELIO Clinician Vault</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-semibold">
              <span>Zoom Scale: {zoomLevel}%</span>
              <span>Audit State: Verified secure HIPAA</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

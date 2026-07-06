import React, { useState, useEffect } from 'react';
import { 
  User, ShieldAlert, HeartPulse, Pill, Clock, FileText, Download, ZoomIn, 
  ZoomOut, ShieldCheck, Mail, Phone, Calendar, Search, Play, HelpCircle, Activity
} from 'lucide-react';
import { Card, Button } from '../design-system';
import { apiRequest } from '../../utils/api';

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

  const [medSummary, setMedSummary] = useState(null);
  const [isLoadingMedSummary, setIsLoadingMedSummary] = useState(false);
  const [guidanceText, setGuidanceText] = useState('');
  const [isSavingGuidance, setIsSavingGuidance] = useState(false);

  const fetchMedSummary = async () => {
    if (!patient?.id) return;
    try {
      setIsLoadingMedSummary(true);
      const res = await apiRequest(`/doctors/patients/${patient.id}/medications`);
      setMedSummary(res);
    } catch (err) {
      console.error('Failed to load patient medications clinical summary:', err);
    } finally {
      setIsLoadingMedSummary(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'medications' && patient?.id) {
      fetchMedSummary();
    }
  }, [activeTab, patient?.id]);

  const handleDiscontinueMed = async (medId) => {
    const confirm = window.confirm('Are you sure you want to permanently discontinue this medication?');
    if (!confirm) return;
    try {
      await apiRequest(`/health/medications/${medId}`, {
        method: 'DELETE'
      });
      fetchMedSummary();
    } catch (err) {
      alert(err.message || 'Failed to discontinue medication.');
    }
  };

  const handleToggleActiveMed = async (medId, currentlyActive) => {
    try {
      await apiRequest(`/health/medications/${medId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentlyActive })
      });
      fetchMedSummary();
    } catch (err) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  const handleSubmitGuidance = async (e) => {
    e.preventDefault();
    if (!guidanceText.trim()) return;
    try {
      setIsSavingGuidance(true);
      if (onAddNote) {
        await onAddNote({
          patientId: patient.id,
          title: 'Medication Care Instruction',
          content: guidanceText,
          category: 'care-plan'
        });
        setGuidanceText('');
        alert('Medication care instruction sent to patient portal.');
      }
    } catch (err) {
      alert(err.message || 'Failed to submit guidance.');
    } finally {
      setIsSavingGuidance(false);
    }
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
          <div className="space-y-6">
            {isLoadingMedSummary ? (
              <Card className="p-12 text-center border-slate-200">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                <p className="text-xs text-slate-500 font-bold">Querying clinical adherence metrics...</p>
              </Card>
            ) : (
              <>
                {/* 1. Clinical Adherence Indicators */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="p-5 border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">7-Day Adherence</span>
                    <p className="text-2xl font-extrabold text-slate-800 mt-2">
                      {medSummary?.adherenceSummary?.['7'] !== undefined ? `${medSummary.adherenceSummary['7']}%` : 'N/A'}
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600" 
                        style={{ width: `${medSummary?.adherenceSummary?.['7'] || 0}%` }} 
                      />
                    </div>
                  </Card>
                  <Card className="p-5 border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">30-Day Adherence</span>
                    <p className="text-2xl font-extrabold text-slate-800 mt-2">
                      {medSummary?.adherenceSummary?.['30'] !== undefined ? `${medSummary.adherenceSummary['30']}%` : 'N/A'}
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-600" 
                        style={{ width: `${medSummary?.adherenceSummary?.['30'] || 0}%` }} 
                      />
                    </div>
                  </Card>
                  <Card className="p-5 border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Logged Doses</span>
                    <p className="text-2xl font-extrabold text-slate-800 mt-2">
                      {medSummary?.adherenceSummary?.totalTaken || 0} / {medSummary?.adherenceSummary?.totalScheduled || 0}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1.5">
                      Taken On Time or Late
                    </span>
                  </Card>
                  <Card className="p-5 border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Skipped / Missed</span>
                    <p className="text-2xl font-extrabold text-rose-600 mt-2">
                      {medSummary?.adherenceSummary?.totalSkipped || 0} / {medSummary?.adherenceSummary?.totalMissed || 0}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1.5">
                      Intended omissions vs overrides
                    </span>
                  </Card>
                </div>

                {/* 2. Active Medications Console */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="h-4.5 w-4.5 text-emerald-600" />
                      Active Schedules & Prescriptions
                    </h3>

                    {medSummary?.activeMedications?.length ? (
                      <div className="space-y-3">
                        {medSummary.activeMedications.map((m) => {
                          const isLowStock = m.quantity !== undefined && m.quantity <= (m.refillThreshold || 5);
                          return (
                            <Card key={m._id} className={`p-4 border-slate-105 transition-all ${m.active === false ? 'opacity-65 bg-slate-50' : ''}`}>
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm">
                                    {m.name} <span className="text-xs text-slate-500 font-medium">({m.genericName || 'Generic'})</span>
                                  </h4>
                                  <p className="text-xs text-slate-650 mt-1">
                                    <strong>{m.dosage}</strong> • {m.form} • {m.frequency}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    Purpose: {m.purpose || 'Not recorded'} • Instructions: {m.foodInstruction || 'None'}
                                  </p>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => handleToggleActiveMed(m._id, m.active)}
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                      m.active === false
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100'
                                        : 'bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100'
                                    }`}
                                  >
                                    {m.active === false ? 'Activate' : 'Suspend'}
                                  </button>
                                  <button
                                    onClick={() => handleDiscontinueMed(m._id)}
                                    className="text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-100"
                                  >
                                    Discontinue
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-105 flex flex-wrap gap-4 text-[10px] font-bold">
                                <span className="text-slate-500">
                                  Times: <strong className="text-slate-700">{(m.times || []).join(', ')}</strong>
                                </span>
                                <span className={isLowStock ? 'text-rose-600' : 'text-slate-500'}>
                                  Stock: <strong>{m.quantity !== undefined ? `${m.quantity} pills` : 'N/A'}</strong> {isLowStock && '⚠️'}
                                </span>
                                <span className="text-slate-500">
                                  Refills: <strong>{m.refillQuantity !== undefined ? m.refillQuantity : 'N/A'}</strong>
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="p-8 text-center border-slate-150">
                        <p className="text-xs text-slate-400 font-bold">No active medications found for this patient.</p>
                      </Card>
                    )}
                  </div>

                  {/* Discontinued / Inactive History */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Discontinued / Historical
                    </h3>
                    <Card className="p-4 border-slate-150 bg-slate-50/55 space-y-3">
                      {medSummary?.inactiveMedications?.length ? (
                        medSummary.inactiveMedications.map((m) => (
                          <div key={m._id} className="text-xs pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                            <h4 className="font-bold text-slate-750">{m.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {m.dosage} • Discontinued on: {new Date(m.updatedAt || m.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 font-medium text-center py-2">No historical prescription changes recorded.</p>
                      )}
                    </Card>
                  </div>
                </div>

                {/* 3. Clinician Direct guidance form */}
                <Card className="p-5 border-emerald-100 bg-emerald-50/20">
                  <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider mb-2">Send Medication Clinical Instruction</h4>
                  <p className="text-[11px] text-emerald-800 leading-normal mb-3">
                    Write customized guidelines, food rules, or warnings below. They will immediately flash on the patient's Medication Dashboard home view.
                  </p>
                  <form onSubmit={handleSubmitGuidance} className="space-y-3">
                    <textarea
                      value={guidanceText}
                      onChange={(e) => setGuidanceText(e.target.value)}
                      placeholder="e.g., Take Metformin exactly 15 minutes after dinner. Avoid drinking grapefruit juice while on Lipinopril."
                      className="w-full text-xs p-3 border border-slate-205 rounded-xl bg-white focus:outline-none focus:border-emerald-500 text-slate-800"
                      rows={2}
                      required
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        type="submit" 
                        disabled={isSavingGuidance || !guidanceText.trim()}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4"
                      >
                        {isSavingGuidance ? 'Sending...' : 'Transmit Guidance'}
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* 4. Intake Logs list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Intake Logs
                  </h3>
                  <Card className="p-0 overflow-hidden border-slate-150">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Log Date</th>
                            <th className="p-3">Medication</th>
                            <th className="p-3">Intake Slot</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Clinical Notes / Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {medSummary?.historyLogs?.length ? (
                            medSummary.historyLogs.slice(0, 10).map((log) => (
                              <tr key={log._id} className="hover:bg-slate-50/50">
                                <td className="p-3 whitespace-nowrap font-medium text-slate-500">
                                  {new Date(log.takenAt || log.createdAt).toLocaleString()}
                                </td>
                                <td className="p-3 font-bold text-slate-800">
                                  {log.medicationId?.name || 'Deleted Medication'}
                                </td>
                                <td className="p-3 text-slate-500">{log.timeSlot}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    log.status?.startsWith('Taken') 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                      : log.status === 'Skipped'
                                      ? 'bg-amber-50 text-amber-800 border-amber-100'
                                      : 'bg-rose-50 text-rose-800 border-rose-100'
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-650 italic">
                                  {log.reason ? `Skipped: ${log.reason}` : ''} {log.note ? `Note: "${log.note}"` : (log.delayMinutes ? `Dose delayed ${log.delayMinutes} mins` : '—')}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 font-bold font-medium">No intake logs recorded.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
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

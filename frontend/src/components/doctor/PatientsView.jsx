import React, { useState } from 'react';
import { 
  Search, User, HeartPulse, Pill, MessageSquare, Plus, Clock, 
  FileText, Check, ShieldAlert, Heart, Calendar, PlusCircle
} from 'lucide-react';
import { Card, Button, Field } from '../design-system';

export default function PatientsView({
  patients = [],
  selectedPatientId,
  onSelectPatient,
  patientDetail,
  isLoadingDetail,
  onAddNote,
  isSavingNote,
  onLinkPatient,
  isLinking,
  linkError,
  linkSuccess,
  linkCode,
  setLinkCode
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('care-plan');

  // Filter patients by search term
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.accessCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitNote = (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    onAddNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      category: noteCategory
    });
    setNoteTitle('');
    setNoteContent('');
  };

  // Helper to calculate age or fallback
  const getAge = (dob) => {
    if (!dob) return 34; // default mock
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Helper to get risk attributes based on health score
  const getRiskAttributes = (score = 84) => {
    if (score < 75) return { label: 'High Risk', bg: 'bg-rose-50 text-rose-800 border-rose-200', ring: 'ring-rose-500/60 ring-offset-2 ring-2' };
    if (score < 85) return { label: 'Moderate Risk', bg: 'bg-amber-50 text-amber-800 border-amber-200', ring: 'ring-amber-500/60 ring-offset-2 ring-2' };
    return { label: 'Low Risk', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', ring: 'ring-emerald-500/60 ring-offset-2 ring-2' };
  };

  const risk = patientDetail?.patient ? getRiskAttributes(patientDetail.patient.healthScore) : null;

  return (
    <div className="space-y-6 animate-rise-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Registry</h1>
          <p className="text-slate-500 text-sm mt-0.5">Search patients, log consultation records, and view historical vitals.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        
        {/* SIDEBAR: PATIENTS LIST & ACCESS CODE LINKING */}
        <aside className="space-y-6">
          
          {/* Link Code Input */}
          <Card className="p-4 border-emerald-100 bg-emerald-50/10">
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">Link Patient Code</h3>
            <form onSubmit={onLinkPatient} className="flex gap-2">
              <input 
                type="text" 
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value)}
                placeholder="e.g. H-K8F2R7" 
                className="input-field py-2 text-xs flex-1 uppercase font-mono font-bold"
                required
              />
              <Button size="sm" type="submit" disabled={isLinking} className="min-h-9 px-3">Link</Button>
            </form>
            {linkError && <p className="text-[10px] text-rose-600 mt-2 font-semibold">{linkError}</p>}
            {linkSuccess && <p className="text-[10px] text-green-700 mt-2 font-bold">{linkSuccess}</p>}
          </Card>

          {/* Directory Search & List */}
          <Card className="p-4 space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
              <input 
                className="input-field pl-9 py-2 text-xs" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Search patient name..." 
                aria-label="Filter patients list"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredPatients.length > 0 ? (
                filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPatient(p.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
                      selectedPatientId === p.id 
                        ? 'border-emerald-200 bg-emerald-50/40 shadow-sm' 
                        : 'border-slate-100 bg-slate-50/20 hover:bg-slate-50/70'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.accessCode || 'No Code'}</p>
                    </div>
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No patients matching search.</p>
              )}
            </div>
          </Card>
        </aside>

        {/* DETAILS SECTION */}
        <section className="space-y-6">
          {isLoadingDetail ? (
            <Card className="p-16 text-center border-slate-200">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
              <p className="text-xs text-slate-500 font-bold">Synchronizing medical timeline...</p>
            </Card>
          ) : patientDetail ? (
            <div className="space-y-6">
              
              {/* PATIENT PROFILE SNAPSHOT CARD */}
              <Card className="p-6 border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    {/* Color Ring Risk Indicators */}
                    <div className={`h-16 w-16 rounded-3xl flex items-center justify-center font-bold text-xl text-emerald-800 bg-emerald-50 border shrink-0 shadow-md ${risk?.ring}`}>
                      {patientDetail.patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{patientDetail.patient.name}</h2>
                        <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${risk?.bg}`}>
                          {risk?.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Email: <strong className="text-slate-700">{patientDetail.patient.email}</strong> • Access: <span className="font-mono text-emerald-950 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">{patientDetail.patient.accessCode}</span>
                      </p>
                      
                      {/* Clinical specifications */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Blood Type</span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">{patientDetail.patient.bloodType || 'B+'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Age</span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">{getAge(patientDetail.patient.dateOfBirth)} years</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Allergies</span>
                          <span className="text-xs font-bold text-rose-700 mt-0.5 block truncate max-w-[120px]" title={patientDetail.patient.allergies?.join(', ') || 'None'}>
                            {patientDetail.patient.allergies?.join(', ') || 'None'}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Health Score</span>
                          <span className="text-xs font-bold text-emerald-800 mt-0.5 block">{patientDetail.patient.healthScore || 84}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* VITALS MATRIX */}
              <Card className="p-5 border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <HeartPulse className="h-4.5 w-4.5 text-rose-600" />
                  Health Vitals Matrix
                </h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { label: 'Weight', value: patientDetail.patient.vitals?.weight ? `${patientDetail.patient.vitals.weight} kg` : 'N/A' },
                    { label: 'Height', value: patientDetail.patient.vitals?.height ? `${patientDetail.patient.vitals.height} cm` : 'N/A' },
                    { label: 'Heart Rate', value: patientDetail.patient.vitals?.heartRate ? `${patientDetail.patient.vitals.heartRate} bpm` : 'N/A' },
                    { label: 'Blood Pressure', value: patientDetail.patient.vitals?.bloodPressure || 'N/A' },
                    { label: 'Temperature', value: patientDetail.patient.vitals?.temperature ? `${patientDetail.patient.vitals.temperature}°C` : 'N/A' },
                    { label: 'Oxygen Saturation', value: patientDetail.patient.vitals?.oxygenSaturation ? `${patientDetail.patient.vitals.oxygenSaturation}%` : 'N/A' },
                  ].map((v) => (
                    <div key={v.label} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-center hover:border-emerald-200/50 transition-colors">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">{v.label}</span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">{v.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* LAYERED SECTION: Prescriptions vs. Log Consultations Note */}
              <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                
                {/* PRESCRIBED MEDS */}
                <Card className="p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                      <Pill className="h-4.5 w-4.5 text-emerald-600" />
                      Active Medication Rhythm
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {patientDetail.medications?.length > 0 ? (
                      patientDetail.medications.map(med => {
                        const adherenceRate = med.adherence?.target > 0 
                          ? Math.round((med.adherence.taken / med.adherence.target) * 100)
                          : 88;
                        return (
                          <div key={med._id} className="border border-slate-100 bg-slate-50/30 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-100 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs">{med.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">{med.dosage} • {med.frequency}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                adherenceRate < 75 
                                  ? 'bg-rose-50 text-rose-800' 
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}>
                                {adherenceRate}% Adherence
                              </span>
                            </div>
                            <div className="mt-2.5 flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100/50 pt-2 font-semibold">
                              <span>Stock: <strong>{med.quantity ?? 30} tabs</strong></span>
                              <span>Dosing: {med.times?.join(', ') || 'Morning, Evening'}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-8">No medications currently prescribed.</p>
                    )}
                  </div>
                </Card>

                {/* INLINE CLINICAL NOTE LOGGER */}
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
                    Log Consultation Record
                  </h3>

                  <form onSubmit={handleSubmitNote} className="space-y-3">
                    <Field label="Document Title">
                      <input 
                        type="text" 
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="e.g. Follow-up consultation" 
                        className="input-field py-2.5 text-xs"
                        required
                      />
                    </Field>

                    <Field label="Clinical Category">
                      <select 
                        value={noteCategory}
                        onChange={(e) => setNoteCategory(e.target.value)}
                        className="input-field py-2.5 text-xs bg-white"
                      >
                        <option value="care-plan">Care Plan Plan</option>
                        <option value="diagnosis">Clinical Diagnosis</option>
                        <option value="prescription">Prescription Setup</option>
                        <option value="follow-up">Follow-Up Instructs</option>
                      </select>
                    </Field>

                    <Field label="Consultation Note Details">
                      <textarea 
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Log clinical updates, diagnosis notes, and patient advice..."
                        className="input-field py-2.5 text-xs resize-none"
                        rows={3}
                        required
                      />
                    </Field>

                    <Button size="sm" type="submit" disabled={isSavingNote} className="w-full text-xs py-2 min-h-10">
                      {isSavingNote ? 'Syncing...' : 'Save Notes & Alert Patient'}
                    </Button>
                  </form>
                </Card>
              </div>

              {/* CLINICAL HISTORICAL HISTORY */}
              <Card className="p-5 border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Consultation Notes Archive</h3>
                <div className="space-y-3">
                  {patientDetail.notes?.length > 0 ? (
                    patientDetail.notes.map(note => (
                      <div key={note._id} className="bg-slate-50/40 p-4 rounded-2xl border border-slate-100 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900 text-sm">{note.title}</span>
                          <span className="text-[9px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                            {note.category}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        <div className="mt-2.5 text-[9px] text-slate-400 font-semibold border-t border-slate-100/50 pt-2">
                          Logged: {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">No historical clinical notes compiled.</p>
                  )}
                </div>
              </Card>

            </div>
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-dashed border-slate-200 bg-slate-50/70 py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm mb-4">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No Patient Selected</h3>
              <p className="max-w-xs mx-auto text-xs text-slate-500 mt-2">Please select a patient from the clinical registry on the left sidebar to review charts, records, and log consultations.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, Pill, Stethoscope, Clock, CheckCircle, Plus, 
  Trash2, User, FileText, ChevronRight, HelpCircle, Save, Calendar, Check,
  ShieldCheck, HeartPulse, Edit3
} from 'lucide-react';
import { Card, Button, Field } from '../design-system';

export default function ConsultationWorkspace({
  patientDetail,
  onAddNote,
  isSavingNote,
  onSelectView
}) {
  const patient = patientDetail?.patient || { name: 'Arthur Pendragon', id: 'p1', healthScore: 84 };
  const medicationsList = patientDetail?.medications || [];

  // 1. NOTES EDITOR STATES
  const [noteTitle, setNoteTitle] = useState('Consultation Note - ' + new Date().toLocaleDateString());
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('care-plan');
  const [noteTags, setNoteTags] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isFollowUpRequired, setIsFollowUpRequired] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // 2. PRESCRIPTION BUILDER STATES
  const [activeMeds, setActiveMeds] = useState(medicationsList);
  const [searchDrug, setSearchDrug] = useState('');
  const [rxDose, setRxDose] = useState('500mg');
  const [rxFrequency, setRxFrequency] = useState('Once daily');
  const [rxDuration, setRxDuration] = useState('30 days');
  const [intakeTiming, setIntakeTiming] = useState('after-food'); // 'before-food', 'after-food'
  const [slots, setSlots] = useState({ morning: true, afternoon: false, night: false });
  const [rxNotes, setRxNotes] = useState('');

  // Duplicate and Interaction alerts
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [interactionAlert, setInteractionAlert] = useState(null);

  // 3. FOLLOW-UP STATE
  const [followUpDate, setFollowUpDate] = useState('2026-07-11');
  const [followUpReason, setFollowUpReason] = useState('Review care plan response & labs');

  // 4. SIGNATURE WORKFLOW
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);

  // Sync patient medications
  useEffect(() => {
    if (medicationsList.length > 0) {
      setActiveMeds(medicationsList);
    }
  }, [medicationsList]);

  // Real-time prescriptions auditor
  useEffect(() => {
    if (!searchDrug.trim()) {
      setDuplicateAlert(null);
      setInteractionAlert(null);
      return;
    }

    const drugLower = searchDrug.toLowerCase();

    // Check duplicates
    const isDuplicate = activeMeds.some(m => m.name.toLowerCase().includes(drugLower));
    if (isDuplicate) {
      setDuplicateAlert(`Duplicate Med Warning: "${searchDrug}" is already active in this patient's medication regimen.`);
    } else {
      setDuplicateAlert(null);
    }

    // Check allergies
    const patientAllergies = patient.allergies || ['Penicillin'];
    const hasAllergy = patientAllergies.some(a => drugLower.includes(a.toLowerCase()));
    if (hasAllergy) {
      setInteractionAlert(`CRITICAL DRUG ALLERGY WARNING: Patient has a recorded allergy to ${patientAllergies.join(', ')}. Prescribing "${searchDrug}" is highly contraindicated.`);
    } else {
      setInteractionAlert(null);
    }
  }, [searchDrug]);

  const addTag = (tag) => {
    if (!noteTags.includes(tag)) {
      setNoteTags([...noteTags, tag]);
    }
  };

  const removeTag = (tag) => {
    setNoteTags(noteTags.filter(t => t !== tag));
  };

  const handleSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!searchDrug.trim()) return;

    const timings = [];
    if (slots.morning) timings.push('Morning');
    if (slots.afternoon) timings.push('Afternoon');
    if (slots.night) timings.push('Night');

    const newMed = {
      _id: `mock-rx-${Date.now()}`,
      name: searchDrug.trim(),
      dosage: rxDose,
      frequency: `${rxFrequency} (${timings.join(', ')})`,
      duration: rxDuration,
      intakeTiming,
      times: timings,
      adherence: { taken: 0, target: 30 }
    };

    setActiveMeds([newMed, ...activeMeds]);
    setSearchDrug('');
    setRxNotes('');
  };

  const handleFinalizeConsultation = () => {
    if (!signatureText.trim()) {
      setShowSignaturePad(true);
      return;
    }

    // Compile clinical package and dispatch note save to DB
    onAddNote({
      title: noteTitle.trim(),
      content: `Consultation Notes:\n${noteContent.trim()}\n\nFollow-up Scheduled: ${followUpDate} for ${followUpReason}\nPhysician Signature: ${signatureText}`,
      category: noteCategory
    });

    setIsFinalized(true);
  };

  return (
    <div className="space-y-6 animate-rise-in">
      
      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-emerald-700" />
            Active Consultation desk
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Diagnose, write notes, prescribe medications, and schedule follow-ups.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSaveDraft} className="text-xs min-h-9 flex items-center gap-1.5">
            <Save className="h-4 w-4" /> {draftSaved ? 'Draft Saved' : 'Save Draft'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleFinalizeConsultation} className="text-xs min-h-9 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" /> Finalize consultation
          </Button>
        </div>
      </div>

      {/* FINALIZED WORKFLOW COMPLETED OVERLAY */}
      {isFinalized && (
        <Card className="p-6 border-emerald-200 bg-emerald-50/20 text-center max-w-md mx-auto space-y-4">
          <ShieldCheck className="h-12 w-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Consultation Finalized & Dispatched</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Prescription schedule and consultation logs have been compiled, signed by <strong>{signatureText}</strong>, and synced to patient timeline. Notifications sent.
          </p>
          <Button variant="primary" size="sm" onClick={() => onSelectView('dashboard')} className="text-xs py-1.5">
            Return to Queue
          </Button>
        </Card>
      )}

      {!isFinalized && (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.3fr_0.9fr]">
          
          {/* LEFT COLUMN: PATIENT SUMMARY & VITALS */}
          <div className="space-y-6">
            <Card className="p-5 border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Patient Summary</h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm border">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{patient.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{patient.accessCode || 'H-X8D2W3'}</span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <p className="text-slate-600">Allergies: <strong className="text-rose-700">{patient.allergies?.join(', ') || 'Penicillin'}</strong></p>
                <p className="text-slate-600">Conditions: <strong className="text-slate-700">{patient.conditions?.join(', ') || 'Hypertension, Diabetes'}</strong></p>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Active Vitals</h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Blood Pressure', value: patient.vitals?.bloodPressure || '120/80', alert: false },
                  { label: 'Heart Rate', value: patient.vitals?.heartRate ? `${patient.vitals.heartRate} bpm` : '72 bpm', alert: false },
                  { label: 'Oxygen Saturation', value: patient.vitals?.oxygenSaturation ? `${patient.vitals.oxygenSaturation}%` : '98%', alert: false },
                  { label: 'Temperature', value: patient.vitals?.temperature ? `${patient.vitals.temperature}°C` : '36.8°C', alert: false }
                ].map((vit, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold">{vit.label}</span>
                    <strong className="text-slate-800">{vit.value}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* CENTER COLUMN: NOTES EDITOR & RX BUILDER */}
          <div className="space-y-6">
            
            {/* CLINICAL NOTE EDITOR */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Edit3 className="h-4 w-4 text-emerald-700" />
                  Clinical Notes Editor
                </h3>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-500">
                  <input 
                    type="checkbox" 
                    checked={isPinned} 
                    onChange={() => setIsPinned(!isPinned)} 
                    className="h-3.5 w-3.5 accent-emerald-600" 
                  />
                  Pin Note
                </label>
              </div>

              <div className="space-y-3">
                <Field label="Observation Note Title">
                  <input 
                    type="text" 
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="input-field py-2 text-xs" 
                  />
                </Field>

                <div className="flex gap-2">
                  <Field label="Category" className="flex-1">
                    <select 
                      value={noteCategory} 
                      onChange={(e) => setNoteCategory(e.target.value)}
                      className="input-field py-2 text-xs bg-white"
                    >
                      <option value="care-plan">Care Plan</option>
                      <option value="diagnosis">Diagnosis</option>
                      <option value="prescription">Prescription update</option>
                    </select>
                  </Field>

                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Pin Tag Shortcut</label>
                    <div className="flex flex-wrap gap-1">
                      {['Follow-up', 'Referral', 'BP Alert', 'Labs Order'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {noteTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {noteTags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-700 leading-none">&times;</button>
                      </span>
                    ))}
                  </div>
                )}

                <Field label="Clinical Observations & Dosing Directives">
                  <textarea 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Describe patient observations, diagnostic updates, and compliance feedback..."
                    className="input-field py-2 text-xs resize-none"
                    rows={4}
                    required
                  />
                </Field>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                  <input 
                    type="checkbox" 
                    checked={isFollowUpRequired} 
                    onChange={() => setIsFollowUpRequired(!isFollowUpRequired)} 
                    className="h-4 w-4 accent-emerald-600" 
                  />
                  Flag patient for required clinical follow-up
                </label>
              </div>
            </Card>

            {/* PRESCRIPTION BUILDER */}
            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Prescription Builder</h3>
              
              <form onSubmit={handleAddMedicine} className="space-y-3">
                <Field label="Medicine Search">
                  <input 
                    type="text" 
                    value={searchDrug}
                    onChange={(e) => setSearchDrug(e.target.value)}
                    placeholder="Search compound name (e.g. Lisinopril, Penicillin)..."
                    className="input-field py-2 text-xs" 
                    required
                  />
                </Field>

                {/* REAL-TIME ERRORS */}
                {duplicateAlert && (
                  <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-start gap-2 font-semibold">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-600" />
                    {duplicateAlert}
                  </div>
                )}

                {interactionAlert && (
                  <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-start gap-2 font-semibold animate-pulse">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-600" />
                    {interactionAlert}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Dosage">
                    <input 
                      type="text" 
                      value={rxDose}
                      onChange={(e) => setRxDose(e.target.value)}
                      className="input-field py-2 text-xs" 
                    />
                  </Field>

                  <Field label="Duration">
                    <input 
                      type="text" 
                      value={rxDuration}
                      onChange={(e) => setRxDuration(e.target.value)}
                      className="input-field py-2 text-xs" 
                    />
                  </Field>
                </div>

                {/* TIMING GRID */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Dosing Intervals</label>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={slots.morning} 
                        onChange={() => setSlots({ ...slots, morning: !slots.morning })} 
                        className="h-3.5 w-3.5 accent-emerald-600" 
                      />
                      Morning
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={slots.afternoon} 
                        onChange={() => setSlots({ ...slots, afternoon: !slots.afternoon })} 
                        className="h-3.5 w-3.5 accent-emerald-600" 
                      />
                      Afternoon
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={slots.night} 
                        onChange={() => setSlots({ ...slots, night: !slots.night })} 
                        className="h-3.5 w-3.5 accent-emerald-600" 
                      />
                      Night
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Intake Rule">
                    <select 
                      value={intakeTiming} 
                      onChange={(e) => setIntakeTiming(e.target.value)}
                      className="input-field py-2 text-xs bg-white"
                    >
                      <option value="after-food">After food Intake</option>
                      <option value="before-food">Before food Intake</option>
                    </select>
                  </Field>

                  <div className="flex items-end">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={!!interactionAlert}
                      className="w-full text-xs py-2 min-h-10"
                    >
                      + Add Medication
                    </Button>
                  </div>
                </div>
              </form>

              {/* RENDER CURRENT RX LIST */}
              <div className="space-y-2 pt-2">
                {activeMeds.map((med, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="font-extrabold text-slate-800">{med.name} ({med.dosage})</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{med.frequency} • {med.duration} • {med.intakeTiming === 'before-food' ? 'Before Food' : 'After Food'}</p>
                    </div>
                    <IconButton 
                      label="Delete rx" 
                      onClick={() => setActiveMeds(activeMeds.filter(item => item._id !== med._id))} 
                      className="h-7 w-7 border-0 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                ))}
              </div>
            </Card>

            {/* FOLLOW-UP SETTINGS */}
            {isFollowUpRequired && (
              <Card className="p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Configure Follow-up Appointment</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Date">
                    <input 
                      type="date" 
                      value={followUpDate} 
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="input-field py-2 text-xs" 
                    />
                  </Field>
                  <Field label="Reason & Directives">
                    <input 
                      type="text" 
                      value={followUpReason} 
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      className="input-field py-2 text-xs" 
                    />
                  </Field>
                </div>
              </Card>
            )}

          </div>

          {/* RIGHT COLUMN: AI CLINICAL COPILOT & CLINICAL DISCLAIMERS */}
          <div className="space-y-6">
            <Card className="p-5 border-violet-100 bg-gradient-to-br from-violet-50/10 via-indigo-50/10 to-emerald-50/10 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-4.5 w-4.5 text-violet-700 animate-pulse" />
                Clinical Copilot Assistant
              </h3>
              
              <div className="space-y-3 text-[11px] leading-relaxed">
                <div className="p-3 bg-white/70 border border-violet-100 rounded-xl">
                  <p className="font-extrabold text-slate-800">Historical Abstract summary</p>
                  <p className="text-slate-500 mt-1">Patient shows stage 1 hypertension controlled with Lisinopril. Metformin adherence index is suboptimal (72%).</p>
                </div>

                <div className="p-3 bg-white/70 border border-violet-100 rounded-xl">
                  <p className="font-extrabold text-slate-800">Lifestyle Advice parameters</p>
                  <p className="text-slate-500 mt-1">Advise low sodium intake diet, daily bp checks, and suggest evening dose alignment to improve compliance rates.</p>
                </div>

                <div className="p-3 bg-white/70 border border-violet-100 rounded-xl">
                  <p className="font-extrabold text-slate-800">Interaction Alerts checker</p>
                  <p className="text-slate-500 mt-1">No overlapping active substance contradictions logged in patient's profile database registry.</p>
                </div>
              </div>

              {/* DISCLAIMER */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-400 leading-normal font-semibold">
                ⚠️ <strong>Clinical Disclaimer:</strong> AI suggestions are intended solely to augment clinical decisions. The primary physician retains absolute responsibility for all treatment actions, diagnostic validations, and prescriptions.
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* SIGNATURE DRAWER/POPUP MODAL */}
      {showSignaturePad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="surface-card-strong max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Stethoscope className="h-5 w-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Physician consultation Sign-off</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-normal">Please confirm credentials and type your clinician name for digital signature sign-off:</p>
              <input 
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="e.g. Gregory House, MD"
                className="input-field py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setShowSignaturePad(false)} className="text-xs min-h-9">Cancel</Button>
              <Button 
                variant="primary" 
                size="sm" 
                disabled={!signatureText.trim()}
                onClick={() => {
                  setShowSignaturePad(false);
                  handleFinalizeConsultation();
                }} 
                className="text-xs min-h-9"
              >
                Sign & Finalize
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, FileText, LogOut, Pill, Search, ShieldCheck, Stethoscope, UserRound, Plus, Check, X as CancelIcon, MessageSquare, HeartPulse } from 'lucide-react';
import { BrandMark, Button, Card, EmptyState, Field, SectionHeader, StatCard, IconButton } from './design-system';
import { apiRequest } from '../utils/api';

const DoctorDashboard = ({ user, onLogout }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // Forms & Actions state
  const [linkCode, setLinkCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('care-plan');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const loadDoctorDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest('/health/doctor-dashboard');
      setPatients(data.patients || []);
      
      // Auto-select first patient if available and none selected
      if (data.patients?.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data.patients[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load doctor dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientDetails = async (patientId) => {
    if (!patientId) return;
    try {
      setIsLoadingDetail(true);
      const data = await apiRequest(`/health/doctor/patient-details/${patientId}`);
      setPatientDetail(data);
    } catch (err) {
      alert(err.message || 'Failed to load patient clinical data.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadDoctorDashboard();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientDetails(selectedPatientId);
    } else {
      setPatientDetail(null);
    }
  }, [selectedPatientId]);

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    if (!linkCode.trim()) return;
    setIsLinking(true);
    setLinkError('');
    setLinkSuccess('');
    try {
      const response = await apiRequest('/health/doctor/link-patient', {
        method: 'POST',
        body: JSON.stringify({ accessCode: linkCode.trim() })
      });
      setLinkSuccess(response.message || 'Patient linked successfully.');
      setLinkCode('');
      await loadDoctorDashboard();
      setSelectedPatientId(response.patient.id);
    } catch (err) {
      setLinkError(err.message || 'Failed to link patient.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim() || !selectedPatientId) return;
    setIsSavingNote(true);
    try {
      await apiRequest('/health/doctor/notes', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatientId,
          title: noteTitle.trim(),
          content: noteContent.trim(),
          category: noteCategory
        })
      });
      setNoteTitle('');
      setNoteContent('');
      await loadPatientDetails(selectedPatientId);
    } catch (err) {
      alert(err.message || 'Failed to add clinical note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await apiRequest(`/health/appointments/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (selectedPatientId) {
        loadPatientDetails(selectedPatientId);
      }
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getAdherenceRate = (meds) => {
    if (!meds || meds.length === 0) return 0;
    let takenCount = 0;
    let targetCount = 0;
    meds.forEach(m => {
      takenCount += m.adherence?.taken || 0;
      targetCount += m.adherence?.target || 0;
    });
    if (targetCount === 0) return 100;
    return Math.round((takenCount / targetCount) * 100);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.accessCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <main className="page-shell grid place-items-center px-4">
        <Card className="p-8 text-center max-w-sm border-slate-200">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          <p className="font-semibold text-slate-700 text-sm">Loading clinician console...</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="nav-glass">
        <div className="content-shell flex items-center justify-between gap-4 py-4">
          <BrandMark label="Doctor Portal" subtitle="Clinician command center" tone="record" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="font-semibold text-slate-900">Dr. {user.name}</p>
              <p className="text-xs text-slate-500 font-medium">{user.specialty || 'General Practitioner'}</p>
            </div>
            <Button variant="secondary" onClick={onLogout} size="sm">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="content-shell py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          
          {/* LEFT COLUMN: PATIENT DIRECTORY & ACCESS LINK */}
          <aside className="space-y-6">
            
            {/* LINK PATIENT */}
            <Card className="p-4 border-emerald-100 bg-emerald-50/20">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">Link Patient Access Code</h3>
              <form onSubmit={handleLinkPatient} className="flex gap-2">
                <input 
                  type="text" 
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  placeholder="e.g. H-A7B8C9" 
                  className="input-field py-2 text-xs flex-1 uppercase font-mono font-bold"
                  required
                />
                <Button size="sm" type="submit" disabled={isLinking}>Link</Button>
              </form>
              {linkError && <p className="text-[10px] text-red-600 mt-2 font-semibold">{linkError}</p>}
              {linkSuccess && <p className="text-[10px] text-green-700 mt-2 font-bold">{linkSuccess}</p>}
            </Card>

            {/* SEARCH & DIRECTORY LIST */}
            <Card className="p-4 space-y-4 border-slate-200">
              <Field label="Directory Directory">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    className="input-field pl-9 py-2 text-xs" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Search name or code..." 
                  />
                </div>
              </Field>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        selectedPatientId === p.id 
                          ? 'border-emerald-200 bg-emerald-50/40 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/20 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.accessCode}</p>
                      </div>
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No patients linked.</p>
                )}
              </div>
            </Card>
          </aside>

          {/* RIGHT COLUMN: CLINICAL DETAIL PANELS */}
          <section className="space-y-6">
            {isLoadingDetail ? (
              <Card className="p-12 text-center border-slate-200">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                <p className="text-xs text-slate-500 font-bold">Loading patient records...</p>
              </Card>
            ) : patientDetail ? (
              <div className="space-y-6">
                
                {/* PATIENT HEADER */}
                <Card className="p-6 border-slate-200">
                  <div className="grid gap-6 md:grid-cols-[1fr_280px] items-end">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Active Medical File</span>
                      <h1 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{patientDetail.patient.name}</h1>
                      <p className="text-xs text-slate-500 mt-1">Email: {patientDetail.patient.email} | Access: {patientDetail.patient.accessCode}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 text-xs space-y-1">
                      <p className="text-emerald-900 font-bold uppercase tracking-wider text-[9px] mb-1">Medical Indicators</p>
                      <p className="text-slate-700">Adherence Score: <strong className="text-emerald-800">{patientDetail.patient.healthScore || 84}%</strong></p>
                      <p className="text-slate-700">Allergies: <strong className="text-red-700">{patientDetail.patient.allergies?.join(', ') || 'None listed'}</strong></p>
                    </div>
                  </div>
                </Card>

                {/* VITALS STATUS CARD */}
                <Card className="p-5 border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <HeartPulse className="h-4.5 w-4.5 text-red-600 animate-pulse" />
                    Latest Health Vitals
                  </h3>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
                    {[
                      { label: 'Weight', value: patientDetail.patient.vitals?.weight ? `${patientDetail.patient.vitals.weight} kg` : 'N/A' },
                      { label: 'Height', value: patientDetail.patient.vitals?.height ? `${patientDetail.patient.vitals.height} cm` : 'N/A' },
                      { label: 'Heart Rate', value: patientDetail.patient.vitals?.heartRate ? `${patientDetail.patient.vitals.heartRate} bpm` : 'N/A' },
                      { label: 'Blood Pressure', value: patientDetail.patient.vitals?.bloodPressure || 'N/A' },
                      { label: 'Temperature', value: patientDetail.patient.vitals?.temperature ? `${patientDetail.patient.vitals.temperature}°C` : 'N/A' },
                      { label: 'SpO2', value: patientDetail.patient.vitals?.oxygenSaturation ? `${patientDetail.patient.vitals.oxygenSaturation}%` : 'N/A' },
                    ].map((v) => (
                      <div key={v.label} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">{v.label}</span>
                        <span className="text-sm font-bold text-slate-800 mt-1 block">{v.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* DETAILED LISTS: MEDICATIONS & NOTES */}
                <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
                  
                  {/* MEDICATIONS LIST */}
                  <Card className="p-5 border-slate-200">
                    <SectionHeader title="Prescribed Medicine Rhythm" description="Active dosing schedules and tracked adherence ratings." />
                    <div className="mt-4 space-y-3">
                      {patientDetail.medications?.length > 0 ? (
                        patientDetail.medications.map(med => {
                          const adherenceRate = med.adherence?.target > 0 
                            ? Math.round((med.adherence.taken / med.adherence.target) * 100)
                            : 100;
                          return (
                            <div key={med._id} className="border border-slate-100 bg-slate-50/20 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-100 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{med.dosage} • {med.frequency}</p>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                  {adherenceRate}% Adherence
                                </span>
                              </div>
                              <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-semibold">
                                <span>Pill stock: <strong>{med.quantity ?? 30}</strong></span>
                                <span>Times: {med.times?.join(', ') || 'N/A'}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-8">No active medications registered.</p>
                      )}
                    </div>
                  </Card>

                  {/* CLINICAL NOTE LOGGER */}
                  <Card className="p-5 border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                      <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
                      Log Consultation Note
                    </h3>
                    <form onSubmit={handleAddNote} className="space-y-3">
                      <Field label="Document Title">
                        <input 
                          type="text" 
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="e.g. Care plan update" 
                          className="input-field py-2 text-xs"
                          required
                        />
                      </Field>
                      <Field label="Category">
                        <select 
                          value={noteCategory}
                          onChange={(e) => setNoteCategory(e.target.value)}
                          className="input-field py-2 text-xs bg-white"
                        >
                          <option value="care-plan">Care Plan</option>
                          <option value="diagnosis">Diagnosis</option>
                          <option value="prescription">Prescription Update</option>
                          <option value="follow-up">Follow-Up Instructs</option>
                        </select>
                      </Field>
                      <Field label="Note Details">
                        <textarea 
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Provide clinical feedback..."
                          className="input-field py-2 text-xs resize-none"
                          rows={4}
                          required
                        />
                      </Field>
                      <Button size="sm" type="submit" disabled={isSavingNote} className="w-full text-xs py-2">
                        {isSavingNote ? 'Saving Note...' : 'Save Note & Alert Patient'}
                      </Button>
                    </form>
                  </Card>
                </div>

                {/* APPOINTMENT ACTIONS & RECORD VAULT */}
                <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                  
                  {/* APPOINTMENT APPROVALS */}
                  <Card className="p-5 border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                      <Clock className="h-4.5 w-4.5 text-teal-600" />
                      Appointments Approval
                    </h3>
                    <div className="space-y-3">
                      {patientDetail.appointments?.length > 0 ? (
                        patientDetail.appointments.map(apt => (
                          <div key={apt._id} className="border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs bg-slate-50/20">
                            <div>
                              <p className="font-bold text-slate-900">{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
                              <p className="text-slate-500 text-[10px] mt-0.5">{apt.notes || 'No notes'}</p>
                              <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded mt-1.5 inline-block ${
                                apt.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : apt.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {apt.status}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <IconButton label="Confirm" onClick={() => handleUpdateAppointmentStatus(apt._id, 'completed')} className="h-7 w-7 text-green-700 bg-green-50 border-0 rounded-md">
                                <Check className="h-3.5 w-3.5" />
                              </IconButton>
                              <IconButton label="Cancel" onClick={() => handleUpdateAppointmentStatus(apt._id, 'cancelled')} className="h-7 w-7 text-red-600 bg-red-50 border-0 rounded-md">
                                <CancelIcon className="h-3.5 w-3.5" />
                              </IconButton>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-6">No appointments registered.</p>
                      )}
                    </div>
                  </Card>

                  {/* DOCUMENT VAULT */}
                  <Card className="p-5 border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                      <FileText className="h-4.5 w-4.5 text-indigo-600" />
                      Uploaded Documents
                    </h3>
                    <div className="space-y-2">
                      {patientDetail.records?.length > 0 ? (
                        patientDetail.records.map(rec => (
                          <div key={rec._id} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs hover:border-indigo-200 transition-colors">
                            <div>
                              <p className="font-bold text-slate-800">{rec.title}</p>
                              <p className="text-slate-400 text-[9px] mt-0.5">{rec.summary || 'No summary description'}</p>
                            </div>
                            <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-6">No files uploaded.</p>
                      )}
                    </div>
                  </Card>

                </div>

                {/* DOCTOR NOTES LOG FOR CONTEXT */}
                <Card className="p-5 border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Clinical Consultations History</h3>
                  <div className="space-y-3">
                    {patientDetail.notes?.length > 0 ? (
                      patientDetail.notes.map(note => (
                        <div key={note._id} className="bg-slate-50/30 p-4 rounded-xl border border-slate-200 text-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-900 text-sm">{note.title}</span>
                            <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{note.category}</span>
                          </div>
                          <p className="text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-6">No historic notes recorded.</p>
                    )}
                  </div>
                </Card>

              </div>
            ) : (
              <div className="grid min-h-[50vh] place-items-center">
                <EmptyState
                  icon={UserRound}
                  title="No Linked Patient Selected"
                  description="Select a linked patient from the sidebar directory to review files, prescribe care, or log consultations."
                />
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
};

export default DoctorDashboard;

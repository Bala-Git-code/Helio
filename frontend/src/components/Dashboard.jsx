import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  Home,
  Info,
  MapPin,
  MessageCircle,
  Pill,
  Plus,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  Trash2,
  TrendingUp,
  User,
  HeartPulse,
  Copy,
  Check
} from 'lucide-react';
import SuccessNotification from './SuccessNotification';
import MedicineReminder from './MedicineReminder';
import AppointmentBooking from './AppointmentBooking';
import ProfileModal from './ProfileModal';
import ChatBot from './ChatBot';
import AboutModal from './AboutModal';
import MedicalRecordsModal from './MedicalRecordsModal';
import AppointmentSummaryModal from './AppointmentSummaryModal';
import { apiRequest } from '../utils/api';
import { BrandMark, Button, Card, EmptyState, IconButton, SectionHeader, StatCard, Field } from './design-system';

const Dashboard = ({
  user,
  onUpdateUser,
  onGoHome,
  showSuccessNotification,
  onNotificationDismiss,
}) => {
  const [careData, setCareData] = useState({ profile: {}, medications: [], appointments: [], records: [], notes: [] });
  const [isLoadingCareData, setIsLoadingCareData] = useState(true);
  const [careError, setCareError] = useState('');
  
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMedicalRecords, setShowMedicalRecords] = useState(false);
  const [showAppointmentSummary, setShowAppointmentSummary] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Interactive feature states
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitalsInput, setVitalsInput] = useState({
    weight: '', height: '', heartRate: '', bloodPressure: '', temperature: '', oxygenSaturation: ''
  });
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyInput, setFamilyInput] = useState({ name: '', relationship: 'spouse', phone: '' });
  
  const [isAlerting, setIsAlerting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [sosSuccess, setSosSuccess] = useState('');
  const [showNotification, setShowNotification] = useState(showSuccessNotification);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadCareData = async () => {
    try {
      setIsLoadingCareData(true);
      const data = await apiRequest('/health/dashboard');
      setCareData(data);
    } catch (error) {
      setCareError(error.message || 'Unable to load your health insights right now.');
    } finally {
      setIsLoadingCareData(false);
    }
  };

  useEffect(() => {
    if (user?.email) loadCareData();
  }, [user]);

  useEffect(() => {
    setShowNotification(showSuccessNotification);
  }, [showSuccessNotification]);

  useEffect(() => {
    if (!showNotification) return undefined;
    const timer = setTimeout(() => {
      setShowNotification(false);
      onNotificationDismiss?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [showNotification, onNotificationDismiss]);

  useEffect(() => {
    let timer;
    if (isAlerting && countdown > 0) {
      timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    } else if (isAlerting && countdown === 0) {
      triggerSOS();
    }
    return () => clearTimeout(timer);
  }, [isAlerting, countdown]);

  const triggerSOS = () => {
    setIsAlerting(false);
    setCountdown(10);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          sendSOSRequest(latitude, longitude);
        },
        async (err) => {
          console.warn('Geolocation denied or failed. Sending SOS without coordinates.');
          sendSOSRequest(null, null);
        }
      );
    } else {
      sendSOSRequest(null, null);
    }
  };

  const sendSOSRequest = async (latitude, longitude) => {
    try {
      const response = await apiRequest('/health/sos', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude })
      });
      setSosSuccess(`Smart SOS alert dispatched to emergency contact ${response.contactName}!`);
      setTimeout(() => setSosSuccess(''), 6000);
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to dispatch SOS alerts. Call emergency services directly!');
    }
  };

  const handleAddMedicine = async (medInfo) => {
    try {
      await apiRequest('/health/medications', {
        method: 'POST',
        body: JSON.stringify(medInfo),
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to add medication.');
    }
  };

  const handleDeleteMedicine = async (medId) => {
    if (!window.confirm('Are you sure you want to remove this medication schedule?')) return;
    try {
      await apiRequest(`/health/medications/${medId}`, {
        method: 'DELETE',
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to delete medication.');
    }
  };

  const handleTakeDose = async (medId, timeSlot) => {
    try {
      await apiRequest(`/health/medications/${medId}/take`, {
        method: 'POST',
        body: JSON.stringify({ timeSlot })
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to record dose intake.');
    }
  };

  const handleRefillMed = async (medId) => {
    const amount = window.prompt('Enter number of pills to add (default is 30):', '30');
    if (amount === null) return; // cancelled
    try {
      await apiRequest(`/health/medications/${medId}/refill`, {
        method: 'POST',
        body: JSON.stringify({ refillAmount: parseInt(amount, 10) || 30 })
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Refill failed.');
    }
  };

  const handleAddAppointment = async (aptInfo) => {
    try {
      await apiRequest('/health/appointments', {
        method: 'POST',
        body: JSON.stringify(aptInfo),
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to schedule appointment.');
    }
  };

  const handleDeleteAppointment = async (aptId) => {
    if (!window.confirm('Cancel this scheduled appointment reminder?')) return;
    try {
      await apiRequest(`/health/appointments/${aptId}`, {
        method: 'DELETE',
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  const handleSaveAppointmentSummary = async (summaryObj) => {
    try {
      await apiRequest('/health/records', {
        method: 'POST',
        body: JSON.stringify({
          type: 'summary',
          title: `AI prep: ${summaryObj.doctorName}`,
          summary: summaryObj.summary,
        })
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to save summary.');
    }
  };

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/health/profile/vitals', {
        method: 'POST',
        body: JSON.stringify(vitalsInput)
      });
      setShowVitalsForm(false);
      setVitalsInput({ weight: '', height: '', heartRate: '', bloodPressure: '', temperature: '', oxygenSaturation: '' });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to update vitals.');
    }
  };

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    try {
      const currentFamily = careData.profile?.familyMembers || [];
      const updatedFamily = [...currentFamily, familyInput];
      
      await apiRequest('/health/profile', {
        method: 'POST',
        body: JSON.stringify({ familyMembers: updatedFamily })
      });
      
      setShowFamilyForm(false);
      setFamilyInput({ name: '', relationship: 'spouse', phone: '' });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to save family profile contact.');
    }
  };

  const handleRemoveFamilyMember = async (index) => {
    if (!window.confirm('Remove this family profile from coordinates?')) return;
    try {
      const updatedFamily = careData.profile.familyMembers.filter((_, i) => i !== index);
      await apiRequest('/health/profile', {
        method: 'POST',
        body: JSON.stringify({ familyMembers: updatedFamily })
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to remove.');
    }
  };

  const copyAccessCode = () => {
    if (!careData.profile?.accessCode) return;
    navigator.clipboard.writeText(careData.profile.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Computation logic
  const effectiveMedicines = careData.medications || [];
  const effectiveAppointments = careData.appointments || [];

  const getTodaysMedicines = () => {
    return effectiveMedicines.filter((med) => med.active !== false);
  };

  const getUpcomingMedicine = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    for (const med of getTodaysMedicines()) {
      for (const time of med.times || []) {
        if (time > currentTime) return { medicine: med, time };
      }
    }
    return null;
  };

  const getUpcomingAppointment = () => {
    const today = new Date().toDateString();
    return [...effectiveAppointments]
      .filter((apt) => apt.date && new Date(apt.date).toDateString() >= today)
      .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())[0];
  };

  const todaysMedicines = getTodaysMedicines();
  const upcomingMedicine = getUpcomingMedicine();
  const upcomingAppointment = getUpcomingAppointment();
  const displayName = user.name || user.email.split('@')[0];
  const firstName = displayName.split(' ')[0];
  const firstLetter = displayName.charAt(0).toUpperCase();
  const healthScore = careData.profile?.healthScore || 84;

  return (
    <>
      <SuccessNotification show={showNotification} message={`Welcome back, ${firstName}!`} />

      <main className="page-shell">
        <header className="nav-glass">
          <div className="content-shell flex items-center justify-between gap-4 py-4">
            <BrandMark subtitle="Patient care command center" />
            <div className="flex items-center gap-2">
              <IconButton label="Home" onClick={onGoHome}><Home className="h-5 w-5" /></IconButton>
              <IconButton label="Medical records" onClick={() => setShowMedicalRecords(true)}><FileText className="h-5 w-5" /></IconButton>
              <IconButton label="About Helio" onClick={() => setShowAboutModal(true)}><Info className="h-5 w-5" /></IconButton>
              <button 
                onClick={() => setShowProfileModal(true)} 
                className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-700 font-bold text-white shadow-[var(--shadow-glow)] hover:scale-105 transition-transform" 
                aria-label="Open profile"
              >
                {firstLetter}
              </button>
            </div>
          </div>
        </header>

        <div className="content-shell py-6 sm:py-8">
          {sosSuccess && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 font-semibold shadow-lg animate-bounce flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
              <span>{sosSuccess}</span>
            </div>
          )}

          {/* Greeting Widget with Copy Action */}
          <Card className="overflow-hidden p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <p className="section-kicker mb-4">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                  Personalized care concierge
                </p>
                <h1 className="text-balance text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl tracking-tight">
                  Welcome back, {firstName}. Your care space is active.
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-slate-600 text-sm sm:text-base leading-relaxed">
                  <span>{careError || `Provide your clinician with Access Code:`}</span>
                  <button 
                    onClick={copyAccessCode}
                    className="inline-flex items-center gap-1.5 font-mono bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-100 font-bold hover:bg-emerald-100 transition-colors"
                    title="Click to copy code"
                  >
                    {careData.profile?.accessCode || 'Generating...'}
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-emerald-600" />}
                  </button>
                  <span>for instant synchronization.</span>
                </div>
              </div>
              <div className="rounded-[var(--radius-xl)] bg-slate-950 p-6 text-white shadow-lg border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-lg" />
                <div className="flex justify-between items-center relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Adherence Score</p>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-end gap-1 relative z-10">
                  <span className="text-5xl font-extrabold">{healthScore}</span>
                  <span className="pb-1 text-lg text-slate-300">%</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/10 relative z-10">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.min(healthScore, 100)}%` }} />
                </div>
                <p className="mt-3 text-[10px] text-slate-400 relative z-10">
                  {isLoadingCareData ? 'Refreshing indicators...' : 'Calculated based on daily medication logs.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Vitals Overview */}
          <section className="mt-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <HeartPulse className="h-6 w-6 text-emerald-600" />
                Clinical Vitals Tracker
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setShowVitalsForm(!showVitalsForm)}>
                {showVitalsForm ? 'Hide Form' : 'Log New Vitals'}
              </Button>
            </div>

            {showVitalsForm && (
              <Card className="p-6 mb-6 animate-rise-in max-w-2xl border-slate-200">
                <form onSubmit={handleVitalsSubmit} className="space-y-4">
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                    <Field label="Weight (kg)">
                      <input className="input-field" type="number" step="0.1" value={vitalsInput.weight} onChange={(e) => setVitalsInput({ ...vitalsInput, weight: e.target.value })} placeholder="72.5" />
                    </Field>
                    <Field label="Height (cm)">
                      <input className="input-field" type="number" value={vitalsInput.height} onChange={(e) => setVitalsInput({ ...vitalsInput, height: e.target.value })} placeholder="178" />
                    </Field>
                    <Field label="Heart Rate (bpm)">
                      <input className="input-field" type="number" value={vitalsInput.heartRate} onChange={(e) => setVitalsInput({ ...vitalsInput, heartRate: e.target.value })} placeholder="72" />
                    </Field>
                    <Field label="Blood Pressure">
                      <input className="input-field" type="text" value={vitalsInput.bloodPressure} onChange={(e) => setVitalsInput({ ...vitalsInput, bloodPressure: e.target.value })} placeholder="120/80" />
                    </Field>
                    <Field label="Temperature (°C)">
                      <input className="input-field" type="number" step="0.1" value={vitalsInput.temperature} onChange={(e) => setVitalsInput({ ...vitalsInput, temperature: e.target.value })} placeholder="36.6" />
                    </Field>
                    <Field label="SpO2 (%)">
                      <input className="input-field" type="number" value={vitalsInput.oxygenSaturation} onChange={(e) => setVitalsInput({ ...vitalsInput, oxygenSaturation: e.target.value })} placeholder="98" />
                    </Field>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" size="sm" type="button" onClick={() => setShowVitalsForm(false)}>Cancel</Button>
                    <Button size="sm" type="submit">Save Log</Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
              {[
                { label: 'Heart Rate', value: careData.profile?.vitals?.heartRate ? `${careData.profile.vitals.heartRate} bpm` : 'N/A', detail: 'Normal: 60-100' },
                { label: 'Blood Pressure', value: careData.profile?.vitals?.bloodPressure || 'N/A', detail: 'Systolic/Diastolic' },
                { label: 'Oxygen Level', value: careData.profile?.vitals?.oxygenSaturation ? `${careData.profile.vitals.oxygenSaturation}%` : 'N/A', detail: 'Optimal: 95-100%' },
                { label: 'Temperature', value: careData.profile?.vitals?.temperature ? `${careData.profile.vitals.temperature}°C` : 'N/A', detail: 'Normal: 36-37.2' },
                { label: 'Weight', value: careData.profile?.vitals?.weight ? `${careData.profile.vitals.weight} kg` : 'N/A', detail: 'Latest logged' },
                { label: 'Height', value: careData.profile?.vitals?.height ? `${careData.profile.vitals.height} cm` : 'N/A', detail: 'Stature' },
              ].map((vital) => (
                <Card key={vital.label} className="p-4 border-slate-100 hover:scale-[1.02] transition-transform shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{vital.label}</span>
                  <p className="mt-2 text-xl font-bold text-slate-800">{vital.value}</p>
                  <p className="mt-1.5 text-[9px] text-slate-400 font-medium">{vital.detail}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Quick Metrics Cards */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatCard icon={Pill} label="Today's routine" value={todaysMedicines.length} detail={upcomingMedicine ? `Next: ${upcomingMedicine.medicine.name} at ${upcomingMedicine.time}` : 'Doses complete for today'} tone="primary" />
            <StatCard icon={Calendar} label="Consultations" value={effectiveAppointments.length} detail={upcomingAppointment ? `${upcomingAppointment.doctorName} next` : 'No upcoming visits'} tone="appointment" />
            <StatCard icon={Bell} label="Clinical Dispatches" value={careData.notes?.length || 0} detail="Bulletins from care team" tone="ai" />
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            
            {/* Medicine Vault with Checklist */}
            <Card className="overflow-hidden border-slate-200">
              <div className="flex flex-col gap-4 border-b border-emerald-100 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <SectionHeader title="Active Dosing Plan" description="Record medicine intake to maintain adherence. Low stock alerts prompt refills." />
                <Button onClick={() => setShowMedicineModal(true)} size="sm"><Plus className="h-4.5 w-4.5" /> Add Medicine</Button>
              </div>
              <div className="p-5 sm:p-6">
                {todaysMedicines.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {todaysMedicines.map((medicine) => {
                      const isLowStock = (medicine.quantity !== undefined && medicine.quantity <= (medicine.refillThreshold || 5));
                      return (
                        <article key={medicine._id} className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5 flex flex-col justify-between hover:border-emerald-100 transition-colors">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <Pill className="h-5 w-5" />
                              </div>
                              <IconButton label={`Remove ${medicine.name}`} onClick={() => handleDeleteMedicine(medicine._id)} className="h-8 w-8 rounded-lg border-0 hover:bg-red-50">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </IconButton>
                            </div>
                            <h3 className="mt-4 font-bold text-slate-900 text-base leading-tight">{medicine.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">{medicine.dosage} • {medicine.frequency}</p>
                            
                            {/* Stock Indicator */}
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                              <span className={isLowStock ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                {medicine.quantity !== undefined ? `${medicine.quantity} pills in stock` : 'No stock tracked'}
                              </span>
                              <Button size="sm" variant="ghost" className="h-7 text-[10px] text-emerald-800 font-semibold px-2 hover:bg-emerald-50" onClick={() => handleRefillMed(medicine._id)}>
                                Refill
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-wider">Log taken slots:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(medicine.times || []).map((time) => (
                                <button
                                  key={time}
                                  onClick={() => handleTakeDose(medicine._id, time)}
                                  className="chip text-[11px] py-1 px-2.5 bg-emerald-50/50 text-emerald-800 border-emerald-100/50 font-semibold hover:bg-emerald-100/70 hover:scale-105 transition-all flex items-center gap-1"
                                  title="Log taken"
                                >
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  <span>{time}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Pill}
                    title="No active medicines"
                    description="Log your daily prescriptions to construct your care schedule."
                    action={<Button onClick={() => setShowMedicineModal(true)}>Log First Medicine</Button>}
                  />
                )}
              </div>
            </Card>

            {/* Appointment Reminders */}
            <Card className="overflow-hidden border-slate-200">
              <div className="flex flex-col gap-4 border-b border-sky-100 bg-sky-50/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <SectionHeader title="Consultations & Calendars" description="View upcoming physician appointments or run AI summaries." />
                <Button onClick={() => setShowAppointmentModal(true)} size="sm"><Plus className="h-4.5 w-4.5" /> Book Visit</Button>
              </div>
              <div className="p-5 sm:p-6">
                {effectiveAppointments.length ? (
                  <div className="space-y-4">
                    {effectiveAppointments.map((appointment) => (
                      <article key={appointment._id} className="rounded-2xl border border-slate-100 bg-slate-50/20 p-5 flex flex-col hover:border-sky-200 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base leading-tight">{appointment.doctorName}</h3>
                              {appointment.status && (
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  appointment.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : appointment.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-sky-700 mt-0.5">{appointment.specialty}</p>
                          </div>
                          <IconButton label="Cancel appointment" onClick={() => handleDeleteAppointment(appointment._id)} className="h-8 w-8 rounded-lg border-0 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </IconButton>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-slate-500">
                          <p className="flex items-center gap-2 font-medium"><Clock className="h-3.5 w-3.5" />{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
                          <p className="flex items-center gap-2 font-medium"><MapPin className="h-3.5 w-3.5" />{appointment.clinicAddress}</p>
                          {appointment.notes && <p className="text-xs italic bg-white p-2.5 rounded-xl border border-slate-100 text-slate-600 mt-2">Prep instruction: {appointment.notes}</p>}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs py-1.5"
                            onClick={() => { setSelectedAppointment(appointment); setShowAppointmentSummary(true); }}
                          >
                            <Brain className="h-3.5 w-3.5 text-indigo-600" />
                            AI prep advisor
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="No consultations scheduled"
                    description="Book visits with physician offices to coordinate dates and prepare notes."
                    action={<Button onClick={() => setShowAppointmentModal(true)}>Log Appointment</Button>}
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Timeline and Support Circle */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            
            {/* Timeline */}
            <Card className="p-6 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Timeline</span>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">Encrypted Incident Logs</h2>
                </div>
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="mt-5 space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {careData.records?.length ? careData.records.map((record) => (
                  <div key={record._id} className="relative pl-6 border-l border-slate-200 py-2">
                    <div className="absolute -left-1 top-3 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(record.date).toLocaleDateString()}</span>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">{record.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">{record.summary}</p>
                    </div>
                  </div>
                )) : <p className="text-xs text-slate-500 text-center py-8">Your clinical timeline is empty. Add records to build logs.</p>}
              </div>
            </Card>

            {/* Support Circle (Family Profiles) */}
            <Card className="p-6 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">Support Circle</span>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">Family Dispatch Profiles</h2>
                </div>
                <Users className="h-5 w-5 text-sky-600" />
              </div>
              <div className="mt-5 space-y-3">
                {careData.profile?.familyMembers?.length ? careData.profile.familyMembers.map((member, index) => (
                  <div key={`${member.name}-${index}`} className="flex justify-between items-center rounded-2xl bg-slate-50/50 border border-slate-100 px-4 py-3 shadow-sm text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{member.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{member.relationship} • {member.phone}</p>
                    </div>
                    <IconButton label="Delete contact" onClick={() => handleRemoveFamilyMember(index)} className="h-7 w-7 text-red-500 border-0 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                )) : <p className="text-xs text-slate-500 text-center py-6">No emergency family profiles linked.</p>}
                
                {showFamilyForm ? (
                  <form onSubmit={handleAddFamilyMember} className="bg-slate-50 p-4 rounded-2xl space-y-3 mt-4 border border-slate-200/60 animate-rise-in">
                    <Field label="Full Name">
                      <input className="input-field bg-white" type="text" value={familyInput.name} onChange={(e) => setFamilyInput({ ...familyInput, name: e.target.value })} placeholder="Alex Morgan" required />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Relationship">
                        <select className="input-field bg-white" value={familyInput.relationship} onChange={(e) => setFamilyInput({ ...familyInput, relationship: e.target.value })}>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="child">Child</option>
                          <option value="sibling">Sibling</option>
                          <option value="other">Other</option>
                        </select>
                      </Field>
                      <Field label="Phone number">
                        <input className="input-field bg-white" type="tel" value={familyInput.phone} onChange={(e) => setFamilyInput({ ...familyInput, phone: e.target.value })} placeholder="+1..." required />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" type="button" onClick={() => setShowFamilyForm(false)}>Cancel</Button>
                      <Button size="sm" type="submit">Save contact</Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="secondary" className="w-full mt-4 text-xs py-2" onClick={() => setShowFamilyForm(true)}>
                    <Plus className="h-4 w-4" /> Add family member
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Clinician Notes */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-2 tracking-tight">
              <FileText className="h-6 w-6 text-indigo-600" />
              Direct Clinical Bulletins
            </h2>
            {careData.notes?.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {careData.notes.map((note) => (
                  <Card key={note._id} className="p-5 border-l-4 border-l-indigo-600 bg-white/85 shadow-sm">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{note.title}</h3>
                      <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{note.category}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-4 border-t border-slate-100 pt-2 text-[9px] text-slate-400 font-semibold">
                      Published on {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-xs text-slate-500 border-slate-200">
                No clinical bulletins published by linked physicians yet.
              </Card>
            )}
          </section>
        </div>
      </main>

      {/* Floating Action Bars */}
      {isAlerting ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
          <Card className="max-w-sm w-full p-8 text-center border-red-200 shadow-2xl bg-white/95">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-50 text-5xl font-bold text-red-600 animate-pulse">{countdown}</div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900 tracking-tight">Emergency SOS Dispatching</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">Sending real-time coordinates and medical information to emergency circles and clinical assistants.</p>
            <Button variant="danger" className="mt-6 w-full" onClick={() => { setIsAlerting(false); setCountdown(10); }}>Cancel Alert</Button>
          </Card>
        </div>
      ) : (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
          <button 
            onClick={() => { setIsAlerting(true); setCountdown(10); }} 
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-105 active:scale-95 transition-all outline-none focus-visible:ring-4 focus-visible:ring-red-100"
            title="Trigger emergency alert"
            aria-label="SOS panic"
          >
            <Shield className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setShowChatBot(true)} 
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
            title="Open AI health assistant"
            aria-label="Chat with assistant"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {showMedicineModal && <MedicineReminder onClose={() => setShowMedicineModal(false)} onAddMedicine={handleAddMedicine} />}
      {showAppointmentModal && <AppointmentBooking onClose={() => setShowAppointmentModal(false)} onAddAppointment={handleAddAppointment} />}
      {showProfileModal && <ProfileModal user={{ ...user, ...careData.profile }} onClose={() => setShowProfileModal(false)} onUpdateProfile={async (updatedProfile) => {
        try {
          await apiRequest('/health/profile', { method: 'POST', body: JSON.stringify(updatedProfile) });
          loadCareData();
        } catch(e) {
          alert('Failed to update profile.');
        }
      }} />}
      {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} user={user} medicines={todaysMedicines} appointments={effectiveAppointments} />}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      {showMedicalRecords && <MedicalRecordsModal onClose={() => setShowMedicalRecords(false)} user={user} />}
      {showAppointmentSummary && selectedAppointment && (
        <AppointmentSummaryModal onClose={() => { setShowAppointmentSummary(false); setSelectedAppointment(null); }} appointment={selectedAppointment} onSaveSummary={handleSaveAppointmentSummary} />
      )}
    </>
  );
};

export default Dashboard;

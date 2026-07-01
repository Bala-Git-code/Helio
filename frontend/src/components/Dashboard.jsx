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
import { BrandMark, Button, Card, EmptyState, IconButton, SectionHeader, StatCard } from './design-system';

const Dashboard = ({
  user,
  medicines,
  appointments,
  appointmentSummaries,
  onAddMedicine,
  onDeleteMedicine,
  onAddAppointment,
  onDeleteAppointment,
  onSaveAppointmentSummary,
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
  const [isAlerting, setIsAlerting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showNotification, setShowNotification] = useState(showSuccessNotification);

  useEffect(() => {
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
      setIsAlerting(false);
      setCountdown(10);
    }
    return () => clearTimeout(timer);
  }, [isAlerting, countdown]);

  if (!user?.email) {
    return (
      <main className="page-shell grid place-items-center px-4">
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">Loading your dashboard...</p>
        </Card>
      </main>
    );
  }

  const effectiveMedicines = (careData.medications?.length ? careData.medications : medicines || []).map((med) => ({ ...med, times: med.times || [] }));
  const effectiveAppointments = (careData.appointments?.length ? careData.appointments : appointments || []).map((appointment) => ({
    ...appointment,
    date: appointment.date || appointment.appointmentDate,
  }));

  const getTodaysMedicines = () => {
    const today = new Date().toDateString();
    return effectiveMedicines.filter((med) => new Date(med.startDate || Date.now()).toDateString() <= today);
  };

  const getUpcomingMedicine = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    for (const med of getTodaysMedicines()) {
      for (const time of med.times) {
        if (time > currentTime) return { medicine: med, time };
      }
    }
    return null;
  };

  const getUpcomingAppointment = () => {
    const today = new Date().toDateString();
    return effectiveAppointments
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
      <SuccessNotification show={showNotification} message={`Welcome to Helio, ${firstName}!`} />

      <main className="page-shell">
        <header className="nav-glass">
          <div className="content-shell flex items-center justify-between gap-4 py-4">
            <BrandMark subtitle="Patient care command center" />
            <div className="flex items-center gap-2">
              <IconButton label="Home" onClick={onGoHome}><Home className="h-5 w-5" /></IconButton>
              <IconButton label="Medical records" onClick={() => setShowMedicalRecords(true)}><FileText className="h-5 w-5" /></IconButton>
              <IconButton label="About Helio" onClick={() => setShowAboutModal(true)}><Info className="h-5 w-5" /></IconButton>
              <button onClick={() => setShowProfileModal(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 font-semibold text-white shadow-[var(--shadow-glow)]" aria-label="Open profile">
                {firstLetter}
              </button>
            </div>
          </div>
        </header>

        <div className="content-shell py-6 sm:py-8">
          <Card className="overflow-hidden p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <p className="section-kicker mb-4">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Personalized care concierge
                </p>
                <h1 className="text-balance text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                  Welcome back, {firstName}. Your care plan is steady today.
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  {careError || 'Your medications, upcoming visits, care records, and AI insights are organized for a calmer day.'}
                </p>
              </div>
              <div className="rounded-[var(--radius-xl)] bg-slate-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Health score</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-semibold">{healthScore}</span>
                  <span className="pb-2 text-lg text-slate-300">%</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.min(healthScore, 100)}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-300">{isLoadingCareData ? 'Refreshing your care snapshot...' : 'Consistency is trending up this week.'}</p>
              </div>
            </div>
          </Card>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatCard icon={Pill} label="Today's medicines" value={todaysMedicines.length} detail={upcomingMedicine ? `Next at ${upcomingMedicine.time}` : 'No dose remaining today'} />
            <StatCard icon={Calendar} label="Appointments" value={effectiveAppointments.length} detail={upcomingAppointment ? `${upcomingAppointment.doctorName} is next` : 'No upcoming reminder'} tone="appointment" />
            <StatCard icon={Bell} label="Next reminder" value={upcomingMedicine?.time || upcomingAppointment?.time || 'Clear'} detail="Prioritized from your care schedule" tone="ai" />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-emerald-100 bg-emerald-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <SectionHeader title="Medicine reminders" description="Daily doses, timing, and allergy-aware medication context." />
                <Button onClick={() => setShowMedicineModal(true)}><Plus className="h-5 w-5" /> Add medicine</Button>
              </div>
              <div className="p-5 sm:p-6">
                {todaysMedicines.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {todaysMedicines.map((medicine) => (
                      <article key={medicine._id || medicine.id} className="rounded-[var(--radius-lg)] border border-emerald-100 bg-white/80 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white">
                            <Pill className="h-5 w-5" />
                          </div>
                          <IconButton label={`Delete ${medicine.name}`} onClick={() => onDeleteMedicine(medicine._id || medicine.id)} className="h-9 w-9 rounded-xl">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </IconButton>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-950">{medicine.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{medicine.dosage} • {medicine.frequency}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {medicine.times.map((time) => <span key={time} className="chip bg-emerald-50 text-emerald-800">{time}</span>)}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Pill}
                    title="No medicines scheduled"
                    description="Add your first medicine reminder to create a daily rhythm Helio can protect."
                    action={<Button onClick={() => setShowMedicineModal(true)}>Add your first medicine</Button>}
                  />
                )}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-sky-100 bg-sky-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <SectionHeader title="Appointment reminders" description="Upcoming visits and preparation notes." />
                <Button onClick={() => setShowAppointmentModal(true)}><Plus className="h-5 w-5" /> Set reminder</Button>
              </div>
              <div className="p-5 sm:p-6">
                {effectiveAppointments.length ? (
                  <div className="space-y-4">
                    {effectiveAppointments.map((appointment) => (
                      <article key={appointment._id || appointment.id} className="rounded-[var(--radius-lg)] border border-sky-100 bg-white/80 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">{appointment.doctorName}</h3>
                            <p className="text-sm font-medium text-sky-700">{appointment.specialty}</p>
                          </div>
                          <IconButton label={`Delete appointment with ${appointment.doctorName}`} onClick={() => onDeleteAppointment(appointment._id || appointment.id)} className="h-9 w-9 rounded-xl">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </IconButton>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
                          <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{appointment.clinicAddress}</p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-4"
                          onClick={() => { setSelectedAppointment(appointment); setShowAppointmentSummary(true); }}
                        >
                          <Brain className="h-4 w-4" />
                          AI summary
                        </Button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="No appointments yet"
                    description="Create a reminder for an upcoming visit so Helio can help you prepare."
                    action={<Button onClick={() => setShowAppointmentModal(true)}>Set first reminder</Button>}
                  />
                )}
              </div>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Care timeline</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">Recovery and follow-up</h2>
                </div>
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="mt-5 space-y-3">
                {careData.records?.slice(0, 3).length ? careData.records.slice(0, 3).map((record) => (
                  <div key={record._id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{record.title}</p>
                      <p className="text-sm text-slate-600">{record.summary}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 text-slate-400" />
                  </div>
                )) : <p className="text-sm text-slate-600">No health timeline entries yet.</p>}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-sky-700">Care team</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">Your support circle</h2>
                </div>
                <Users className="h-6 w-6 text-sky-600" />
              </div>
              <div className="mt-5 space-y-3">
                {careData.profile?.familyMembers?.length ? careData.profile.familyMembers.map((member, index) => (
                  <div key={`${member.name}-${index}`} className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                    {member.name} • {member.relationship}
                  </div>
                )) : <p className="text-sm text-slate-600">Add family contacts for coordinated care.</p>}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {isAlerting ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <Card className="max-w-sm p-8 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-50 text-5xl font-semibold text-red-600">{countdown}</div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">Emergency alert sending</h2>
            <p className="mt-2 text-sm text-slate-600">Cancel if this was accidental.</p>
            <Button variant="secondary" className="mt-6 w-full" onClick={() => { setIsAlerting(false); setCountdown(10); }}>Cancel alert</Button>
          </Card>
        </div>
      ) : (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
          <IconButton label="Start emergency alert" onClick={() => { setIsAlerting(true); setCountdown(10); }} className="border-red-200 bg-red-600 text-white hover:bg-red-700 hover:text-white">
            <Shield className="h-5 w-5" />
          </IconButton>
          <IconButton label="Open AI assistant" onClick={() => setShowChatBot(true)} className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white">
            <MessageCircle className="h-5 w-5" />
          </IconButton>
        </div>
      )}

      {showMedicineModal && <MedicineReminder onClose={() => setShowMedicineModal(false)} onAddMedicine={onAddMedicine} />}
      {showAppointmentModal && <AppointmentBooking onClose={() => setShowAppointmentModal(false)} onAddAppointment={onAddAppointment} />}
      {showProfileModal && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} />}
      {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} user={user} medicines={medicines} appointments={appointments} />}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      {showMedicalRecords && <MedicalRecordsModal onClose={() => setShowMedicalRecords(false)} user={user} />}
      {showAppointmentSummary && selectedAppointment && (
        <AppointmentSummaryModal onClose={() => { setShowAppointmentSummary(false); setSelectedAppointment(null); }} appointment={selectedAppointment} onSaveSummary={onSaveAppointmentSummary} />
      )}
    </>
  );
};

export default Dashboard;

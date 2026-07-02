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
  Check,
  Menu,
  X,
  Settings,
  LogOut,
  ChevronDown,
  Upload,
  CalendarDays,
  ActivitySquare
} from 'lucide-react';
import SuccessNotification from './SuccessNotification';
import MedicineReminder from './MedicineReminder';
import AppointmentBooking from './AppointmentBooking';
import ProfileModal from './ProfileModal';
import ChatBot from './ChatBot';
import AboutModal from './AboutModal';
import MedicalRecordsModal from './MedicalRecordsModal';
import AppointmentSummaryModal from './AppointmentSummaryModal';
import ErrorBoundary from './ErrorBoundary';
import { apiRequest } from '../utils/api';
import { BrandMark, Button, Card, EmptyState, IconButton, SectionHeader, StatCard, Field } from './design-system';

// Visual Skeleton card components to avoid CLS layout janks
const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse pt-4">
    <div className="h-36 bg-slate-200 rounded-3xl w-full" />
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      <div className="h-28 bg-slate-200 rounded-2xl" />
      <div className="h-28 bg-slate-200 rounded-2xl" />
      <div className="h-28 bg-slate-200 rounded-2xl" />
      <div className="h-28 bg-slate-200 rounded-2xl" />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-48 bg-slate-200 rounded-2xl" />
      <div className="h-48 bg-slate-200 rounded-2xl" />
    </div>
  </div>
);

const Dashboard = ({
  user,
  onUpdateUser,
  onGoHome,
  showSuccessNotification,
  onNotificationDismiss,
}) => {
  const [careData, setCareData] = useState({ profile: {}, medications: [], appointments: [], records: [], notes: [], notifications: [] });
  const [isLoadingCareData, setIsLoadingCareData] = useState(true);
  const [careError, setCareError] = useState('');
  
  // Dashboard Tabs & Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals & Panels
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMedicalRecords, setShowMedicalRecords] = useState(false);
  const [showAppointmentSummary, setShowAppointmentSummary] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Vitals & Consent
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitalsInput, setVitalsInput] = useState({
    weight: '', height: '', heartRate: '', bloodPressure: '', temperature: '', oxygenSaturation: ''
  });
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyInput, setFamilyInput] = useState({ name: '', relationship: 'spouse', phone: '' });
  const [consentRequests, setConsentRequests] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showNotification, setShowNotification] = useState(showSuccessNotification);

  // SOS States
  const [isAlerting, setIsAlerting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [sosSuccess, setSosSuccess] = useState('');

  // AI insights rotating list
  const insights = [
    "Hydration Alert: Drinking 8-10 glasses of water daily helps maintain cellular electrolyte balances and enhances medicine transport efficiency.",
    "Restful Slumber: Ensure 7-8 hours of sleep. Consistent sleep patterns directly reduce cardiovascular stress and normalise blood pressure.",
    "Gentle Movement: 15-20 minutes of daily walking acts as a primary clinical aid in lowering insulin resistance and stabilizing heart rate metrics.",
    "Nutritious Intake: Integrate leafy greens into your dosing plan. Antioxidants safeguard tissue repair and balance vital logs."
  ];
  const [activeInsightIdx, setActiveInsightIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInsightIdx(prev => (prev + 1) % insights.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

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

  const loadConsentRequests = async () => {
    try {
      const data = await apiRequest('/health/consent-requests');
      if (data.success) {
        setConsentRequests(data.requests || []);
      }
    } catch (err) {
      console.warn('Unable to load clinical consent pending queues.', err);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadCareData();
      loadConsentRequests();
    }
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

  // SOS Countdown Hook
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
        async () => {
          console.warn('Geolocation denied. Dispatching SOS.');
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
      alert(err.message || 'Failed to dispatch SOS alerts.');
    }
  };

  // Medicine Operations
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

  const handleToggleMedStatus = async (medId, currentStatus) => {
    try {
      await apiRequest(`/health/medications/${medId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });
      loadCareData();
    } catch (err) {
      alert(err.message || 'Failed to toggle medication schedule status.');
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
    const amount = window.prompt('Enter number of pills to add:', '30');
    if (amount === null) return;
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

  // Consultations Operations
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

  // Vitals & Family
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
      alert(err.message || 'Failed to save family profile.');
    }
  };

  const handleRemoveFamilyMember = async (index) => {
    if (!window.confirm('Remove this family profile?')) return;
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

  // Doctor access consents
  const handleApproveConsent = async (permissionId) => {
    try {
      await apiRequest('/health/consent-approve', {
        method: 'POST',
        body: JSON.stringify({ permissionId })
      });
      loadConsentRequests();
      loadCareData();
    } catch (err) {
      alert(err.message || 'Approval failed.');
    }
  };

  const handleRevokeConsent = async (permissionId) => {
    try {
      await apiRequest('/health/consent-revoke', {
        method: 'POST',
        body: JSON.stringify({ permissionId })
      });
      loadConsentRequests();
      loadCareData();
    } catch (err) {
      alert(err.message || 'Revocation failed.');
    }
  };

  // Notifications operations
  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await apiRequest(`/health/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      loadCareData();
    } catch (err) {
      console.warn('Unable to mark notification read.', err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await apiRequest(`/health/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      loadCareData();
    } catch (err) {
      console.warn('Unable to delete notification alert.', err);
    }
  };

  const copyAccessCode = () => {
    if (!careData.profile?.accessCode) return;
    navigator.clipboard.writeText(careData.profile.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Sparkline generator helper
  const renderSparkline = (history = [], dataKey, color = '#0D7A62') => {
    const values = history
      .map(h => h[dataKey])
      .filter(val => val !== undefined && val !== null && !isNaN(val))
      .slice(-10);
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    const width = 100;
    const height = 30;
    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-20 h-7 shrink-0 overflow-visible ml-auto" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const effectiveMedicines = careData.medications || [];
  const effectiveAppointments = careData.appointments || [];
  const todaysMedicines = effectiveMedicines;

  const getUpcomingMedicine = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const activeMeds = todaysMedicines.filter(m => m.active !== false);
    for (const med of activeMeds) {
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

  const upcomingMedicine = getUpcomingMedicine();
  const upcomingAppointment = getUpcomingAppointment();
  const displayName = user.name || user.email.split('@')[0];
  const firstName = displayName.split(' ')[0];
  const firstLetter = displayName.charAt(0).toUpperCase();
  const healthScore = careData.profile?.healthScore || 84;

  const unreadCount = (careData.notifications || []).filter(n => !n.read).length;

  // Sidebar items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Center', icon: Home },
    { id: 'medications', label: 'Medications Dosing', icon: Pill },
    { id: 'appointments', label: 'Appointments Book', icon: CalendarDays },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'vitals', label: 'Vitals Analytics', icon: HeartPulse },
    { id: 'timeline', label: 'Incidents Timeline', icon: ActivitySquare },
    { id: 'ai', label: 'AI Health Companion', icon: Brain },
    { id: 'family', label: 'Support Circle', icon: Users },
    { id: 'notifications', label: 'Alerts & Bulletins', icon: Bell }
  ];

  return (
    <>
      <SuccessNotification show={showNotification} message={`Welcome back to Helio, ${firstName}!`} />

      <div className="min-h-screen bg-slate-50/50 flex">
        
        {/* SIDEBAR NAVIGATION (Desktop) */}
        <aside 
          className={cn(
            "hidden md:flex flex-col border-r border-slate-200 bg-white/80 backdrop-blur-md transition-all duration-300 relative z-30 shrink-0",
            isSidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            {!isSidebarCollapsed && <BrandMark subtitle="Patient Portal" tone="primary" />}
            {isSidebarCollapsed && (
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm">
                <Heart className="h-5 w-5 animate-pulse" />
              </div>
            )}
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const MenuItemIcon = item.icon;
              const isActive = activeTab === item.id;
              const isBell = item.id === 'notifications';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300",
                    isActive 
                      ? "bg-emerald-50 text-emerald-800 shadow-[var(--shadow-luxury)]" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  )}
                  title={item.label}
                >
                  <MenuItemIcon className={cn("h-5 w-5", isActive ? "text-emerald-700" : "text-slate-400")} />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!isSidebarCollapsed && isBell && unreadCount > 0 && (
                    <span className="ml-auto bg-rose-600 text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-2">
            <button 
              onClick={() => { setShowProfileModal(true); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 font-bold text-white text-xs">
                {firstLetter}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{firstName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              )}
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('jwtToken');
                window.location.reload();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 text-red-500" />
              {!isSidebarCollapsed && <span>Log Out</span>}
            </button>
          </div>
        </aside>

        {/* MOBILE NAVIGATION BAR */}
        <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4">
          <BrandMark subtitle="Portal" tone="primary" />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* MOBILE SLIDE-OVER DRAWER */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div 
              className="absolute top-16 left-0 w-64 h-[calc(100vh-64px)] bg-white p-4 space-y-4 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const MenuItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  const isBell = item.id === 'notifications';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all",
                        isActive 
                          ? "bg-emerald-50 text-emerald-800" 
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <MenuItemIcon className="h-4.5 w-4.5" />
                      <span>{item.label}</span>
                      {isBell && unreadCount > 0 && (
                        <span className="ml-auto bg-rose-600 text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <button 
                  onClick={() => {
                    localStorage.removeItem('jwtToken');
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <main className="flex-1 min-w-0 md:pt-0 pt-16 pb-12 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
          
          {/* Header Greeting */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-6 border-b border-slate-100 pb-5 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700 animate-pulse" />
                Helio Care Intelligence
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Hello, {firstName}. Your status is reassuring.
              </h2>
            </div>
            
            {/* Weather Widget */}
            <div className="flex items-center gap-3 bg-white border border-slate-150 rounded-2xl px-4 py-2.5 shadow-sm text-xs text-slate-600 font-semibold md:self-end">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>New York • 72°F Clear • 12 AQI (Excellent)</span>
            </div>
          </div>

          {/* Clinician Consent Access Request Banner */}
          {consentRequests.length > 0 && (
            <div className="space-y-3">
              {consentRequests.map((reqItem) => {
                if (reqItem.status !== 'pending') return null;
                return (
                  <div key={reqItem._id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-rise-in shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800 shrink-0">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Clinical Consent Link Request</h4>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          Dr. <strong className="text-slate-900">{reqItem.doctorId?.name}</strong> ({reqItem.doctorId?.specialty || 'General Practitioner'}) requests secure access to your daily vitals logs, medications adherence checklists, and uploaded files.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 justify-end">
                      <Button variant="ghost" size="sm" className="text-xs hover:bg-slate-100 text-slate-600 border border-slate-200" onClick={() => handleRevokeConsent(reqItem._id)}>
                        Deny
                      </Button>
                      <Button size="sm" className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white" onClick={() => handleApproveConsent(reqItem._id)}>
                        Grant Access
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SOS Success Banner */}
          {sosSuccess && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 font-semibold shadow-lg animate-bounce flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
              <span>{sosSuccess}</span>
            </div>
          )}

          {/* AI Rotating Health Insight Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-700/5 to-teal-700/5 border border-emerald-100 p-4 flex items-center gap-3 text-xs text-emerald-950 font-bold leading-relaxed">
            <Brain className="h-5 w-5 text-emerald-700 shrink-0 animate-pulse" />
            <span className="transition-all duration-500">{insights[activeInsightIdx]}</span>
          </div>

          {/* SKELETON LOADER ENVELOPE (Avoid CLS layout shifts) */}
          {isLoadingCareData ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* ========================================================= */}
              {/* TAB 1: DASHBOARD MAIN CENTER */}
              {/* ========================================================= */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top Summary Asymmetric cards */}
                  <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
                    
                    {/* Greeting & Access code */}
                    <ErrorBoundary>
                      <Card className="p-6 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded tracking-wide">Patient Center</span>
                          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-4">Protected Care timelines</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
                            Provide your clinician with the access code below. Clinicians will request permission, and you can approve or revoke access at any time under complete consent history logs.
                          </p>
                        </div>
                        <div className="mt-6 flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">Your Access Code:</span>
                          <button 
                            onClick={copyAccessCode}
                            className="inline-flex items-center gap-1.5 font-mono bg-white text-emerald-800 px-3.5 py-1.5 rounded-xl border border-slate-150 font-bold hover:bg-emerald-50 transition-colors shadow-sm"
                            title="Click to Copy"
                          >
                            {careData.profile?.accessCode || 'H-XXXXXX'}
                            {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-emerald-600" />}
                          </button>
                        </div>
                      </Card>
                    </ErrorBoundary>

                    {/* Adherence Gauge Circle */}
                    <ErrorBoundary>
                      <Card className="p-6 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden shadow-lg border-0">
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Med Adherence</span>
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="mt-4 flex items-end gap-1">
                          <span className="text-5xl font-extrabold">{healthScore}</span>
                          <span className="pb-1 text-lg text-slate-400 font-bold">%</span>
                        </div>
                        <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.min(healthScore, 100)}%` }} />
                        </div>
                        <p className="mt-3 text-[10px] text-slate-400">
                          Your score is based on logged daily dose intakes.
                        </p>
                      </Card>
                    </ErrorBoundary>
                  </div>

                  {/* Vitals Grid with SVG Sparklines */}
                  <ErrorBoundary>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <HeartPulse className="h-4.5 w-4.5 text-emerald-700" />
                          Clinical Vitals Trends
                        </h3>
                        <Button size="sm" variant="secondary" onClick={() => { setActiveTab('vitals'); setShowVitalsForm(true); }} className="text-xs py-1 px-3">
                          Log new
                        </Button>
                      </div>
                      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                        {[
                          { label: 'Heart Rate', value: careData.profile?.vitals?.heartRate ? `${careData.profile.vitals.heartRate} bpm` : 'N/A', key: 'heartRate', color: '#0D7A62' },
                          { label: 'Blood Pressure', value: careData.profile?.vitals?.bloodPressure || 'N/A', key: 'bloodPressure', color: '#0369a1' },
                          { label: 'SpO2 Level', value: careData.profile?.vitals?.oxygenSaturation ? `${careData.profile.vitals.oxygenSaturation}%` : 'N/A', key: 'oxygenSaturation', color: '#6366f1' },
                          { label: 'Temperature', value: careData.profile?.vitals?.temperature ? `${careData.profile.vitals.temperature}°C` : 'N/A', key: 'temperature', color: '#f59e0b' }
                        ].map((v) => (
                          <Card key={v.label} className="p-4 flex flex-col justify-between border-slate-100 hover:scale-[1.02] transition-all hover:border-emerald-100">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{v.label}</span>
                              <p className="text-lg font-bold text-slate-800 mt-2">{v.value}</p>
                            </div>
                            {careData.profile?.vitalsHistory && (
                              <div className="mt-4 pt-2 border-t border-slate-50 flex items-center">
                                <span className="text-[9px] text-slate-400 font-medium">History</span>
                                {renderSparkline(careData.profile.vitalsHistory, v.key, v.color)}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  </ErrorBoundary>

                  {/* Quick Actions Panel */}
                  <ErrorBoundary>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4">Quick Care Actions</h3>
                      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                        <button 
                          onClick={() => setShowMedicineModal(true)} 
                          className="p-4 rounded-2xl bg-white border border-slate-150 hover:border-emerald-200 hover:bg-emerald-50/20 text-center flex flex-col items-center gap-3 transition-all hover:scale-[1.02] shadow-sm"
                        >
                          <div className="h-10 w-10 grid place-items-center bg-emerald-50 rounded-xl text-emerald-700">
                            <Plus className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">Add Medication</span>
                        </button>
                        <button 
                          onClick={() => setShowAppointmentModal(true)} 
                          className="p-4 rounded-2xl bg-white border border-slate-150 hover:border-sky-200 hover:bg-sky-50/20 text-center flex flex-col items-center gap-3 transition-all hover:scale-[1.02] shadow-sm"
                        >
                          <div className="h-10 w-10 grid place-items-center bg-sky-50 rounded-xl text-sky-700">
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">Book Visit</span>
                        </button>
                        <button 
                          onClick={() => { setActiveTab('ai'); }} 
                          className="p-4 rounded-2xl bg-white border border-slate-150 hover:border-indigo-200 hover:bg-indigo-50/20 text-center flex flex-col items-center gap-3 transition-all hover:scale-[1.02] shadow-sm"
                        >
                          <div className="h-10 w-10 grid place-items-center bg-indigo-50 rounded-xl text-indigo-700">
                            <Brain className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">Consult AI Chat</span>
                        </button>
                        <button 
                          onClick={() => { setActiveTab('records'); }} 
                          className="p-4 rounded-2xl bg-white border border-slate-150 hover:border-indigo-200 hover:bg-indigo-50/20 text-center flex flex-col items-center gap-3 transition-all hover:scale-[1.02] shadow-sm"
                        >
                          <div className="h-10 w-10 grid place-items-center bg-indigo-50 rounded-xl text-indigo-700">
                            <Upload className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">Upload Records</span>
                        </button>
                      </div>
                    </div>
                  </ErrorBoundary>

                  {/* Routines & Next Appointment Highlights */}
                  <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Daily Dosing highlights */}
                    <ErrorBoundary>
                      <Card className="p-6 border-slate-200">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                          <h4 className="font-extrabold text-slate-800 text-sm">Dosing Plan Summary</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{todaysMedicines.length} Active</span>
                        </div>
                        {todaysMedicines.length > 0 ? (
                          <div className="space-y-3">
                            {todaysMedicines.slice(0, 3).map((medicine) => (
                              <div key={medicine._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-105">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 grid place-items-center bg-emerald-50 rounded-lg text-emerald-700">
                                    <Pill className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{medicine.name}</p>
                                    <p className="text-[10px] text-slate-400">{medicine.dosage} • {medicine.times?.join(', ')}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  {medicine.frequency}
                                </span>
                              </div>
                            ))}
                            {todaysMedicines.length > 3 && (
                              <button onClick={() => setActiveTab('medications')} className="text-xs font-bold text-emerald-800 hover:text-emerald-950 mt-2 block mx-auto underline">
                                View remaining {todaysMedicines.length - 3} schedules
                              </button>
                            )}
                          </div>
                        ) : (
                          <EmptyState
                            icon={Pill}
                            title="No active medicines"
                            description="Log your prescriptions to populate daily schedules."
                          />
                        )}
                      </Card>
                    </ErrorBoundary>

                    {/* Consultations highlights */}
                    <ErrorBoundary>
                      <Card className="p-6 border-slate-200">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                          <h4 className="font-extrabold text-slate-800 text-sm">Upcoming Consultations</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{effectiveAppointments.length} Booked</span>
                        </div>
                        {upcomingAppointment ? (
                          <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-100 flex flex-col justify-between h-[120px]">
                            <div>
                              <div className="flex justify-between items-start">
                                <p className="text-xs font-extrabold text-slate-800">{upcomingAppointment.doctorName}</p>
                                <span className="text-[9px] uppercase font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                                  {upcomingAppointment.status || 'scheduled'}
                                </span>
                              </div>
                              <p className="text-[10px] text-sky-700 font-semibold mt-0.5">{upcomingAppointment.specialty}</p>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-sky-100/50 pt-2">
                              <span>{new Date(upcomingAppointment.date).toLocaleDateString()} at {upcomingAppointment.time}</span>
                              <span className="text-slate-400">{upcomingAppointment.clinicAddress?.split(',')[0]}</span>
                            </div>
                          </div>
                        ) : (
                          <EmptyState
                            icon={Calendar}
                            title="No visits scheduled"
                            description="Book doctor appointments to coordinate calendar dates."
                          />
                        )}
                      </Card>
                    </ErrorBoundary>
                  </div>

                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: MEDICATIONS VAULT */}
              {/* ========================================================= */}
              {activeTab === 'medications' && (
                <ErrorBoundary>
                  <Card className="overflow-hidden border-slate-200 animate-fade-in">
                    <div className="flex flex-col gap-4 border-b border-emerald-100 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                      <SectionHeader title="Medication Dosing Vault" description="Pause/resume, add refill stock counts, and log dose schedules directly." />
                      <Button onClick={() => setShowMedicineModal(true)} size="sm"><Plus className="h-4.5 w-4.5" /> Add Medication</Button>
                    </div>
                    <div className="p-6">
                      {todaysMedicines.length ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {todaysMedicines.map((medicine) => {
                            const isLowStock = (medicine.quantity !== undefined && medicine.quantity <= (medicine.refillThreshold || 5));
                            const isPaused = medicine.active === false;
                            return (
                              <article 
                                key={medicine._id} 
                                className={cn(
                                  "rounded-2xl border bg-slate-50/20 p-5 flex flex-col justify-between hover:border-emerald-100 transition-all duration-300 shadow-sm",
                                  isPaused ? "opacity-60 bg-slate-100 border-slate-200" : "border-slate-150"
                                )}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className={cn("grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm", isPaused ? "bg-slate-400" : "bg-emerald-600")}>
                                      <Pill className="h-5 w-5" />
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 text-[10px] px-2.5 font-bold"
                                        onClick={() => handleToggleMedStatus(medicine._id, medicine.active)}
                                      >
                                        {isPaused ? 'Resume' : 'Pause'}
                                      </Button>
                                      <IconButton label={`Remove ${medicine.name}`} onClick={() => handleDeleteMedicine(medicine._id)} className="h-8 w-8 rounded-lg border-0 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </IconButton>
                                    </div>
                                  </div>
                                  <h3 className="mt-4 font-bold text-slate-900 text-base leading-tight">
                                    {medicine.name}
                                    {isPaused && <span className="ml-2 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase">Paused</span>}
                                  </h3>
                                  <p className="mt-1 text-xs text-slate-500">{medicine.dosage} • {medicine.frequency}</p>
                                  
                                  {/* Stock Indicator */}
                                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                                    <span className={isLowStock ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                      {medicine.quantity !== undefined ? `${medicine.quantity} pills in stock` : 'No stock tracked'}
                                    </span>
                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] text-emerald-800 font-semibold px-2 hover:bg-emerald-50" onClick={() => handleRefillMed(medicine._id)}>
                                      Refill Pills
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-150">
                                  <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-wider">Log taken slots:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(medicine.times || []).map((time) => (
                                      <button
                                        key={time}
                                        onClick={() => !isPaused && handleTakeDose(medicine._id, time)}
                                        disabled={isPaused}
                                        className={cn(
                                          "chip text-[11px] py-1.5 px-3.5 border font-bold transition-all flex items-center gap-1.5",
                                          isPaused 
                                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                            : "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100 hover:scale-105"
                                        )}
                                        title={isPaused ? "Schedule paused" : "Log taken"}
                                      >
                                        <CheckCircle2 className={cn("h-3.5 w-3.5", isPaused ? "text-slate-300" : "text-emerald-600")} />
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
                </ErrorBoundary>
              )}

              {/* ========================================================= */}
              {/* TAB 3: APPOINTMENTS */}
              {/* ========================================================= */}
              {activeTab === 'appointments' && (
                <ErrorBoundary>
                  <Card className="overflow-hidden border-slate-200 animate-fade-in">
                    <div className="flex flex-col gap-4 border-b border-sky-100 bg-sky-50/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                      <SectionHeader title="Consultations & Calendars" description="View upcoming physician appointments or run AI summaries." />
                      <Button onClick={() => setShowAppointmentModal(true)} size="sm"><Plus className="h-4.5 w-4.5" /> Book Visit</Button>
                    </div>
                    <div className="p-6">
                      {effectiveAppointments.length ? (
                        <div className="space-y-4">
                          {effectiveAppointments.map((appointment) => (
                            <article key={appointment._id} className="rounded-2xl border border-slate-150 bg-slate-50/20 p-5 flex flex-col hover:border-sky-200 transition-colors">
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
                              <div className="mt-4 space-y-2 text-xs text-slate-500 leading-relaxed">
                                <p className="flex items-center gap-2 font-medium"><Clock className="h-4 w-4" />{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
                                <p className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4" />{appointment.clinicAddress}</p>
                                {appointment.notes && <p className="text-xs italic bg-white p-2.5 rounded-xl border border-slate-100 text-slate-600 mt-2">Prep instruction: {appointment.notes}</p>}
                              </div>
                              <div className="mt-4 pt-3 border-t border-slate-150 flex">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="text-xs py-1.5 font-bold"
                                  onClick={() => { setSelectedAppointment(appointment); setShowAppointmentSummary(true); }}
                                >
                                  <Brain className="h-4 w-4 text-indigo-600" />
                                  Launch AI prep advisor
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
                </ErrorBoundary>
              )}

              {/* ========================================================= */}
              {/* TAB 4: MEDICAL RECORDS */}
              {/* ========================================================= */}
              {activeTab === 'records' && (
                <ErrorBoundary>
                  <Card className="p-6 border-slate-200 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <SectionHeader title="Medical Records Vault" description="Access recent prescriptions, lab results, and OCR metadata file logs." />
                      <Button size="sm" onClick={() => setShowMedicalRecords(true)}>
                        <Upload className="h-4.5 w-4.5" /> Upload File
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {careData.records?.length ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {careData.records.map((record) => (
                            <Card key={record._id} className="p-4 border-slate-150 bg-slate-50/20 hover:border-indigo-200 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 grid place-items-center bg-indigo-50 rounded-xl text-indigo-700">
                                    <FileText className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800">{record.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-semibold">{new Date(record.date || record.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                              <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                                {record.summary}
                              </p>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={FileText}
                          title="No health records"
                          description="Upload clinical scan results, prescription files, or doctor summaries."
                          action={<Button onClick={() => setShowMedicalRecords(true)}>Upload record</Button>}
                        />
                      )}
                    </div>
                  </Card>
                </ErrorBoundary>
              )}

              {/* ========================================================= */}
              {/* TAB 5: VITALS TRACKER */}
              {/* ========================================================= */}
              {activeTab === 'vitals' && (
                <ErrorBoundary>
                  <div className="space-y-6 animate-fade-in">
                    <Card className="p-6 border-slate-200">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-6">
                        <h3 className="font-extrabold text-slate-900 text-sm">Vitals logs</h3>
                        <Button size="sm" onClick={() => setShowVitalsForm(!showVitalsForm)}>
                          {showVitalsForm ? 'Hide Form' : 'Log New Vitals'}
                        </Button>
                      </div>

                      {showVitalsForm && (
                        <form onSubmit={handleVitalsSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 max-w-xl animate-rise-in mb-6">
                          <div className="grid gap-3 grid-cols-2">
                            <Field label="Weight (kg)">
                              <input className="input-field bg-white" type="number" step="0.1" value={vitalsInput.weight} onChange={(e) => setVitalsInput({ ...vitalsInput, weight: e.target.value })} placeholder="72.5" />
                            </Field>
                            <Field label="Height (cm)">
                              <input className="input-field bg-white" type="number" value={vitalsInput.height} onChange={(e) => setVitalsInput({ ...vitalsInput, height: e.target.value })} placeholder="178" />
                            </Field>
                            <Field label="Heart Rate (bpm)">
                              <input className="input-field bg-white" type="number" value={vitalsInput.heartRate} onChange={(e) => setVitalsInput({ ...vitalsInput, heartRate: e.target.value })} placeholder="72" />
                            </Field>
                            <Field label="Blood Pressure">
                              <input className="input-field bg-white" type="text" value={vitalsInput.bloodPressure} onChange={(e) => setVitalsInput({ ...vitalsInput, bloodPressure: e.target.value })} placeholder="120/80" />
                            </Field>
                            <Field label="Temperature (°C)">
                              <input className="input-field bg-white" type="number" step="0.1" value={vitalsInput.temperature} onChange={(e) => setVitalsInput({ ...vitalsInput, temperature: e.target.value })} placeholder="36.6" />
                            </Field>
                            <Field label="SpO2 (%)">
                              <input className="input-field bg-white" type="number" value={vitalsInput.oxygenSaturation} onChange={(e) => setVitalsInput({ ...vitalsInput, oxygenSaturation: e.target.value })} placeholder="98" />
                            </Field>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <Button variant="ghost" size="sm" type="button" onClick={() => setShowVitalsForm(false)}>Cancel</Button>
                            <Button size="sm" type="submit">Save log</Button>
                          </div>
                        </form>
                      )}

                      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                        {[
                          { label: 'Weight (kg)', value: careData.profile?.vitals?.weight ? `${careData.profile.vitals.weight} kg` : 'N/A' },
                          { label: 'Height (cm)', value: careData.profile?.vitals?.height ? `${careData.profile.vitals.height} cm` : 'N/A' },
                          { label: 'Heart Rate', value: careData.profile?.vitals?.heartRate ? `${careData.profile.vitals.heartRate} bpm` : 'N/A' },
                          { label: 'Blood Pressure', value: careData.profile?.vitals?.bloodPressure || 'N/A' },
                          { label: 'Temperature', value: careData.profile?.vitals?.temperature ? `${careData.profile.vitals.temperature}°C` : 'N/A' },
                          { label: 'SpO2 Level', value: careData.profile?.vitals?.oxygenSaturation ? `${careData.profile.vitals.oxygenSaturation}%` : 'N/A' }
                        ].map((vit) => (
                          <Card key={vit.label} className="p-4 border-slate-100 bg-slate-50/30">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{vit.label}</span>
                            <p className="text-xl font-bold text-slate-800 mt-2">{vit.value}</p>
                          </Card>
                        ))}
                      </div>
                    </Card>
                  </div>
                </ErrorBoundary>
              )}

              {/* ========================================================= */}
              {/* TAB 6: TIMELINE INCIDENTS */}
              {/* ========================================================= */}
              {activeTab === 'timeline' && (
                <ErrorBoundary>
                  <Card className="p-6 border-slate-200 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                      <h3 className="font-extrabold text-slate-900 text-sm">Incident logs</h3>
                      <Activity className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="space-y-6">
                      {careData.records?.length ? (
                        <div className="relative pl-6 border-l-2 border-emerald-100 space-y-6">
                          {careData.records.map((record) => (
                            <div key={record._id} className="relative">
                              <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-emerald-600 border-4 border-white shadow-sm" />
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(record.date || record.createdAt).toLocaleDateString()}</span>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{record.title}</p>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                  {record.summary}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={ActivitySquare}
                          title="No incident updates"
                          description="Vitals updates, appointments calendar updates, and SOS triggers display here."
                        />
                      )}
                    </div>
                  </Card>
                </ErrorBoundary>
              )}

              {/* ========================================================= */}
              {/* TAB 7: AI CHAT COMPANION PANEL */}
              {/* ========================================================= */}
              {activeTab === 'ai' && (
                <ErrorBoundary>
                  <Card className="p-6 border-slate-200 animate-fade-in">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">AI Health Assistant</h3>
                        <p className="text-xs text-slate-500">Dosing guidance, ingredient checkers, and health alerts lookup.</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Helio AI can analyze your active medications list and latest blood pressure logs to supply non-diagnostic support metrics.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button 
                          onClick={() => setShowChatBot(true)}
                          className="p-3.5 text-left rounded-xl bg-white border border-slate-150 hover:border-emerald-300 hover:bg-emerald-50/20 text-xs font-bold text-slate-700 transition-all flex justify-between items-center"
                        >
                          <span>Check my medications side effects</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                        <button 
                          onClick={() => setShowChatBot(true)}
                          className="p-3.5 text-left rounded-xl bg-white border border-slate-150 hover:border-emerald-300 hover:bg-emerald-50/20 text-xs font-bold text-slate-700 transition-all flex justify-between items-center"
                        >
                          <span>How can I improve my adherence score?</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                      </div>
                      <div className="pt-2">
                        <Button onClick={() => setShowChatBot(true)} className="w-full text-xs py-3 font-bold">
                          <MessageCircle className="h-4.5 w-4.5" />
                          Open Chatbot Console
                        </Button>
                      </div>
                    </div>
                  </Card>
                </ErrorBoundary>
              )}

              {/* ========================================================= */}
              {/* TAB 8: SUPPORT CIRCLE (FAMILY) */}
              {/* ========================================================= */}
              {activeTab === 'family' && (
                <ErrorBoundary>
                  <Card className="p-6 border-slate-200 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-6">
                      <h3 className="font-extrabold text-slate-900 text-sm">Emergency Support Circle</h3>
                      <Users className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="space-y-4">
                      {careData.profile?.familyMembers?.length ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {careData.profile.familyMembers.map((member, index) => (
                            <div key={`${member.name}-${index}`} className="flex justify-between items-center rounded-2xl bg-slate-50 border border-slate-150 px-4 py-3 text-xs shadow-sm">
                              <div>
                                <p className="font-bold text-slate-900">{member.name}</p>
                                <p className="text-[10px] text-slate-500 capitalize">{member.relationship} • {member.phone}</p>
                              </div>
                              <IconButton label="Delete contact" onClick={() => handleRemoveFamilyMember(index)} className="h-8 w-8 text-red-500 border-0 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Users}
                          title="No support circle linked"
                          description="Configure emergency contact names and phone numbers to receive panic dispatches."
                        />
                      )}

                      {showFamilyForm ? (
                        <form onSubmit={handleAddFamilyMember} className="bg-slate-50 p-5 rounded-2xl space-y-4 border border-slate-200 max-w-md animate-rise-in">
                          <Field label="Full Name">
                            <input className="input-field bg-white text-sm" type="text" value={familyInput.name} onChange={(e) => setFamilyInput({ ...familyInput, name: e.target.value })} placeholder="Alex Morgan" required />
                          </Field>
                          <div className="grid grid-cols-2 gap-2">
                            <Field label="Relationship">
                              <select className="input-field bg-white text-sm" value={familyInput.relationship} onChange={(e) => setFamilyInput({ ...familyInput, relationship: e.target.value })}>
                                  <option value="spouse">Spouse</option>
                                  <option value="parent">Parent</option>
                                  <option value="child">Child</option>
                                  <option value="sibling">Sibling</option>
                                  <option value="other">Other</option>
                              </select>
                            </Field>
                            <Field label="Phone number">
                              <input className="input-field bg-white text-sm" type="tel" value={familyInput.phone} onChange={(e) => setFamilyInput({ ...familyInput, phone: e.target.value })} placeholder="+1..." required />
                            </Field>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" type="button" onClick={() => setShowFamilyForm(false)}>Cancel</Button>
                            <Button size="sm" type="submit">Save contact</Button>
                          </div>
                        </form>
                      ) : (
                        <Button variant="secondary" className="w-full text-xs py-2.5 font-bold" onClick={() => setShowFamilyForm(true)}>
                          <Plus className="h-4.5 w-4.5" /> Add Family Profile
                        </Button>
                      )}
                    </div>
                  </Card>
                </ErrorBoundary>
              )}

              {/* ========================================================= */}
              {/* TAB 9: ALERTS & BULLETINS (NOTIFICATIONS CENTER) */}
              {/* ========================================================= */}
              {activeTab === 'notifications' && (
                <ErrorBoundary>
                  <Card className="p-6 border-slate-200 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-6">
                      <SectionHeader title="Alerts & Bulletins Center" description="Access instant medication alerts, system audits, and notes from linked clinicians." />
                      {unreadCount > 0 && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} Unread
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {careData.notifications?.length ? (
                        careData.notifications.map((notif) => {
                          const isUnread = !notif.read;
                          return (
                            <div 
                              key={notif._id} 
                              className={cn(
                                "rounded-2xl border p-4 flex justify-between items-start gap-4 transition-colors",
                                isUnread ? "bg-emerald-50/20 border-emerald-100" : "bg-slate-50/30 border-slate-150"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-55 text-emerald-800 shrink-0 mt-0.5">
                                  <Bell className="h-4.5 w-4.5 text-emerald-700" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                    {notif.title}
                                    {isUnread && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
                                    )}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                                  <span className="text-[9px] text-slate-400 font-bold block mt-2">
                                    {new Date(notif.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {isUnread && (
                                  <button
                                    onClick={() => handleMarkNotificationRead(notif._id)}
                                    className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm"
                                  >
                                    Read
                                  </button>
                                )}
                                <IconButton label="Remove alert" onClick={() => handleDeleteNotification(notif._id)} className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 border-0 shadow-none">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </IconButton>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <EmptyState
                          icon={Bell}
                          title="No notifications"
                          description="System logs and clinician connection requests appear here."
                        />
                      )}
                    </div>
                  </Card>
                </ErrorBoundary>
              )}
            </>
          )}

        </main>
      </div>

      {/* EMERGENCY SOS BANNER FLIGHT */}
      {isAlerting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
          <Card className="max-w-sm w-full p-8 text-center border-red-200 shadow-2xl bg-white/95">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-50 text-5xl font-bold text-red-600 animate-pulse">{countdown}</div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900 tracking-tight">Emergency SOS Dispatching</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-semibold">Sending real-time coordinates and medical information to emergency support circles and clinicians.</p>
            <Button variant="danger" className="mt-6 w-full" onClick={() => { setIsAlerting(false); setCountdown(10); }}>Cancel Alert</Button>
          </Card>
        </div>
      )}

      {/* FAB actions (SOS & Chat) */}
      {!isAlerting && (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
          <button 
            onClick={() => { setIsAlerting(true); setCountdown(10); }} 
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-105 active:scale-95 transition-all outline-none focus-visible:ring-4 focus-visible:ring-red-100"
            title="Trigger SOS alert"
            aria-label="SOS panic"
          >
            <Shield className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setShowChatBot(true)} 
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
            title="Open AI assistant"
            aria-label="Chat with assistant"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Modals & popup wrappers */}
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
      {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} user={user} medicines={todaysMedicines.filter(m => m.active !== false)} appointments={effectiveAppointments} />}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      {showMedicalRecords && <MedicalRecordsModal onClose={() => setShowMedicalRecords(false)} user={user} />}
      {showAppointmentSummary && selectedAppointment && (
        <AppointmentSummaryModal onClose={() => { setShowAppointmentSummary(false); setSelectedAppointment(null); }} appointment={selectedAppointment} onSaveSummary={handleSaveAppointmentSummary} />
      )}
    </>
  );
};

export default Dashboard;

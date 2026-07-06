import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, Clock, FileText, LogOut, Pill, Search, ShieldCheck, 
  Stethoscope, UserRound, Plus, Check, X as CancelIcon, MessageSquare, 
  HeartPulse, Menu, X, Bell, Calendar, Settings, HelpCircle, Activity, 
  Sparkles, Layers, Sliders, Contrast, ShieldAlert
} from 'lucide-react';
import { BrandMark, Button, Card, EmptyState, Field, SectionHeader, StatCard, IconButton } from './design-system';
import { apiRequest } from '../utils/api';

// Child components
import DoctorLanding from './doctor/DoctorLanding';
import PatientDirectory from './doctor/PatientDirectory';
import PatientProfileView from './doctor/PatientProfileView';
import ConsultationWorkspace from './doctor/ConsultationWorkspace';
import SmartCalendar from './doctor/SmartCalendar';
import AIConsultantPanel from './doctor/AIConsultantPanel';
import NotificationHub from './doctor/NotificationHub';
import PrescriptionConsole from './doctor/PrescriptionConsole';
import AttentionWorklist from './doctor/AttentionWorklist';

export default function DoctorDashboard({ user, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientDetail, setPatientDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // Navigation & Menu Toggles
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Theme & A11y Toggles
  const [highContrast, setHighContrast] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Link patient code state
  const [linkCode, setLinkCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  
  // Note logger local states
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Global search input & suggestions dropdown
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Load patient directory lists
  const loadDoctorDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/health/doctor-dashboard');
      const loadedPatients = data.patients || [];
      setPatients(loadedPatients);
      
      if (loadedPatients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(loadedPatients[0].id);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load detailed patient records
  const loadPatientDetails = async (patientId) => {
    if (!patientId) return;
    try {
      setIsLoadingDetail(true);
      const data = await apiRequest(`/health/doctor/patient-details/${patientId}`);
      setPatientDetail(data);
    } catch (err) {
      console.error('Failed to load patient records:', err);
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

  // LINK PATIENT ACCESS CODE TO DIRECTORY
  const handleLinkPatient = async (e) => {
    if (e) e.preventDefault();
    if (!linkCode.trim()) return;
    
    setIsLinking(true);
    setLinkError('');
    setLinkSuccess('');
    try {
      const response = await apiRequest('/health/doctor/link-patient', {
        method: 'POST',
        body: JSON.stringify({ accessCode: linkCode.trim() })
      });
      setLinkSuccess(response.message || 'Patient link established successfully.');
      setLinkCode('');
      await loadDoctorDashboard();
      if (response.patient?.id) {
        setSelectedPatientId(response.patient.id);
      }
    } catch (err) {
      setLinkError(err.message || 'Failed to dispatch clinical link request.');
    } finally {
      setIsLinking(false);
    }
  };

  // ADD CLINICAL NOTE TO ACTIVE PATIENT
  const handleAddNote = async ({ title, content, category }) => {
    if (!selectedPatientId || !title.trim() || !content.trim()) return;
    setIsSavingNote(true);
    try {
      await apiRequest('/health/doctor/notes', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatientId,
          title,
          content,
          category
        })
      });
      await loadPatientDetails(selectedPatientId);
    } catch (err) {
      alert(err.message || 'Failed to write clinical consultation note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  // UPDATE APPOINTMENT STATUS
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
      alert(err.message || 'Failed to update appointment status.');
    }
  };

  // Filter for global header search
  const searchResults = patients.filter(p => 
    p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
    p.accessCode?.toLowerCase().includes(globalSearch.toLowerCase())
  );

  const handleSearchResultClick = (patientId) => {
    setSelectedPatientId(patientId);
    setGlobalSearch('');
    setShowSearchDropdown(false);
    setActiveView('records');
  };

  // Master views router
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DoctorLanding 
            user={user}
            patients={patients}
            onSelectView={setActiveView}
            onSelectPatient={(id) => { setSelectedPatientId(id); setActiveView('records'); }}
            onStartConsultation={(id) => { setSelectedPatientId(id); setActiveView('consultations'); }}
            onOpenPrescription={() => setActiveView('prescriptions')}
            onOpenReportUpload={() => setActiveView('records')}
          />
        );
      case 'attention':
        return (
          <AttentionWorklist 
            onSelectPatient={(id) => { setSelectedPatientId(id); setActiveView('records'); }}
            onAddNote={handleAddNote}
          />
        );
      case 'patients':
        return (
          <PatientDirectory 
            patients={patients}
            onSelectPatient={(id) => { setSelectedPatientId(id); setActiveView('records'); }}
            onSelectView={setActiveView}
            onStartConsultation={(id) => { setSelectedPatientId(id); setActiveView('consultations'); }}
          />
        );
      case 'records':
        return (
          <PatientProfileView 
            patientDetail={patientDetail}
            isLoadingDetail={isLoadingDetail}
            onStartConsultation={(id) => { setSelectedPatientId(id); setActiveView('consultations'); }}
            onAddNote={handleAddNote}
            isSavingNote={isSavingNote}
          />
        );
      case 'consultations':
        return (
          <ConsultationWorkspace 
            patientDetail={patientDetail}
            onAddNote={handleAddNote}
            isSavingNote={isSavingNote}
            onSelectView={setActiveView}
          />
        );
      case 'appointments':
        return (
          <SmartCalendar 
            appointments={patientDetail?.appointments || []}
            patients={patients}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          />
        );
      case 'prescriptions':
        return (
          <PrescriptionConsole 
            patients={patients}
            selectedPatientId={selectedPatientId}
          />
        );
      case 'ai-assistant':
        return (
          <AIConsultantPanel 
            patients={patients}
            selectedPatientId={selectedPatientId}
          />
        );
      case 'notifications':
        return (
          <NotificationHub 
            notifications={[]}
          />
        );
      case 'hospital':
        return (
          <div className="space-y-6 animate-rise-in">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hospital Command Room</h1>
              <p className="text-slate-500 text-sm mt-0.5">Clinical logs, duty cycles, and wing metrics.</p>
            </div>
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Wing Status Overview</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Wing Occupancy</span>
                  <span className="text-2xl font-extrabold text-slate-800 block mt-1">84%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Active Clinicians</span>
                  <span className="text-2xl font-extrabold text-emerald-800 block mt-1">12 On Duty</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">ICU Bed Availability</span>
                  <span className="text-2xl font-extrabold text-rose-800 block mt-1">3 Units Free</span>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6 animate-rise-in">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Analytics Dashboard</h1>
              <p className="text-slate-500 text-sm mt-0.5">Telemetry reports, adherence rates, and waiting indices.</p>
            </div>
            <Card className="p-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outcomes Indices</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Diabetic Target Met', value: '78%' },
                    { label: 'BP Targets Met', value: '85%' },
                    { label: 'Medication Adherence Avg', value: '88%' }
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700">{stat.label}</span>
                      <span className="font-extrabold text-emerald-800">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Demographics</h3>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[140px] flex items-center justify-center text-xs text-slate-500 font-semibold">
                  [ Demographics telemetry logs compiled ]
                </div>
              </div>
            </Card>
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-6 animate-rise-in">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinician Communication Channel</h1>
              <p className="text-slate-500 text-sm mt-0.5">Secure, HIPAA-compliant patient messaging.</p>
            </div>
            <Card className="p-6 text-center max-w-md mx-auto">
              <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">Secure Channels Engaged</h3>
              <p className="text-xs text-slate-500 mt-2">All correspondence is fully audited. Choose a patient from the registry to dispatch updates.</p>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6 animate-rise-in">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinician Workspace Settings</h1>
              <p className="text-slate-500 text-sm mt-0.5">Configure panels, notifications, and profile details.</p>
            </div>
            <Card className="p-6 max-w-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Workspace Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                  <span className="font-semibold text-slate-700">High Contrast Mode</span>
                  <input 
                    type="checkbox" 
                    checked={highContrast} 
                    onChange={() => setHighContrast(!highContrast)} 
                    className="h-4 w-4 accent-emerald-600 cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                  <span className="font-semibold text-slate-700">Audio Alerts (Telemetry flags)</span>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="h-4 w-4 accent-emerald-600 cursor-pointer" 
                  />
                </label>
              </div>
            </Card>
          </div>
        );
      default:
        return <div>View not implemented.</div>;
    }
  };

  // Nav items listing helper
  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'attention', label: 'Attention Worklist', icon: AlertTriangle },
    { id: 'patients', label: 'Patients Directory', icon: UserRound },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Patient Profile', icon: FileText },
    { id: 'consultations', label: 'Consultations Desk', icon: Stethoscope },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'hospital', label: 'Hospital Info', icon: ShieldCheck },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Sliders }
  ];

  if (isLoading) {
    return (
      <main className="page-shell grid place-items-center px-4">
        <Card className="p-8 text-center max-w-sm border-slate-200">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          <p className="font-semibold text-slate-700 text-sm">Loading Clinician Console...</p>
        </Card>
      </main>
    );
  }

  return (
    <div className={`page-shell min-h-screen flex flex-col ${highContrast ? 'contrast-125' : ''}`}>
      
      {/* HEADER SECTION (Top Bar) */}
      <header className="nav-glass sticky top-0 z-40">
        <div className="px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <IconButton 
              label="Toggle Sidebar Menu" 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="hidden lg:grid border-slate-200/60"
            >
              <Menu className="h-5 w-5" />
            </IconButton>
            <IconButton 
              label="Toggle Mobile Menu" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden border-slate-200/60"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </IconButton>
            <BrandMark label="Doctor Portal" subtitle="Clinician Cockpit" tone="record" />
          </div>

          {/* GLOBAL SEARCH IN HEADER */}
          <div className="hidden md:block flex-1 max-w-md relative">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setShowSearchDropdown(e.target.value.trim().length > 0);
                }}
                onFocus={() => { if(globalSearch.trim()) setShowSearchDropdown(true); }}
                placeholder="Global Patient Search (name, access code)..."
                className="input-field pl-9 py-2 text-xs"
                aria-label="Global clinical search"
              />
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {showSearchDropdown && (
              <Card className="absolute left-0 right-0 mt-2 max-h-[300px] overflow-y-auto z-50 p-2 shadow-lg border-slate-200">
                <div className="flex items-center justify-between p-2 border-b border-slate-100 mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Search Results</span>
                  <IconButton label="Close dropdown" onClick={() => setShowSearchDropdown(false)} className="h-6 w-6 border-0">
                    <X className="h-3 w-3" />
                  </IconButton>
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSearchResultClick(p.id)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.accessCode}</p>
                      </div>
                      <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">Active</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No patient results match.</p>
                )}
              </Card>
            )}
          </div>

          {/* TOP BAR ACTIONS */}
          <div className="flex items-center gap-2">
            <IconButton 
              label="Notifications" 
              onClick={() => setActiveView('notifications')}
              className="h-10 w-10 border-slate-200 text-slate-600 hover:text-emerald-700 relative"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-rose-600 rounded-full border-2 border-white" />
            </IconButton>

            <IconButton 
              label="Theme Toggle (Contrast)" 
              onClick={() => setHighContrast(!highContrast)} 
              className={`h-10 w-10 border-slate-200 ${highContrast ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'}`}
            >
              <Contrast className="h-4.5 w-4.5" />
            </IconButton>

            <IconButton 
              label="Help Desk" 
              onClick={() => setShowHelpModal(true)} 
              className="h-10 w-10 border-slate-200 text-slate-600"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </IconButton>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-extrabold text-slate-900 leading-tight">Dr. {user.name}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{user.specialty || 'Cardiologist'}</span>
            </div>

            <Button 
              variant="secondary" 
              onClick={onLogout} 
              size="sm" 
              className="min-h-9 px-3 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>

        </div>
      </header>

      {/* VIEW WORKSPACE SHELL */}
      <div className="flex-1 flex relative">
        
        {/* COLLAPSIBLE LEFT SIDEBAR */}
        <aside 
          className={`bg-white/80 border-r border-emerald-100/50 backdrop-blur-xl transition-all duration-300 z-30 lg:sticky lg:top-[68px] lg:h-[calc(100vh-68px)] hidden lg:flex flex-col justify-between shrink-0 py-6 ${
            isSidebarCollapsed ? 'w-[78px] px-3' : 'w-[250px] px-5'
          }`}
        >
          <nav className="space-y-1.5" aria-label="Main clinician workspace menu">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
                    isActive 
                      ? 'bg-emerald-700 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/40'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
          
          <div className={`pt-6 border-t border-slate-100 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            {!isSidebarCollapsed && (
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{user.name}</p>
                <p className="text-[9px] text-slate-400 font-semibold">{user.email}</p>
              </div>
            )}
          </div>
        </aside>

        {/* MOBILE MENU NAV DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-[68px] z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden">
            <aside className="bg-white w-[250px] h-full shadow-xl flex flex-col justify-between py-6 px-5 border-r border-slate-200 animate-slide-in">
              <nav className="space-y-1.5" aria-label="Mobile clinician workspace menu">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-emerald-700 text-white shadow-sm' 
                          : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/40'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* MAIN VIEWPORT COMPONENT CONTAINER */}
        <main className="flex-1 px-5 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {renderActiveView()}
          </div>
        </main>

      </div>

      {/* HELP INSTRUCTION MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="surface-card-strong max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <HelpCircle className="h-6 w-6 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">Clinician Workspace Guide</h2>
            </div>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>• <strong>Global Search:</strong> Accessible in top header to search patient by name or unique ID.</p>
              <p>• <strong>Smart Calendar:</strong> Drag-and-drop simulation by rescheduling. Identifies slot overlaps.</p>
              <p>• <strong>Copilot Panel:</strong> Assess drug compatibility and generate consultation draft cards.</p>
              <p>• <strong>Allergy Warner:</strong> Auto-flags allergen cautions when prescribing conflicting drugs.</p>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="primary" size="sm" onClick={() => setShowHelpModal(false)} className="text-xs min-h-9 px-4">Got it</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

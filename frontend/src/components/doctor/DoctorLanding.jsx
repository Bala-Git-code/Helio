import React from 'react';
import { 
  Users, CheckCircle2, Clock, FileText, AlertTriangle, Activity, 
  Play, ClipboardList, PlusCircle, ArrowRight, MessageSquare, 
  Sparkles, ShieldAlert, HeartPulse, RefreshCw
} from 'lucide-react';
import { Card, StatCard, Button, IconButton } from '../design-system';

export default function DoctorLanding({ 
  user, 
  patients = [], 
  appointments = [],
  notifications = [],
  onSelectView,
  onSelectPatient,
  onStartConsultation,
  onOpenPrescription,
  onOpenReportUpload,
  unreadMessagesCount = 3
}) {
  // Statistics Calculations
  const totalPatientsCount = patients.length || 8;
  const completedConsults = appointments.filter(a => a.status === 'completed').length || 2;
  const upcomingConsults = appointments.filter(a => a.status === 'scheduled').length || 6;
  const pendingReportsCount = 4;
  const emergencyCount = 1;
  const avgConsultTime = "14 min";
  const adherenceAlertsCount = 3;
  const criticalHealthAlerts = 2;

  // Mock patient queue
  const queuePatients = [
    {
      id: "p1",
      name: "Arthur Pendragon",
      age: 42,
      avatarColor: "bg-red-100 text-red-800 border-red-300",
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      conditions: ["Hypertension", "Type 2 Diabetes"],
      time: "09:00 AM",
      reason: "Routine diabetic check & bp monitoring",
      priority: "high",
      waitTime: "12 mins",
      status: "Waiting",
      riskLevel: "Critical"
    },
    {
      id: "p2",
      name: "Clara Oswald",
      age: 28,
      avatarColor: "bg-amber-100 text-amber-800 border-amber-300",
      bloodGroup: "A-",
      allergies: ["Sulfa drugs"],
      conditions: ["Asthma"],
      time: "09:30 AM",
      reason: "Asthma action plan update & prescription refill",
      priority: "medium",
      waitTime: "5 mins",
      status: "Waiting",
      riskLevel: "Moderate"
    },
    {
      id: "p3",
      name: "Bruce Banner",
      age: 54,
      avatarColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      bloodGroup: "B+",
      allergies: ["None"],
      conditions: ["Mild tachycardia"],
      time: "10:15 AM",
      reason: "Heart rate evaluation & ECG review",
      priority: "low",
      waitTime: "Scheduled",
      status: "Scheduled",
      riskLevel: "Normal"
    }
  ];

  // AI clinical insights lists
  const aiInsights = [
    {
      id: 1,
      title: "Drug-Drug Interaction warning",
      desc: "Clara Oswald is flagged for a potential interaction between her new inhaler and prescription antihistamines.",
      type: "interaction",
      severity: "high"
    },
    {
      id: 2,
      title: "Adherence Deviation notice",
      desc: "Arthur Pendragon missed 3 consecutive doses of Metformin this week. Adherence score dropped to 72%.",
      type: "adherence",
      severity: "medium"
    },
    {
      id: 3,
      title: "Follow-up Recommendation",
      desc: "Schedule lab work for Bruce Banner within 7 days to evaluate kidney markers before updating dosages.",
      type: "reminder",
      severity: "low"
    }
  ];

  return (
    <div className="space-y-8 animate-rise-in">
      
      {/* 1. Personal Greeting Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, Dr. {user?.name || 'Clinician'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Clinical Wing: <span className="text-emerald-800 font-semibold">{user?.hospital || 'Helio General Hospital'}</span> • Specialization: <span className="text-emerald-800 font-semibold">{user?.specialty || 'Internal Medicine'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => onSelectView('emergency')}
            className="flex items-center gap-1.5 shadow-md"
            aria-label="Activate Emergency Mode"
          >
            <ShieldAlert className="h-4 w-4 animate-pulse" />
            Emergency Mode
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => onSelectView('ai-assistant')}
            className="flex items-center gap-1.5"
            aria-label="Open AI Assistant Workspace"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI Panel
          </Button>
        </div>
      </div>

      {/* 2. Today's Overview Grid */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-4" aria-label="Today's Performance Metrics">
        <StatCard 
          icon={Users} 
          label="Patients Today" 
          value={totalPatientsCount} 
          detail="2 pending check-in" 
          tone="primary" 
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Completed Consultations" 
          value={`${completedConsults}/${totalPatientsCount}`} 
          detail="84% target completion" 
          tone="appointment" 
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Critical Health Alerts" 
          value={criticalHealthAlerts} 
          detail="Require immediate review" 
          tone="emergency" 
        />
        <StatCard 
          icon={Activity} 
          label="Avg Consultation Time" 
          value={avgConsultTime} 
          detail="Optimal workflow rate" 
          tone="ai" 
        />
      </section>

      {/* 3. Layered Content Area */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        
        {/* LEFT COMPONENT: Patient Queue Panel */}
        <section className="space-y-4" aria-labelledby="queue-heading">
          <div className="flex items-center justify-between">
            <h2 id="queue-heading" className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-700" />
              Patient Priority Queue
            </h2>
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Live Queue
            </span>
          </div>

          <Card className="divide-y divide-slate-100 p-2">
            {queuePatients.map((patient, index) => (
              <div 
                key={patient.id} 
                className="p-4 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 first:rounded-t-2xl last:rounded-b-2xl focus-within:ring-2 focus-within:ring-emerald-400"
              >
                {/* Patient Photo, Name, and Quick Specs */}
                <div className="flex items-start gap-3.5">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-sm ${patient.avatarColor}`}>
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{patient.name}</h3>
                      <span className="text-xs text-slate-400">({patient.age}y • {patient.bloodGroup})</span>
                      <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                        patient.priority === 'high' 
                          ? 'bg-rose-50 text-rose-800 border-rose-100'
                          : patient.priority === 'medium'
                          ? 'bg-amber-50 text-amber-800 border-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                      }`}>
                        {patient.priority} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Reason: <span className="text-slate-800 font-semibold">{patient.reason}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Time: {patient.time}
                      </span>
                      <span>•</span>
                      <span>Wait Time: <strong className="text-slate-600">{patient.waitTime}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Queue Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => onStartConsultation(patient.id)}
                    className="flex items-center gap-1 text-xs py-1.5 min-h-9"
                    aria-label={`Start consultation for ${patient.name}`}
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    Start
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      onSelectPatient(patient.id);
                      onSelectView('records');
                    }}
                    className="text-xs py-1.5 min-h-9"
                    aria-label={`View medical records for ${patient.name}`}
                  >
                    History
                  </Button>
                  <IconButton 
                    label="Quick Clinical Notes"
                    onClick={() => {
                      onSelectPatient(patient.id);
                      onSelectView('patients');
                    }}
                    className="h-9 w-9 bg-white border border-slate-200 text-slate-500 hover:text-emerald-700"
                  >
                    <ClipboardList className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </Card>
        </section>

        {/* RIGHT COMPONENT: AI Clinical Assistant Panel & Quick Actions */}
        <div className="space-y-6">
          
          {/* AI Clinical Assistant Widget */}
          <section className="space-y-3" aria-labelledby="ai-insights-heading">
            <h2 id="ai-insights-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-violet-700 animate-pulse" />
              AI Clinical Copilot Insights
            </h2>
            <Card className="p-5 border-violet-100 bg-gradient-to-br from-violet-50/10 via-indigo-50/10 to-emerald-50/10">
              <div className="space-y-4">
                {aiInsights.map((insight) => (
                  <div key={insight.id} className="flex gap-3">
                    <div className={`mt-0.5 grid h-7 w-7 place-items-center rounded-lg border ${
                      insight.severity === 'high' 
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : insight.severity === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {insight.severity === 'high' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Activity className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-900">{insight.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{insight.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Powered by HELIO AI Clinician Console</span>
                <button 
                  onClick={() => onSelectView('ai-assistant')} 
                  className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 transition-colors"
                >
                  Configure Copilot <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </Card>
          </section>

          {/* Quick Actions Shortcuts */}
          <section className="space-y-3" aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="text-lg font-bold text-slate-900">
              Clinician Quick Actions
            </h2>
            <Card className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Start Consultation', icon: Play, action: () => onStartConsultation('p1'), tone: 'primary' },
                { label: 'New Prescription', icon: PlusCircle, action: () => onSelectView('prescriptions'), tone: 'appointment' },
                { label: 'Upload Report', icon: FileText, action: onOpenReportUpload, tone: 'record' },
                { label: 'Approve Access', icon: CheckCircle2, action: () => onSelectView('notifications'), tone: 'ai' },
                { label: 'Unread Messages', icon: MessageSquare, action: () => onSelectView('messages'), count: unreadMessagesCount, tone: 'warning' },
                { label: 'Patient Search', icon: Users, action: () => onSelectView('patients'), tone: 'primary' }
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={act.action}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-emerald-100 hover:bg-slate-50/50 transition-all text-center focus:ring-2 focus:ring-emerald-400 focus:outline-none relative"
                  >
                    {act.count ? (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                        {act.count}
                      </span>
                    ) : null}
                    <div className="h-9 w-9 grid place-items-center rounded-xl bg-slate-50 text-slate-600 mb-2">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">{act.label}</span>
                  </button>
                );
              })}
            </Card>
          </section>
          
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Pill, Clock, AlertTriangle, CheckCircle2, ChevronRight, 
  Plus, X, Trash2, Calendar, TrendingUp, Bell, Sparkles, 
  HelpCircle, ChevronLeft, Volume2, ShieldAlert, ArrowRight, 
  Settings, Check, Send, RotateCcw, AlertCircle
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { Card, Button, IconButton, EmptyState, SectionHeader, StatCard, cn } from './design-system';

// ==========================================
// 1. HELPER: FORMAT DURATION & TIME
// ==========================================
const formatTimeRemaining = (targetTimeStr) => {
  if (!targetTimeStr || targetTimeStr === 'As Needed') return '';
  const now = new Date();
  const [h, m] = targetTimeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  
  let diffMs = target - now;
  if (diffMs < 0) {
    // If target is in the past, calculate for tomorrow
    target.setDate(target.getDate() + 1);
    diffMs = target - now;
  }
  
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m remaining`;
  }
  return `${mins}m remaining`;
};

// ==========================================
// 2. PATIENT MEDICATION HOME
// ==========================================
export function MedicationHome({ doseInstances, refillData, adherence, doctorGuidance, onSelectSubTab, onSelectMedicine }) {
  const activeMedicines = refillData || [];
  const upcomingDoses = doseInstances.filter(d => d.status === 'Upcoming' || d.status === 'Due');
  const nextDose = upcomingDoses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0];
  const overdueDoses = doseInstances.filter(d => d.status === 'Missed' || d.status === 'Due');
  const completedDoses = doseInstances.filter(d => d.status === 'Taken On Time' || d.status === 'Taken Late');
  
  const completionProgress = doseInstances.length > 0 
    ? Math.round((completedDoses.length / doseInstances.length) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-rise-in">
      {/* Overview Dashboard Header */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={CheckCircle2} 
          label="Today's Progress" 
          value={`${completedDoses.length} / ${doseInstances.length}`} 
          detail={`${completionProgress}% Doses Completed`}
          tone="primary"
        />
        <StatCard 
          icon={TrendingUp} 
          label="7-Day Adherence" 
          value={`${adherence?.overallAdherence || 88}%`} 
          detail="Target: 95% for efficacy"
          tone={adherence?.overallAdherence >= 85 ? 'primary' : 'warning'}
        />
        <StatCard 
          icon={Pill} 
          label="Active Treatments" 
          value={activeMedicines.length} 
          detail={`${activeMedicines.filter(m => m.isLowStock).length} need refill soon`}
          tone="appointment"
        />
        <StatCard 
          icon={Clock} 
          label="Next Intake Scheduled" 
          value={nextDose ? nextDose.scheduledTime : 'None'} 
          detail={nextDose ? formatTimeRemaining(nextDose.scheduledTime) : 'No more doses today'}
          tone="ai"
        />
      </div>

      {/* Focus View Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next Dose Focus Card */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between border-emerald-100 bg-emerald-50/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="section-kicker">Time-Critical Focus</span>
              {nextDose && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-pulse">
                  {formatTimeRemaining(nextDose.scheduledTime)}
                </span>
              )}
            </div>
            
            {nextDose ? (
              <div className="mt-5 flex gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg">
                  <Pill className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{nextDose.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{nextDose.dosage} • Expected at {nextDose.scheduledTime}</p>
                  {nextDose.foodInstruction && nextDose.foodInstruction !== 'none' && (
                    <span className="inline-block mt-2 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium capitalize">
                      Instruction: {nextDose.foodInstruction}
                    </span>
                  )}
                  {nextDose.specialInstructions && (
                    <p className="text-xs text-slate-500 mt-1 italic">"{nextDose.specialInstructions}"</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-800 mt-3 text-lg">All Done for Today!</h4>
                <p className="text-sm text-slate-500 mt-1">You have taken all scheduled medications today.</p>
              </div>
            )}
          </div>

          {nextDose && (
            <div className="mt-8 flex gap-3">
              <Button onClick={() => onSelectSubTab('today')} className="flex-1">
                View Today's Care Plan
              </Button>
              <Button onClick={() => onSelectMedicine(nextDose.medicationId)} variant="secondary">
                View Instructions
              </Button>
            </div>
          )}
        </Card>

        {/* Action / Adherence summary */}
        <div className="space-y-6">
          {/* Overdue Alert banner */}
          {overdueDoses.filter(d => d.status === 'Missed').length > 0 && (
            <div className="rounded-[var(--radius-xl)] border border-rose-100 bg-rose-50/70 p-5 flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-600 text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-rose-900 text-sm">Overdue Attention Required</h4>
                <p className="text-xs text-rose-700 mt-1">
                  You have {overdueDoses.filter(d => d.status === 'Missed').length} missed dose(s) today. Clinicians advise logging status to prevent gaps.
                </p>
                <button onClick={() => onSelectSubTab('today')} className="text-xs font-bold text-rose-800 mt-2 block underline">
                  Resolve Now
                </button>
              </div>
            </div>
          )}

          {/* Refill Alerts */}
          <Card className="p-5 border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Upcoming Refill Alerts
            </h4>
            <div className="mt-4 space-y-3">
              {activeMedicines.filter(m => m.isLowStock).length > 0 ? (
                activeMedicines.filter(m => m.isLowStock).map(med => (
                  <div key={med.medicineId} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                    <div>
                      <p className="font-bold text-slate-800">{med.name}</p>
                      <p className="text-slate-500 mt-0.5">{med.quantity} pills left (Est. {med.daysRemaining} days)</p>
                    </div>
                    <Button onClick={() => onSelectSubTab('refills')} size="sm" variant="secondary" className="h-8 px-2.5 text-[10px]">
                      Refill
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic py-2">All supply quantities are within safe levels.</p>
              )}
            </div>
          </Card>

          {/* Clinical Guidance Box */}
          {doctorGuidance && (
            <div className="rounded-[var(--radius-xl)] border border-sky-100 bg-sky-50/40 p-5">
              <h4 className="font-bold text-sky-900 text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-sky-600" />
                Recent Physician Guidance
              </h4>
              <p className="text-xs text-sky-800 mt-2 leading-relaxed">
                "{doctorGuidance.content || 'Please follow your prescription times carefully. Let me know if you experience headaches.'}"
              </p>
              <p className="text-[10px] text-sky-500 mt-2 font-bold">— Dr. Gregory House</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. TODAY'S CARE PLAN
// ==========================================
export function TodayCarePlan({ doseInstances, onTake, onSkip, onSnooze, onShowInstructions }) {
  const [activeDialog, setActiveDialog] = useState(null); // 'skip' | 'snooze' | 'note'
  const [selectedInstance, setSelectedInstance] = useState(null);
  
  // Categorize doses into Morning (05-12), Afternoon (12-17), Evening (17-21), Night (21-05), and As Needed
  const categorizeDose = (timeStr) => {
    if (timeStr === 'As Needed') return 'As Needed';
    const [hours] = timeStr.split(':').map(Number);
    if (hours >= 5 && hours < 12) return 'Morning';
    if (hours >= 12 && hours < 17) return 'Afternoon';
    if (hours >= 17 && hours < 21) return 'Evening';
    return 'Night';
  };

  const sections = ['Morning', 'Afternoon', 'Evening', 'Night', 'As Needed'];
  const categorized = sections.reduce((acc, curr) => {
    acc[curr] = doseInstances.filter(d => categorizeDose(d.scheduledTime) === curr);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case 'Taken On Time': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Taken Late': return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Skipped': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Missed': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Snoozed': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Due': return 'bg-sky-50 text-sky-800 border-sky-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-rise-in">
      <SectionHeader 
        title="Today's Care Plan" 
        description="Verify your schedule blocks. Mark doses as taken, snooze notifications, or log skips traceably." 
      />

      <div className="space-y-6">
        {sections.map(section => {
          const list = categorized[section] || [];
          if (list.length === 0) return null;
          return (
            <div key={section} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">{section}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {list.map(instance => (
                  <article 
                    key={instance.id} 
                    className={cn(
                      "rounded-2xl border bg-white p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:border-slate-350",
                      instance.status.startsWith('Taken') && "opacity-80 bg-slate-50/50"
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm",
                            instance.isAsNeeded ? "bg-indigo-600" : "bg-emerald-600"
                          )}>
                            <Pill className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 leading-tight">{instance.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{instance.dosage} • {instance.scheduledTime}</p>
                          </div>
                        </div>
                        <span className={cn("text-[10px] font-bold uppercase border px-2 py-0.5 rounded-md", getStatusColor(instance.status))}>
                          {instance.status}
                        </span>
                      </div>

                      {instance.foodInstruction && instance.foodInstruction !== 'none' && (
                        <p className="text-xs text-slate-600 mt-3 font-medium bg-slate-50 px-2 py-1 rounded inline-block capitalize">
                          Intake: {instance.foodInstruction}
                        </p>
                      )}
                      
                      {instance.note && (
                        <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Note:</p>
                          <p className="text-xs text-slate-600 mt-0.5 italic">"{instance.note}"</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {!instance.status.startsWith('Taken') && instance.status !== 'Skipped' ? (
                        <>
                          <Button 
                            onClick={() => onTake(instance.medicationId, instance.timeSlot)} 
                            size="sm" 
                            className="bg-emerald-700 hover:bg-emerald-800 shadow-none text-xs"
                          >
                            Mark Taken
                          </Button>
                          {!instance.isAsNeeded && (
                            <Button 
                              onClick={() => { setSelectedInstance(instance); setActiveDialog('snooze'); }} 
                              size="sm" 
                              variant="secondary" 
                              className="text-xs"
                            >
                              Snooze
                            </Button>
                          )}
                          <Button 
                            onClick={() => { setSelectedInstance(instance); setActiveDialog('skip'); }} 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            Skip
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold py-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Logged at {new Date(instance.takenAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      <Button onClick={() => onShowInstructions(instance.medicationId)} size="sm" variant="ghost" className="text-xs ml-auto">
                        Details
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeDialog === 'snooze' && (
        <SnoozeDialog 
          instance={selectedInstance} 
          onClose={() => { setActiveDialog(null); setSelectedInstance(null); }} 
          onSubmit={(duration) => {
            onSnooze(selectedInstance.medicationId, duration);
            setActiveDialog(null);
            setSelectedInstance(null);
          }}
        />
      )}

      {activeDialog === 'skip' && (
        <SkipDoseDialog 
          instance={selectedInstance} 
          onClose={() => { setActiveDialog(null); setSelectedInstance(null); }} 
          onSubmit={(reason, note) => {
            onSkip(selectedInstance.medicationId, selectedInstance.timeSlot, reason, note);
            setActiveDialog(null);
            setSelectedInstance(null);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// 4. SNOOZE / SKIP DIALOGS
// ==========================================
function SnoozeDialog({ instance, onClose, onSubmit }) {
  const [duration, setDuration] = useState(15);
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 space-y-6 border-slate-200">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Snooze Dose Reminder</h3>
          <p className="text-xs text-slate-500 mt-1">This delays reminder notifications temporarily for {instance.name} without altering the prescription schedule.</p>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {[15, 30, 60].map(mins => (
            <button 
              key={mins}
              onClick={() => setDuration(mins)}
              className={cn(
                "p-3 rounded-xl border text-xs font-bold transition-all",
                duration === mins 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800" 
                  : "border-slate-200 hover:border-emerald-300"
              )}
            >
              {mins} Minutes
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <Button onClick={onClose} variant="secondary" className="flex-1 text-xs">Cancel</Button>
          <Button onClick={() => onSubmit(duration)} className="flex-1 text-xs">Snooze Dose</Button>
        </div>
      </Card>
    </div>
  );
}

function SkipDoseDialog({ instance, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const reasons = [
    'Felt side effects',
    'Forgot while travelling',
    'Doctor advised temporary pause',
    'Felt better/no symptoms',
    'Fasting or empty stomach required',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 space-y-5 border-slate-200">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Log Skipped Dose</h3>
          <p className="text-xs text-slate-500 mt-1">
            Logging skipped doses provides accurate adherence analytics. Helio is a safe space; skip reasons help doctors support you.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Select Reason (Optional)</label>
          <select 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            className="input-field py-2.5 text-xs rounded-xl"
          >
            <option value="">-- Choose Reason --</option>
            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Add Note / Symptoms (Optional)</label>
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Felt slightly nauseous after the evening intake yesterday."
            className="input-field text-xs resize-none rounded-xl"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <Button onClick={onClose} variant="secondary" className="flex-1 text-xs">Cancel</Button>
          <Button onClick={() => onSubmit(reason, note)} className="flex-1 text-xs bg-rose-600 hover:bg-rose-700">Confirm Skip</Button>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 5. MEDICINE DETAIL EXPERIENCE
// ==========================================
export function MedicineDetailView({ medicineId, onClose, onToggleStatus, onRemove, onSavePreferences, onUpdateSchedule, onAdjustRefill }) {
  const [medicine, setMedicine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'schedule' | 'reminders' | 'refills'
  const [isSaving, setIsSaving] = useState(false);

  // Reminders config states
  const [channels, setChannels] = useState(['app']);
  const [leadTime, setLeadTime] = useState(0);

  // Refill config states
  const [supplyCount, setSupplyCount] = useState(0);
  const [refillThreshold, setRefillThreshold] = useState(5);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const res = await apiRequest(`/health/dashboard`);
        const med = res.medications.find(m => m._id === medicineId);
        if (med) {
          setMedicine(med);
          setChannels(med.reminderPreferences?.channels || ['app']);
          setLeadTime(med.reminderPreferences?.leadTimeMinutes || 0);
          setSupplyCount(med.quantity || 0);
          setRefillThreshold(med.refillThreshold || 5);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [medicineId]);

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mt-4" />
        <div className="h-40 bg-slate-200 rounded mt-6" />
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertTriangle className="h-10 w-10 text-slate-400 mx-auto" />
        <p className="mt-3 font-semibold">Medicine details not found.</p>
        <Button onClick={onClose} size="sm" className="mt-4">Back to List</Button>
      </div>
    );
  }

  const isClinicianControlled = !!medicine.prescribingDoctor;

  const handleSaveReminders = async () => {
    setIsSaving(true);
    try {
      await onSavePreferences(medicine._id, { channels, leadTimeMinutes: leadTime });
      alert('Reminder preferences updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustRefillLocal = async () => {
    setIsSaving(true);
    try {
      await onAdjustRefill(medicine._id, { quantity: supplyCount, refillThreshold });
      alert('Supply inventory updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update inventory.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      {/* Header Profile */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-slate-200">
        <div className="flex gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md">
            <Pill className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{medicine.name}</h2>
              {medicine.active === false && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase">Paused</span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {medicine.genericName ? `${medicine.genericName} • ` : ''}{medicine.dosage} ({medicine.form || 'tablet'})
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => onToggleStatus(medicine._id, medicine.active)} 
            variant="secondary"
            size="sm"
          >
            {medicine.active ? 'Pause Schedule' : 'Resume Schedule'}
          </Button>
          {!isClinicianControlled && (
            <IconButton label="Delete Medicine" onClick={() => onRemove(medicine._id)} className="h-10 w-10 border-red-200 hover:bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </IconButton>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100 text-xs font-bold text-slate-500 overflow-x-auto">
        {['overview', 'schedule', 'reminders', 'refills'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={cn(
              "py-2.5 px-4 border-b-2 capitalize whitespace-nowrap transition-colors",
              activeSection === tab ? "border-emerald-600 text-emerald-800" : "border-transparent hover:text-slate-800"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sections Content */}
      <Card className="p-6 border-slate-150 bg-white shadow-none">
        {activeSection === 'overview' && (
          <div className="space-y-5 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Purpose</span>
                <p className="text-slate-800 mt-1 font-medium">{medicine.purpose || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Active Ingredients</span>
                <p className="text-slate-800 mt-1 font-medium">{medicine.ingredients || medicine.name}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Duration</span>
                <p className="text-slate-800 mt-1 font-medium">
                  {new Date(medicine.startDate).toLocaleDateString()} — {medicine.endDate ? new Date(medicine.endDate).toLocaleDateString() : 'Ongoing'}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Source Authority</span>
                <p className="text-slate-800 mt-1 font-medium">
                  {isClinicianControlled ? 'Clinician Prescribed' : 'Patient Self-Entered'}
                </p>
              </div>
            </div>

            {isClinicianControlled && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-sky-850">
                <AlertCircle className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Clinician-Controlled Prescription</h5>
                  <p className="mt-1">
                    This medication schedule is linked to an authorized prescription. To ensure safety, dosage settings cannot be edited directly by the patient.
                  </p>
                </div>
              </div>
            )}

            {medicine.notes && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider mb-1">Dosing Instructions</span>
                <p className="text-slate-700 italic">"{medicine.notes}"</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'schedule' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Active Schedule Matrix</h4>
              <p className="text-xs text-slate-500 mt-0.5">Times the patient is expected to verify intake:</p>
            </div>
            
            <div className="flex gap-2">
              {medicine.times?.map(t => (
                <span key={t} className="chip bg-emerald-50 text-emerald-800 border-emerald-100 font-bold px-4 py-2">
                  <Clock className="h-3.5 w-3.5" />
                  {t}
                </span>
              ))}
            </div>

            {medicine.scheduleHistory?.length > 0 && (
              <div className="border-t border-slate-100 pt-5">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Schedule Audit Trace</h5>
                <div className="space-y-3">
                  {medicine.scheduleHistory.map((hist, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                      <div>
                        <p className="font-bold text-slate-700">Version {hist.version} schedule</p>
                        <p className="text-slate-500 mt-0.5">Times: {hist.times?.join(', ')} ({hist.frequency})</p>
                      </div>
                      <span className="text-slate-400">{new Date(hist.changedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'reminders' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Notification Channels</h4>
              <p className="text-xs text-slate-500 mt-0.5">Select delivery methods for daily reminders:</p>
            </div>

            <div className="space-y-3">
              {['app', 'whatsapp', 'push', 'email'].map(ch => (
                <label key={ch} className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.includes(ch)}
                    onChange={(e) => {
                      if (e.target.checked) setChannels([...channels, ch]);
                      else setChannels(channels.filter(c => c !== ch));
                    }}
                    className="h-4.5 w-4.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-250"
                  />
                  <span className="text-xs font-semibold text-slate-700 uppercase">{ch === 'app' ? 'In-App Alerts' : ch}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button onClick={handleSaveReminders} disabled={isSaving} size="sm">
                {isSaving ? 'Saving...' : 'Update Reminder Preferences'}
              </Button>
            </div>
          </div>
        )}

        {activeSection === 'refills' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Pill Inventory Tracking</h4>
              <p className="text-xs text-slate-500 mt-0.5">Adjust pill count counts and custom warning limits:</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Current Supply Quantity</label>
                <input 
                  type="number" 
                  value={supplyCount} 
                  onChange={(e) => setSupplyCount(Number(e.target.value))}
                  className="input-field text-xs py-2.5 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Refill Warning Threshold</label>
                <input 
                  type="number" 
                  value={refillThreshold} 
                  onChange={(e) => setRefillThreshold(Number(e.target.value))}
                  className="input-field text-xs py-2.5 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button onClick={handleAdjustRefillLocal} disabled={isSaving} size="sm">
                {isSaving ? 'Saving...' : 'Save Stock Levels'}
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={onClose} variant="secondary" size="sm">Back to Medications</Button>
      </div>
    </div>
  );
}

// ==========================================
// 6. ADD MEDICINE PROGRESSIVE WIZARD
// ==========================================
export function AddMedicineWizard({ onClose, onAdd, allergiesList }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    dosage: '',
    form: 'tablet',
    purpose: '',
    frequency: 'daily',
    times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    ingredients: '',
    foodInstruction: 'none',
    specialInstructions: '',
    reminderPreferences: ['app']
  });

  const [allergyWarning, setAllergyWarning] = useState('');

  useEffect(() => {
    if (!formData.ingredients || !allergiesList) {
      setAllergyWarning('');
      return;
    }
    const ingrs = formData.ingredients.toLowerCase().split(',').map(i => i.trim());
    const matched = allergiesList.filter(a => ingrs.some(i => i.includes(a.toLowerCase()) || a.toLowerCase().includes(i)));
    if (matched.length > 0) {
      setAllergyWarning(`Warning: Ingredients contain ${matched.join(', ').toUpperCase()}, which is listed under your allergies!`);
    } else {
      setAllergyWarning('');
    }
  }, [formData.ingredients, allergiesList]);

  const handleNext = () => {
    if (step === 1 && !formData.name) {
      alert('Please enter medicine name.');
      return;
    }
    if (step === 2 && !formData.dosage) {
      alert('Please specify dosage strength.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleConfirm = () => {
    if (allergyWarning) {
      const confirm = window.confirm(`${allergyWarning}\n\nDo you still want to proceed adding this medication?`);
      if (!confirm) return;
    }
    onAdd(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full p-6 sm:p-8 space-y-6 border-slate-200 bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step {step} of 6</span>
            <h3 className="text-xl font-bold text-slate-900">
              {step === 1 && 'Medicine Identity'}
              {step === 2 && 'Strength & Form'}
              {step === 3 && 'Frequency & Schedule'}
              {step === 4 && 'Dosing Instructions'}
              {step === 5 && 'Reminder preferences'}
              {step === 6 && 'Review & Activation'}
            </h3>
          </div>
          <IconButton label="Close wizard" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="space-y-4 py-2">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Medicine Brand Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Paracetamol"
                  className="input-field text-xs rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Generic Chemical Name (Optional)</label>
                <input 
                  type="text" 
                  value={formData.genericName} 
                  onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                  placeholder="e.g. Acetaminophen"
                  className="input-field text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Active Ingredients (Comma separated)</label>
                <input 
                  type="text" 
                  value={formData.ingredients} 
                  onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                  placeholder="e.g. Paracetamol 500mg, Caffeine 65mg"
                  className="input-field text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Treatment Purpose / Indication</label>
                <input 
                  type="text" 
                  value={formData.purpose} 
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="e.g. Chronic joint pain relief"
                  className="input-field text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Dosage Strength</label>
                <input 
                  type="text" 
                  value={formData.dosage} 
                  onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  placeholder="e.g. 500mg, 1 capsule, 5ml"
                  className="input-field text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Medication Form</label>
                <select 
                  value={formData.form} 
                  onChange={(e) => setFormData({...formData, form: e.target.value})}
                  className="input-field text-xs rounded-xl"
                >
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="liquid">Liquid / Syrup</option>
                  <option value="injection">Injection</option>
                  <option value="topical">Topical / Ointment</option>
                  <option value="inhaler">Inhaler</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Frequency</label>
                  <select 
                    value={formData.frequency} 
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    className="input-field text-xs rounded-xl"
                  >
                    <option value="daily">Daily</option>
                    <option value="twice-daily">Twice Daily</option>
                    <option value="three-times-daily">Three Times Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="as-needed">As Needed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="input-field text-xs rounded-xl"
                  />
                </div>
              </div>

              {formData.frequency !== 'as-needed' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 block">Intake Times (24h)</label>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, times: [...formData.times, '08:00']})}
                      className="text-xs text-emerald-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Time
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.times.map((time, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input 
                          type="time" 
                          value={time} 
                          onChange={(e) => {
                            const copy = [...formData.times];
                            copy[idx] = e.target.value;
                            setFormData({...formData, times: copy});
                          }}
                          className="input-field text-xs py-2 rounded-xl flex-1"
                        />
                        {formData.times.length > 1 && (
                          <IconButton label="Delete Slot" onClick={() => setFormData({...formData, times: formData.times.filter((_, i) => i !== idx)})} className="h-9 w-9 hover:bg-rose-50 text-rose-600 border-0">
                            <X className="h-4 w-4" />
                          </IconButton>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Food Instructions</label>
                <select 
                  value={formData.foodInstruction} 
                  onChange={(e) => setFormData({...formData, foodInstruction: e.target.value})}
                  className="input-field text-xs rounded-xl"
                >
                  <option value="none">No Preference / Non-specified</option>
                  <option value="before meals">Take before meals (empty stomach)</option>
                  <option value="after meals">Take after meals</option>
                  <option value="with meals">Take with meals</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Special Directions / Cautions</label>
                <textarea 
                  value={formData.specialInstructions} 
                  onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                  placeholder="e.g. Do not drink grapefruit juice. Do not split tablet."
                  className="input-field text-xs resize-none rounded-xl"
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700 block">Notification Channels</label>
              <div className="space-y-2">
                {['app', 'whatsapp', 'push', 'email'].map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer text-xs">
                    <input 
                      type="checkbox" 
                      checked={formData.reminderPreferences.includes(c)}
                      onChange={(e) => {
                        if (e.target.checked) setFormData({...formData, reminderPreferences: [...formData.reminderPreferences, c]});
                        else setFormData({...formData, reminderPreferences: formData.reminderPreferences.filter(x => x !== c)});
                      }}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-250"
                    />
                    <span className="uppercase font-semibold">{c === 'app' ? 'In-App Alerts' : c}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5 text-xs text-slate-700">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm">Schedule Summary Preview</h4>
                <p><strong>Medicine:</strong> {formData.name} ({formData.dosage})</p>
                <p><strong>Frequency:</strong> {formData.frequency}</p>
                <p><strong>Dose Timings:</strong> {formData.frequency === 'as-needed' ? 'Intake logged on-demand' : formData.times.join(', ')}</p>
                <p><strong>Food Intake:</strong> <span className="capitalize">{formData.foodInstruction}</span></p>
              </div>

              {allergyWarning && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800">
                  <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Clinical Safety Notice</h5>
                    <p className="mt-1">{allergyWarning}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          {step > 1 && (
            <Button onClick={handleBack} variant="secondary" className="flex-1 text-xs">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < 6 ? (
            <Button onClick={handleNext} className="flex-1 text-xs ml-auto">
              Next Step <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} className="flex-1 text-xs ml-auto bg-emerald-700 hover:bg-emerald-800">
              Activate Plan <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 7. PRESCRIPTION OCR EXTRACTION REVIEW
// ==========================================
export function PrescriptionMedicineReview({ extractedMedicines, onMergeLink, onCancel }) {
  const [list, setList] = useState(extractedMedicines || []);
  const [uncertainFlags, setUncertainFlags] = useState({});

  useEffect(() => {
    const flags = {};
    list.forEach((med, idx) => {
      if (!med.dosage || med.dosage.includes('?') || med.times?.length === 0) {
        flags[idx] = true;
      }
    });
    setUncertainFlags(flags);
  }, [list]);

  const handleFieldChange = (idx, field, value) => {
    const copy = [...list];
    copy[idx] = { ...copy[idx], [field]: value };
    setList(copy);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full p-6 sm:p-8 space-y-6 border-slate-200 bg-white max-h-[90vh] overflow-y-auto">
        <div>
          <span className="section-kicker">Gemini Vision AI OCR</span>
          <h3 className="text-xl font-bold text-slate-900 mt-2">Prescription Sync Extraction Review</h3>
          <p className="text-xs text-slate-500 mt-1">Review extracted schedules before saving. Items flagged in red require validation.</p>
        </div>

        <div className="space-y-4">
          {list.map((med, idx) => {
            const isUncertain = uncertainFlags[idx];
            return (
              <div 
                key={idx} 
                className={cn(
                  "border rounded-2xl p-4 space-y-3 transition-colors",
                  isUncertain ? "border-rose-200 bg-rose-50/10" : "border-slate-100 bg-slate-50/30"
                )}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Medication #{idx + 1}</h4>
                  {isUncertain && (
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase">
                      Low Confidence Data
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-500 block font-semibold">Medicine Name</label>
                    <input 
                      type="text" 
                      value={med.name} 
                      onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                      className={cn("input-field py-2 text-xs rounded-xl", isUncertain && "border-rose-350")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 block font-semibold">Dosage strength</label>
                    <input 
                      type="text" 
                      value={med.dosage} 
                      onChange={(e) => handleFieldChange(idx, 'dosage', e.target.value)}
                      className="input-field py-2 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-500 block font-semibold">Times</label>
                    <input 
                      type="text" 
                      value={med.times?.join(', ') || ''} 
                      onChange={(e) => handleFieldChange(idx, 'times', e.target.value.split(',').map(x => x.trim()))}
                      placeholder="e.g. 08:00, 20:00"
                      className="input-field py-2 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 block font-semibold">Dosing notes</label>
                    <input 
                      type="text" 
                      value={med.notes || ''} 
                      onChange={(e) => handleFieldChange(idx, 'notes', e.target.value)}
                      className="input-field py-2 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <Button onClick={onCancel} variant="secondary" className="flex-1 text-xs">Discard Import</Button>
          <Button onClick={() => onMergeLink(list)} className="flex-1 text-xs bg-indigo-700 hover:bg-indigo-800">
            Link and Sync Schedules <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 8. MEDICATION CALENDAR
// ==========================================
export function MedicationCalendar({ doseInstances, logs }) {
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  const getWeekDates = () => {
    const dates = [];
    const now = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className="space-y-6 animate-rise-in">
      <SectionHeader 
        title="Medication calendar" 
        description="Select a day to track compliance logs and scheduled timeline occurrences." 
      />

      <Card className="p-5 border-slate-150 bg-white">
        <div className="grid grid-cols-7 gap-2 text-center">
          {weekDates.map((date, idx) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === selectedDay.toDateString();
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(date)}
                className={cn(
                  "p-3 rounded-2xl flex flex-col items-center justify-between gap-2 border transition-all duration-200",
                  isSelected 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm" 
                    : "border-slate-100 hover:border-emerald-200"
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {date.toLocaleDateString([], { weekday: 'short' })}
                </span>
                <span className="text-base font-bold text-slate-800">
                  {date.getDate()}
                </span>
                {isToday && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>}
              </button>
            );
          })}
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h4 className="font-bold text-slate-800 text-sm mb-4">
            Schedule for {selectedDay.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
          </h4>
          
          <div className="space-y-3">
            {doseInstances.map(inst => (
              <div key={inst.id} className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Pill className="h-4.5 w-4.5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-800">{inst.name}</p>
                    <p className="text-slate-500 mt-0.5">{inst.dosage} at {inst.scheduledTime}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border uppercase",
                  inst.status.startsWith('Taken') ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-500"
                )}>
                  {inst.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 9. DOSE HISTORY VIEW
// ==========================================
export function DoseHistoryView({ logs }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    const medName = log.medicationId?.name || '';
    const matchesSearch = medName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'skipped' && log.skipped) || 
      (statusFilter === 'taken' && !log.skipped);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-rise-in">
      <SectionHeader 
        title="Dose History Logs" 
        description="Filter and search historical medication records. Access response notes and clinician audits." 
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          placeholder="Search medicine name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field text-xs py-2.5 rounded-xl flex-1"
        />

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field text-xs py-2.5 rounded-xl sm:w-48"
        >
          <option value="all">All Logs</option>
          <option value="taken">Taken</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <Card className="overflow-hidden border-slate-150">
        <div className="p-6">
          {filteredLogs.length > 0 ? (
            <div className="space-y-4">
              {filteredLogs.map(log => (
                <div key={log._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/20 text-xs hover:border-emerald-250 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-800 shrink-0">
                      <Pill className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{log.medicationId?.name || 'Medication'}</p>
                      <p className="text-slate-500 mt-0.5">Scheduled Slot: {log.timeSlot}</p>
                      {log.note && <p className="text-slate-600 mt-1 italic">"{log.note}"</p>}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase",
                      log.skipped ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-emerald-50 border-emerald-100 text-emerald-800"
                    )}>
                      {log.skipped ? 'Skipped' : 'Taken'}
                    </span>
                    <span className="text-slate-400 mt-1">{new Date(log.takenAt).toLocaleDateString()} at {new Date(log.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Pill} 
              title="No Dosing Logs found" 
              description="Refine your filters or search constraints to retrieve historical medication intake timelines." 
            />
          )}
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 10. ADHERENCE INSIGHTS
// ==========================================
export function AdherenceOverview({ adherence }) {
  if (!adherence) return null;
  return (
    <div className="space-y-6 animate-rise-in">
      <SectionHeader 
        title="Adherence Insights" 
        description="Verify overall consistency scores calculated directly from verified logs." 
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 border-slate-150 flex flex-col justify-between bg-emerald-50/10">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Overall Consistency Rate</h4>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Calculation: eligible dose schedules</p>
          </div>
          <div className="my-8 text-center">
            <span className="text-6xl font-extrabold text-slate-900">{adherence.overallAdherence || 88}%</span>
            <p className="text-xs text-slate-500 mt-2">Target recommended: &ge; 90% for active safety</p>
          </div>
          <div className="text-xs text-slate-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            Your adherence score is calculated by matching recorded dose logs against total expectation frequencies.
          </div>
        </Card>

        <Card className="md:col-span-2 p-6 border-slate-150 space-y-5">
          <h4 className="font-bold text-slate-800 text-sm">Adherence Indicators Breakdowns</h4>
          <div className="grid gap-4 grid-cols-2 text-center text-xs">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-slate-500 font-bold block uppercase tracking-wider">Total Expected</span>
              <span className="text-2xl font-bold text-slate-800 block mt-1">{adherence.totalExpected || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-slate-500 font-bold block uppercase tracking-wider">Total Taken</span>
              <span className="text-2xl font-bold text-emerald-800 block mt-1">{adherence.totalTaken || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-slate-500 font-bold block uppercase tracking-wider">Total Skipped</span>
              <span className="text-2xl font-bold text-slate-800 block mt-1">{adherence.totalSkipped || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-slate-500 font-bold block uppercase tracking-wider">Total Missed</span>
              <span className="text-2xl font-bold text-rose-800 block mt-1">{adherence.totalMissed || 0}</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculations per Medicine</h5>
            {adherence.breakdown?.map(med => (
              <div key={med.medicineId} className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">{med.name}</span>
                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{med.adherenceRate}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// 11. REFILL CENTER
// ==========================================
export function RefillCenter({ refillData, onAdjustSupply }) {
  const [editingId, setEditingId] = useState(null);
  const [adjustQty, setAdjustQty] = useState(30);

  const handleSaveAdjust = async (medId) => {
    try {
      await onAdjustSupply(medId, { quantity: adjustQty });
      setEditingId(null);
      alert('Pill stock adjusted.');
    } catch (err) {
      alert('Failed to save adjustment.');
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <SectionHeader 
        title="Refill Forecast Center" 
        description="Verify estimated run-out dates and manually adjust quantity inventories." 
      />

      <div className="grid gap-4 md:grid-cols-2">
        {refillData?.map(med => (
          <article key={med.medicineId} className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4 hover:border-emerald-250 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-800 text-base">{med.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Remaining Stock: {med.quantity} pills</p>
              </div>
              <span className={cn(
                "text-[10px] font-bold border px-2 py-0.5 rounded uppercase",
                med.isLowStock ? "bg-rose-50 border-rose-100 text-rose-850 animate-pulse" : "bg-emerald-50 border-emerald-100 text-emerald-800"
              )}>
                {med.isLowStock ? 'Low Stock Warning' : 'Safe stock'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 py-3">
              <div>
                <span className="text-slate-400 block font-semibold">Est. Days Left:</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{med.daysRemaining} days</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Predicted Run-out Date:</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{med.runOutDate || 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Forecast Confidence: <strong>{med.confidence}</strong></span>
              {editingId === med.medicineId ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="input-field text-xs py-1 px-2.5 rounded-lg w-16 border-slate-200"
                  />
                  <Button onClick={() => handleSaveAdjust(med.medicineId)} size="sm" className="h-8 px-2.5 text-[10px]">Save</Button>
                  <IconButton label="Cancel edit" onClick={() => setEditingId(null)} className="h-8 w-8 hover:bg-slate-50 border-0">
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              ) : (
                <Button onClick={() => { setEditingId(med.medicineId); setAdjustQty(med.quantity); }} size="sm" variant="secondary" className="h-8 px-3 text-[10px]">
                  Manual Update
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 12. REMINDER PREFERENCES
// ==========================================
export function ReminderPreferences({ config, onSave }) {
  const [quietStart, setQuietStart] = useState(config?.quietHoursStart || '22:00');
  const [quietEnd, setQuietEnd] = useState(config?.quietHoursEnd || '07:00');
  const [quietEnabled, setQuietEnabled] = useState(!!config?.quietHoursStart);
  
  const handleSaveLocal = () => {
    onSave({
      quietHoursStart: quietEnabled ? quietStart : '',
      quietHoursEnd: quietEnabled ? quietEnd : ''
    });
    alert('Global reminder preferences updated.');
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <SectionHeader 
        title="Global reminder preferences" 
        description="Configure fallback channel routing orders and quiet hours blocks." 
      />

      <Card className="p-6 border-slate-150 bg-white max-w-xl space-y-6">
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer text-xs font-bold">
            <input 
              type="checkbox" 
              checked={quietEnabled}
              onChange={(e) => setQuietEnabled(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-250"
            />
            <span>ENABLE QUIET HOURS (DO NOT REMIND)</span>
          </label>

          {quietEnabled && (
            <div className="grid gap-3 grid-cols-2 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 block font-semibold">Start Block</label>
                <input 
                  type="time" 
                  value={quietStart} 
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="input-field text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 block font-semibold">End Block</label>
                <input 
                  type="time" 
                  value={quietEnd} 
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="input-field text-xs rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Button onClick={handleSaveLocal} size="sm">Save Quiet Hours Settings</Button>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 13. WHATSAPP READINESS VIEW
// ==========================================
export function WhatsAppReadiness({ userPhone }) {
  const [consent, setConsent] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Enabled & Verified');

  return (
    <div className="space-y-6 animate-rise-in">
      <SectionHeader 
        title="WhatsApp Integration Readiness" 
        description="Verify WhatsApp connection metrics and caregiver notification consent permissions." 
      />

      <Card className="p-6 border-slate-150 bg-white max-w-lg space-y-5">
        <div className="flex justify-between items-center text-xs">
          <div>
            <p className="font-bold text-slate-800">Connection Status</p>
            <p className="text-slate-500 mt-0.5">Helio verified channel line</p>
          </div>
          <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase">
            {statusMsg}
          </span>
        </div>

        <div className="space-y-1 text-xs">
          <span className="text-slate-500 font-bold block">Patient Registered Phone</span>
          <p className="text-slate-800 font-medium border border-slate-100 p-2.5 rounded-lg bg-slate-50/50 mt-1">
            {userPhone || '+1 (555) 019-2834'}
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer text-xs pt-2">
          <input 
            type="checkbox" 
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setStatusMsg(e.target.checked ? 'Enabled & Verified' : 'Disabled');
            }}
            className="h-4.5 w-4.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-250"
          />
          <span>Consent to receive automated reminders and low-stock alerts on WhatsApp.</span>
        </label>

        <div className="border-t border-slate-100 pt-4 text-xs space-y-2">
          <h5 className="font-bold text-slate-800">Dose Message Delivery Logs (Simulator):</h5>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] p-2 bg-slate-50 rounded border border-slate-100">
              <span className="font-semibold text-slate-700">Dose due message (08:00 AM)</span>
              <span className="font-bold text-emerald-700">Delivered & Read</span>
            </div>
            <div className="flex justify-between items-center text-[11px] p-2 bg-slate-50 rounded border border-slate-100">
              <span className="font-semibold text-slate-700">Refill Alert message</span>
              <span className="font-bold text-emerald-700">Delivered</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 14. VOICE MEDICATION ASSISTANT
// ==========================================
export function VoiceMedicationInput({ onAddMedicine, onClose }) {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [parsedPayload, setParsedPayload] = useState(null);

  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setTranscript(text);
        
        const nameMatch = text.match(/add\s+([a-zA-Z\s]+)/i);
        const dosageMatch = text.match(/(\d+\s*mg|\d+\s*tablet[s]?)/i);
        
        const payload = {
          name: nameMatch ? nameMatch[1].trim() : 'Aspirin',
          dosage: dosageMatch ? dosageMatch[0] : '325mg',
          frequency: 'daily',
          times: ['08:00'],
          startDate: new Date().toISOString().split('T')[0]
        };
        setParsedPayload(payload);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.start();
    } else {
      alert('Voice dictation speech engines are unavailable in this browser client.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 space-y-6 border-slate-200 bg-white">
        <div>
          <span className="section-kicker">Helio Voice Engine</span>
          <h3 className="text-xl font-bold text-slate-900 mt-2">Dosing Voice Dictation</h3>
          <p className="text-xs text-slate-500 mt-1">Speak to record medication intake updates or append new schedules.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 gap-4">
          <button 
            onClick={startVoiceRecording} 
            className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-white transition-all",
              isRecording ? "bg-rose-500 animate-pulse scale-105" : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            <Volume2 className="h-7 w-7" />
          </button>
          <span className="text-xs text-slate-500 font-bold">
            {isRecording ? 'Listening carefully...' : 'Click to dictate (e.g. "Add Aspirin 500mg daily")'}
          </span>
        </div>

        {transcript && (
          <div className="space-y-3">
            <div className="text-xs p-3 bg-slate-100 rounded-lg italic">
              "{transcript}"
            </div>

            {parsedPayload && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-xs space-y-2 text-emerald-950">
                <h5 className="font-bold text-emerald-900">Extracted Dosing Details:</h5>
                <p><strong>Brand:</strong> {parsedPayload.name}</p>
                <p><strong>Strength:</strong> {parsedPayload.dosage}</p>
                <p><strong>Frequency:</strong> {parsedPayload.frequency}</p>
                <p><strong>Expectation times:</strong> {parsedPayload.times.join(', ')}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold italic">Requires audit approval to schedule.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <Button onClick={onClose} variant="secondary" className="flex-1 text-xs">Cancel</Button>
          <Button 
            onClick={() => {
              if (parsedPayload) {
                onAddMedicine(parsedPayload);
                onClose();
              } else {
                alert('Dictation must translate fields first.');
              }
            }} 
            className="flex-1 text-xs"
            disabled={!parsedPayload}
          >
            Confirm & Save
          </Button>
        </div>
      </Card>
    </div>
  );
}

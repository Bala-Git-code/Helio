import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, AlertOctagon, 
  CheckCircle, Plus, ToggleLeft, ToggleRight, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { Card, Button } from '../design-system';

export default function SmartCalendar({
  appointments = [],
  patients = [],
  onUpdateAppointmentStatus
}) {
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date('2026-07-04')); // Base mock date
  const [isDoctorAvailable, setIsDoctorAvailable] = useState(true);
  const [holidays, setHolidays] = useState(['2026-07-10']); // Mock holidays
  const [localAppointments, setLocalAppointments] = useState([
    {
      id: 'apt-1',
      patientName: 'Arthur Pendragon',
      patientId: 'p1',
      date: '2026-07-04',
      time: '09:00 AM',
      notes: 'Routine diabetic check & bp monitoring',
      status: 'scheduled'
    },
    {
      id: 'apt-2',
      patientName: 'Clara Oswald',
      patientId: 'p2',
      date: '2026-07-04',
      time: '09:30 AM',
      notes: 'Asthma action plan update & prescription refill',
      status: 'scheduled'
    },
    {
      id: 'apt-3',
      patientName: 'Bruce Banner',
      patientId: 'p3',
      date: '2026-07-04',
      time: '09:00 AM', // Conflict intentionally added to showcase details
      notes: 'Heart rate evaluation & ECG review',
      status: 'scheduled'
    },
    {
      id: 'apt-4',
      patientName: 'Diana Prince',
      patientId: 'p4',
      date: '2026-07-05',
      time: '11:00 AM',
      notes: 'Blood draw follow-up',
      status: 'scheduled'
    },
    {
      id: 'apt-5',
      patientName: 'Tony Stark',
      patientId: 'p5',
      date: '2026-07-06',
      time: '02:00 PM',
      notes: 'Cardiology review',
      status: 'completed'
    }
  ]);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState('');

  // Conflict Checker
  const checkConflicts = () => {
    const conflictGroups = {};
    localAppointments.forEach(apt => {
      if (apt.status === 'cancelled') return;
      const key = `${apt.date} ${apt.time}`;
      if (!conflictGroups[key]) {
        conflictGroups[key] = [];
      }
      conflictGroups[key].push(apt);
    });

    const conflicts = [];
    Object.keys(conflictGroups).forEach(key => {
      if (conflictGroups[key].length > 1) {
        conflicts.push({
          slot: key,
          items: conflictGroups[key]
        });
      }
    });
    return conflicts;
  };

  const conflictsList = checkConflicts();

  // Handlers
  const handleReschedule = (apt) => {
    setSelectedAppointment(apt);
    setNewTime(apt.time);
    setNewDate(apt.date);
    setShowRescheduleModal(true);
  };

  const saveReschedule = () => {
    if (!selectedAppointment) return;
    setLocalAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id 
        ? { ...apt, time: newTime, date: newDate }
        : apt
    ));
    setShowRescheduleModal(false);
    setSelectedAppointment(null);
  };

  const toggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'scheduled' ? 'completed' : 'scheduled';
    setLocalAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: nextStatus } : apt
    ));
  };

  const addHoliday = () => {
    const dateStr = newDate || '2026-07-10';
    if (!holidays.includes(dateStr)) {
      setHolidays([...holidays, dateStr]);
    }
  };

  // Helper date lists
  const weekDays = [
    { name: 'Sat', date: '2026-07-04', label: '04' },
    { name: 'Sun', date: '2026-07-05', label: '05' },
    { name: 'Mon', date: '2026-07-06', label: '06' },
    { name: 'Tue', date: '2026-07-07', label: '07' },
    { name: 'Wed', date: '2026-07-08', label: '08' },
    { name: 'Thu', date: '2026-07-09', label: '09' },
    { name: 'Fri', date: '2026-07-10', label: '10' }
  ];

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  return (
    <div className="space-y-6 animate-rise-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Smart Clinical Calendar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage consultations, detect scheduling conflicts, and manage duty slots.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsDoctorAvailable(!isDoctorAvailable)}
            className="flex items-center gap-2 text-xs py-2 min-h-9"
          >
            {isDoctorAvailable ? (
              <>
                <ToggleRight className="h-5 w-5 text-emerald-600" />
                Active on Duty
              </>
            ) : (
              <>
                <ToggleLeft className="h-5 w-5 text-slate-400" />
                Unavailable (Off Duty)
              </>
            )}
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => {
              setNewDate('2026-07-10');
              addHoliday();
            }}
            className="flex items-center gap-1 text-xs py-2 min-h-9"
          >
            <Plus className="h-4 w-4" /> Add Leave Day
          </Button>
        </div>
      </div>

      {/* CONFLICTS ALERT BANNER */}
      {conflictsList.length > 0 && (
        <Card className="p-4 border-rose-200 bg-rose-50/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-900">Clinical Scheduling Conflict Detected</h3>
            <p className="text-xs text-rose-700 mt-1">Multiple appointments are scheduled in overlapping time slots. Resolve immediately to prevent patient delays:</p>
            <div className="mt-2 space-y-1.5">
              {conflictsList.map((c, i) => (
                <div key={i} className="text-xs font-semibold text-slate-700 bg-white/70 p-2 rounded-xl border border-rose-100 flex items-center justify-between">
                  <span>Slot: <strong className="text-rose-900 font-mono">{c.slot}</strong> ({c.items.map(it => it.patientName).join(' & ')})</span>
                  <div className="flex gap-1.5">
                    {c.items.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => handleReschedule(item)}
                        className="text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-bold transition-all"
                      >
                        Reschedule {item.patientName.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* CALENDAR TABS & DATE CONTROLS */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {['day', 'week', 'month'].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                viewMode === m 
                  ? 'bg-white text-emerald-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <IconButton label="Previous" className="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <span className="text-sm font-bold text-slate-900 font-sans">
            Week of July 4 - July 10, 2026
          </span>
          <IconButton label="Next" className="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-md bg-emerald-100 border border-emerald-200 inline-block" /> Completed</span>
          <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-md bg-sky-50 border border-sky-100 inline-block" /> Scheduled</span>
          <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-md bg-rose-50 border border-rose-100 inline-block" /> Conflict Slot</span>
        </div>
      </Card>

      {/* TIMELINE VIEW (WEEK WORKSPACE GRID) */}
      {viewMode === 'week' && (
        <Card className="p-1.5 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-3 text-[10px] uppercase font-bold text-slate-400 w-[100px]">Time Slot</th>
                {weekDays.map((day) => {
                  const isHoliday = holidays.includes(day.date);
                  return (
                    <th key={day.date} className="p-3 text-center border-l border-slate-100/50">
                      <div className="text-xs font-bold text-slate-900">{day.name}</div>
                      <div className={`text-lg font-extrabold mt-1 h-8 w-8 rounded-full flex items-center justify-center mx-auto ${
                        day.date === '2026-07-04' 
                          ? 'bg-emerald-700 text-white shadow-sm' 
                          : isHoliday 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'text-slate-700'
                      }`}>
                        {day.label}
                      </div>
                      {isHoliday && <span className="text-[8px] font-bold text-red-600 block mt-0.5">Off Duty</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot} className="border-b border-slate-50/50 hover:bg-slate-50/10 h-16">
                  <td className="p-3 text-xs font-mono font-bold text-slate-400 align-middle">{slot}</td>
                  
                  {weekDays.map((day) => {
                    const slotHour = slot.split(':')[0];
                    const slotPeriod = slot.split(' ')[1];
                    const dayApts = localAppointments.filter(apt => 
                      apt.date === day.date && 
                      apt.time.startsWith(slotHour) && 
                      apt.time.endsWith(slotPeriod) &&
                      apt.status !== 'cancelled'
                    );

                    const isConflict = dayApts.length > 1;

                    return (
                      <td key={day.date} className="p-2 border-l border-slate-100/50 align-middle w-[150px] relative">
                        {dayApts.map((apt) => (
                          <div 
                            key={apt.id} 
                            onClick={() => handleReschedule(apt)}
                            className={`p-2.5 rounded-xl border text-[11px] leading-tight cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between h-[52px] ${
                              isConflict 
                                ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-sm animate-pulse'
                                : apt.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100/80 line-through'
                                : 'bg-sky-50/70 text-sky-900 border-sky-100'
                            }`}
                            title={`Click to reschedule ${apt.patientName}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold truncate w-[85%]">{apt.patientName}</span>
                              {apt.status === 'completed' && <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />}
                            </div>
                            <span className="text-[9px] text-slate-500 truncate mt-0.5">{apt.notes}</span>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {viewMode === 'day' && (
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-slate-400" />
              Day Timeline (July 4, 2026)
            </h3>
            <div className="space-y-3">
              {localAppointments.filter(a => a.date === '2026-07-04').map(apt => (
                <div key={apt.id} className="p-4 border border-slate-100 bg-slate-50/20 rounded-2xl flex items-center justify-between gap-4 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-extrabold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{apt.time}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{apt.patientName}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{apt.notes}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => toggleStatus(apt.id, apt.status)}
                      className="text-[10px] min-h-8 px-2.5 py-1"
                    >
                      {apt.status === 'completed' ? 'Reopen' : 'Mark Done'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleReschedule(apt)}
                      className="text-[10px] min-h-8 px-2.5 py-1"
                    >
                      Reschedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Daily Summary</h3>
              <p className="text-xs text-slate-600 leading-relaxed">You have <strong className="text-slate-800">3 consultations</strong> scheduled today.</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-50/50">
                  <span className="text-slate-600 font-bold">On Duty Hours</span>
                  <span className="text-emerald-800 font-extrabold">08:00 AM - 05:00 PM</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-indigo-50/50">
                  <span className="text-slate-600 font-bold">Total Duration</span>
                  <span className="text-indigo-800 font-extrabold">9.0 Hrs</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-500 mt-6 leading-normal">
              💡 <strong>Rescheduling Tip:</strong> Drags are simulated by pressing the "Reschedule" button next to any appointment to change the timeslot.
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'month' && (
        <Card className="p-6 text-center">
          <CalendarIcon className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">July 2026 Month Workspace</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Standard 35-day grid is compiled in the week view timeline. Use week toggler to reschedule items.</p>
        </Card>
      )}

      {/* RESCHEDULE CONSOLE MODAL */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="surface-card-strong max-w-sm w-full p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reschedule Consultation</h2>
              <p className="text-xs text-slate-500 mt-1">Adjust slot for patient <strong>{selectedAppointment.patientName}</strong></p>
            </div>
            
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-slate-700 block mb-1">Appointment Date</span>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="input-field py-2 text-xs" 
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700 block mb-1">Consultation Time</span>
                <select 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="input-field py-2 text-xs bg-white"
                >
                  {timeSlots.map((ts) => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setShowRescheduleModal(false)} className="text-xs min-h-9">Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveReschedule} className="text-xs min-h-9">Save Changes</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { 
  Bell, ShieldAlert, Pill, Calendar, FileText, CheckCircle, Trash2, 
  Sparkles, Check, X, ShieldCheck, MailOpen
} from 'lucide-react';
import { Card, Button } from '../design-system';

export default function NotificationHub({
  notifications = [],
  onUpdateNotificationStatus
}) {
  const [filter, setFilter] = useState('all');
  const [localNotifications, setLocalNotifications] = useState([
    {
      id: 'notif-1',
      category: 'emergency',
      title: 'Emergency: Tachycardia Flag',
      message: 'Arthur Pendragon logged a heart rate of 124 bpm. Review cardiovascular plan immediately.',
      priority: 'high',
      read: false,
      timestamp: '10 mins ago'
    },
    {
      id: 'notif-2',
      category: 'doctor',
      title: 'Access Request Approved',
      message: 'Patient Bruce Banner approved your request for medical timeline access. Historical logs are now synced.',
      priority: 'medium',
      read: false,
      timestamp: '1 hour ago'
    },
    {
      id: 'notif-3',
      category: 'medicine',
      title: 'Adherence Warning Alert',
      message: 'Arthur Pendragon fell below critical medication adherence index (now at 72%). Metformin missed.',
      priority: 'high',
      read: false,
      timestamp: '2 hours ago'
    },
    {
      id: 'notif-4',
      category: 'appointment',
      title: 'Appointment Request: Clara Oswald',
      message: 'Clara Oswald requested scheduling an asthma evaluation slot for Monday, July 6 at 10:00 AM.',
      priority: 'medium',
      read: true,
      timestamp: 'Yesterday'
    },
    {
      id: 'notif-5',
      category: 'system',
      title: 'Report Loaded: Lab Chemistry',
      message: 'Laboratory automation system uploaded renal and thyroid biochemistry reports for Bruce Banner.',
      priority: 'low',
      read: true,
      timestamp: '2 days ago'
    }
  ]);

  const markAllRead = () => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifs = localNotifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'emergency') return n.category === 'emergency';
    if (filter === 'consents') return n.category === 'doctor';
    if (filter === 'medicine') return n.category === 'medicine';
    if (filter === 'appointments') return n.category === 'appointment';
    return true;
  });

  const unreadCount = localNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-rise-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7 text-emerald-700" />
            Clinical Notification Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Audit patient requests, emergency telemetry, and access consent logs.</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={markAllRead}
              className="text-xs min-h-9 px-3 py-1 flex items-center gap-1.5"
            >
              <MailOpen className="h-4 w-4" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* FILTER BUTTONS & STATS */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'emergency', label: 'Emergency' },
            { id: 'consents', label: 'Consents' },
            { id: 'medicine', label: 'Medicine Alerts' },
            { id: 'appointments', label: 'Appointments' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all flex-1 md:flex-none text-center ${
                filter === cat.id 
                  ? 'bg-white text-emerald-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-slate-500 flex gap-4">
          <span>Unread alerts: <strong className="text-emerald-800 font-extrabold">{unreadCount}</strong></span>
          <span>Filtered showing: <strong className="text-slate-700 font-extrabold">{filteredNotifs.length}</strong></span>
        </div>
      </Card>

      {/* ALERTS ARCHIVE */}
      <div className="space-y-3">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map((notif) => (
            <Card 
              key={notif.id}
              className={`p-4 border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 ${
                !notif.read 
                  ? 'border-l-4 border-l-emerald-600 bg-white shadow-md' 
                  : 'border-slate-100 bg-slate-50/20'
              } ${
                notif.category === 'emergency' && !notif.read ? 'border-l-rose-500 border-rose-100' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 grid h-9 w-9 place-items-center rounded-xl border ${
                  notif.category === 'emergency' 
                    ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                    : notif.category === 'medicine'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : notif.category === 'appointment'
                    ? 'bg-sky-50 text-sky-700 border-sky-100'
                    : notif.category === 'doctor'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {notif.category === 'emergency' && <ShieldAlert className="h-4.5 w-4.5" />}
                  {notif.category === 'medicine' && <Pill className="h-4.5 w-4.5" />}
                  {notif.category === 'appointment' && <Calendar className="h-4.5 w-4.5" />}
                  {notif.category === 'doctor' && <ShieldCheck className="h-4.5 w-4.5" />}
                  {notif.category === 'system' && <FileText className="h-4.5 w-4.5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-sm">{notif.title}</h3>
                    {!notif.read && (
                      <span className="bg-rose-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        Unread
                      </span>
                    )}
                    <span className={`text-[8px] uppercase font-extrabold px-1.5 py-0.2 rounded border ${
                      notif.priority === 'high' 
                        ? 'bg-rose-50 text-rose-800 border-rose-100'
                        : notif.priority === 'medium'
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {notif.priority} priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-normal">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1.5">{notif.timestamp}</span>
                </div>
              </div>

              {/* ACTIONS BAR */}
              <div className="flex items-center gap-2 self-end sm:self-auto border-t sm:border-t-0 border-slate-100 w-full sm:w-auto pt-3.5 sm:pt-0 justify-end">
                {!notif.read && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => markRead(notif.id)}
                    className="text-[10px] min-h-8 px-2 py-1 flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" /> Mark Read
                  </Button>
                )}
                {notif.category === 'appointment' && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => alert('Appointment has been approved and placed in calendar schedule.')}
                    className="text-[10px] min-h-8 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white shadow-sm"
                  >
                    Confirm slot
                  </Button>
                )}
                <IconButton 
                  label="Dismiss notifications"
                  onClick={() => deleteNotification(notif.id)}
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 bg-white border border-slate-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center border-slate-200">
            <Bell className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">Archive is Clear</h3>
            <p className="text-xs text-slate-400 mt-1">No alerts registered in this category.</p>
          </Card>
        )}
      </div>

    </div>
  );
}

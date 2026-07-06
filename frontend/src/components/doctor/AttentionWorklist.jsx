import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Pill, User, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { Card, Button, IconButton } from '../design-system';
import { apiRequest } from '../../utils/api';

export default function AttentionWorklist({ onSelectPatient, onAddNote }) {
  const [attentionList, setAttentionList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const fetchWorklist = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await apiRequest('/doctors/medications/attention');
      if (res.success) {
        setAttentionList(res.attentionList || []);
      } else {
        setError('Failed to load attention list.');
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve clinical worklist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
  }, []);

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const handleSendReminder = async (alert) => {
    try {
      setSendingReminderId(alert.id);
      
      // Send clinical direct notification by creating a note of category "care-plan" for the patient
      if (onAddNote) {
        await onAddNote({
          patientId: alert.patientId,
          title: `Action Required: Medication Reminder`,
          content: `Dr. Greg House notes: We detected ${alert.reason === 'Sustained Non-Adherence' ? 'a drop in your medication adherence score' : 'a low supply count on your medications'}. Please review your Today's Plan and request refills if necessary.`,
          category: 'care-plan'
        });
        alert(`Direct adherence notification sent to ${alert.patientName}.`);
      } else {
        // Fallback standard notification post
        await apiRequest('/health/notifications', {
          method: 'POST',
          body: JSON.stringify({
            userId: alert.patientId,
            title: `Medication Guidance Alert`,
            message: `Clinical review alert regarding: ${alert.medicine}. Please update your intake schedules.`
          })
        });
        alert(`Notification dispatched to ${alert.patientName}.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to dispatch clinical reminder.');
    } finally {
      setSendingReminderId(null);
    }
  };

  const visibleAlerts = attentionList.filter(alert => !dismissedAlerts.includes(alert.id));

  if (isLoading) {
    return (
      <Card className="p-8 text-center border-slate-200">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        <p className="text-xs text-slate-500 font-bold">Scanning patient databases for risk patterns...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center border-rose-100 bg-rose-50/20 text-rose-800">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-rose-600" />
        <p className="text-xs font-bold">{error}</p>
        <Button size="sm" variant="secondary" onClick={fetchWorklist} className="mt-3 text-xs">Retry Scan</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600 animate-pulse" />
            Patient Attention Worklist
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Real-time compliance surveillance filtering for low adherence (&lt;80%) and stock depletion events.
          </p>
        </div>
        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-150 rounded">
          {visibleAlerts.length} Action Items
        </span>
      </div>

      {visibleAlerts.length === 0 ? (
        <Card className="p-8 text-center border-slate-200 bg-emerald-50/10">
          <ShieldCheck className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-slate-800">All Patients Compliant</h4>
          <p className="text-[11px] text-slate-400 mt-1">No medication non-adherence or stock alerts currently logged.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleAlerts.map((alert) => {
            const isHigh = alert.severity === 'High';
            return (
              <Card 
                key={alert.id} 
                className={`p-5 flex flex-col justify-between border-l-4 transition-all duration-300 ${
                  isHigh 
                    ? 'border-l-rose-500 border-rose-100 bg-rose-50/10' 
                    : 'border-l-amber-500 border-amber-100 bg-amber-50/10'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                        isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alert.severity} Risk Alert
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-2 flex items-center gap-1">
                        <User className="h-4 w-4 text-slate-400" />
                        {alert.patientName}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {alert.timeWindow}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-850 mt-3">
                    {alert.reason === 'Sustained Non-Adherence' ? 'Adherence Deficiency Detected' : 'Supply Shortage Alert'}
                  </p>
                  <p className="text-[11px] text-slate-650 mt-1 leading-relaxed">
                    {alert.evidence}
                  </p>

                  {alert.medicine && (
                    <div className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100/50 p-1.5 rounded-lg border border-slate-150">
                      <Pill className="h-3.5 w-3.5 text-emerald-700" />
                      Target: {alert.medicine}
                    </div>
                  )}

                  <div className="mt-3 p-2 bg-white rounded-xl border border-slate-150/60 text-[10px] text-slate-500 leading-normal">
                    <strong className="text-slate-700 font-bold block mb-0.5">Clinical Recommendation:</strong>
                    {alert.recommendedAction}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-150/50 flex justify-between gap-2 items-center flex-wrap">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSendReminder(alert)}
                      disabled={sendingReminderId === alert.id}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {sendingReminderId === alert.id ? 'Sending...' : 'Notify Portal'}
                    </button>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-xl"
                    >
                      Dismiss
                    </button>
                  </div>

                  <Button
                    size="sm"
                    className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 py-1 px-3"
                    onClick={() => onSelectPatient(alert.patientId)}
                  >
                    Open Chart
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

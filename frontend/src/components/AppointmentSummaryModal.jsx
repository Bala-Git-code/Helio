import React, { useMemo, useState } from 'react';
import { Brain, Calendar, CheckCircle2, ClipboardList, Clock, MapPin, Save } from 'lucide-react';
import { Button, Card, Field, ModalShell } from './design-system';

const AppointmentSummaryModal = ({ onClose, appointment, onSaveSummary }) => {
  const generatedSummary = useMemo(() => {
    const date = appointment?.date ? new Date(appointment.date).toLocaleDateString() : 'the scheduled date';
    return [
      `Visit with ${appointment?.doctorName || 'your doctor'} (${appointment?.specialty || 'specialty not listed'}) on ${date} at ${appointment?.time || 'the scheduled time'}.`,
      appointment?.notes ? `Patient note: ${appointment.notes}` : 'No patient note was added yet.',
      'Suggested prep: bring current medications, recent records, symptom timeline, and any questions you want answered.',
    ].join('\n\n');
  }, [appointment]);

  const [summary, setSummary] = useState(generatedSummary);

  const handleSave = () => {
    onSaveSummary?.({
      id: Date.now().toString(),
      appointmentId: appointment?._id || appointment?.id,
      doctorName: appointment?.doctorName,
      specialty: appointment?.specialty,
      summary,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <ModalShell
      onClose={onClose}
      title="AI appointment summary"
      subtitle="Review, edit, and save a visit preparation note"
      icon={Brain}
      tone="ai"
      size="max-w-2xl"
    >
      <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4 shadow-sm">
            <Calendar className="h-5 w-5 text-sky-600" />
            <p className="mt-3 text-xs font-medium text-slate-500">Date</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{appointment?.date ? new Date(appointment.date).toLocaleDateString() : 'Not set'}</p>
          </Card>
          <Card className="p-4 shadow-sm">
            <Clock className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-xs font-medium text-slate-500">Time</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{appointment?.time || 'Not set'}</p>
          </Card>
          <Card className="p-4 shadow-sm">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-500">Location</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{appointment?.clinicAddress || 'Not listed'}</p>
          </Card>
        </div>

        <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-0.5 h-5 w-5 text-violet-700" />
            <div>
              <h3 className="font-semibold text-violet-950">{appointment?.doctorName || 'Upcoming appointment'}</h3>
              <p className="mt-1 text-sm text-violet-800">{appointment?.specialty || 'Specialty not listed'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Field label="Preparation summary">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={8}
              className="input-field resize-none leading-6"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save summary
          </Button>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
          This summary is editable so patients can keep personal context accurate before a visit.
        </div>
      </div>
    </ModalShell>
  );
};

export default AppointmentSummaryModal;

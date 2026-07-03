import React, { useState, useEffect } from 'react';
import { 
  Pill, AlertTriangle, CheckCircle, Plus, Info, Sparkles, 
  Trash2, ClipboardList, ShieldCheck
} from 'lucide-react';
import { Card, Button, Field } from '../design-system';

export default function PrescriptionConsole({
  patients = [],
  selectedPatientId
}) {
  const [selectedId, setSelectedId] = useState(selectedPatientId || '');
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [frequency, setFrequency] = useState('Once daily');
  const [duration, setDuration] = useState('30 days');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'rx-1',
      patientName: 'Arthur Pendragon',
      medication: 'Metformin XR',
      dosage: '500mg',
      frequency: 'Once daily (evening)',
      duration: '90 days',
      status: 'active',
      date: '2026-07-01'
    },
    {
      id: 'rx-2',
      patientName: 'Clara Oswald',
      medication: 'Albuterol Inhaler',
      dosage: '90mcg (2 puffs)',
      frequency: 'As needed (every 4 hrs)',
      duration: '60 days',
      status: 'active',
      date: '2026-07-02'
    }
  ]);

  const [allergyWarning, setAllergyWarning] = useState(null);
  const [interactionWarning, setInteractionWarning] = useState(null);

  // Find selected patient details
  const currentPatient = patients.find(p => p.id === selectedId);

  // Trigger drug assessments when inputs change
  useEffect(() => {
    if (!currentPatient) {
      setAllergyWarning(null);
      setInteractionWarning(null);
      return;
    }

    // Allergy check
    const medLower = medName.toLowerCase();
    const patientAllergies = currentPatient.allergies || ['Penicillin']; // default fallback
    
    const hasAllergy = patientAllergies.some(a => medLower.includes(a.toLowerCase()));
    if (hasAllergy && medName.trim().length > 2) {
      setAllergyWarning(`CRITICAL ALLERGY ALERT: Patient is allergic to ${patientAllergies.join(', ')}. Prescribing "${medName}" is highly contraindicated.`);
    } else {
      setAllergyWarning(null);
    }

    // Interaction checks
    if (medLower.includes('aspirin') || medLower.includes('ibuprofen')) {
      setInteractionWarning(`DRUG CONFLICT ASSESSMENT: Concomitant use of Aspirin/Ibuprofen alongside anticoagulants (Warfarin) increases bleeding risks. Monitor closely.`);
    } else {
      setInteractionWarning(null);
    }
  }, [medName, selectedId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedId || !medName.trim()) return;

    const patientName = currentPatient ? currentPatient.name : 'Unknown Patient';
    const newRx = {
      id: `rx-${Date.now()}`,
      patientName,
      medication: medName.trim(),
      dosage,
      frequency,
      duration,
      status: 'active',
      date: new Date().toISOString().split('T')[0]
    };

    setPrescriptions([newRx, ...prescriptions]);
    setMedName('');
    setNotes('');
    alert(`Prescription logged successfully for ${patientName}.`);
  };

  const terminatePrescription = (id) => {
    setPrescriptions(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'discontinued' } : p
    ));
  };

  return (
    <div className="space-y-6 animate-rise-in">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Pill className="h-7 w-7 text-emerald-700" />
          Medication Prescription Console
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Write dosing schedules, audit patient allergen profiles, and track active drug plans.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        
        {/* LEFT COLUMN: RX PLANNER FORM */}
        <Card className="p-5 border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Plus className="h-4.5 w-4.5 text-emerald-600" />
            Write Prescription
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Select Patient">
              <select 
                value={selectedId} 
                onChange={(e) => setSelectedId(e.target.value)}
                className="input-field py-2.5 text-xs bg-white"
                required
              >
                <option value="">-- Choose Patient Registry --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.accessCode})</option>
                ))}
              </select>
            </Field>

            {currentPatient && (
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-[10px] space-y-1">
                <p className="text-slate-500 uppercase font-bold tracking-wide">Patient Clinical Profile</p>
                <p className="text-slate-800 font-semibold">Allergies: <strong className="text-rose-700">{currentPatient.allergies?.join(', ') || 'Penicillin'}</strong></p>
                <p className="text-slate-800 font-semibold">Conditions: <strong className="text-slate-600">{currentPatient.conditions?.join(', ') || 'Hypertension, Diabetes'}</strong></p>
              </div>
            )}

            <Field label="Medication Name">
              <input 
                type="text" 
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Lisinopril or Penicillin V"
                className="input-field py-2.5 text-xs font-semibold"
                required
              />
            </Field>

            {/* LIVE CONFLICT WARNERS */}
            {allergyWarning && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs leading-normal flex items-start gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                {allergyWarning}
              </div>
            )}

            {interactionWarning && (
              <div className="p-3.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs leading-normal flex items-start gap-2 font-semibold">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                {interactionWarning}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Field label="Dosage">
                <select 
                  value={dosage} 
                  onChange={(e) => setDosage(e.target.value)}
                  className="input-field py-2 text-xs bg-white font-medium"
                >
                  <option value="10mg">10 mg</option>
                  <option value="25mg">25 mg</option>
                  <option value="100mg">100 mg</option>
                  <option value="500mg">500 mg</option>
                  <option value="850mg">850 mg</option>
                </select>
              </Field>

              <Field label="Frequency">
                <select 
                  value={frequency} 
                  onChange={(e) => setFrequency(e.target.value)}
                  className="input-field py-2 text-xs bg-white font-medium"
                >
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="As needed">As needed (PRN)</option>
                </select>
              </Field>

              <Field label="Duration">
                <select 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)}
                  className="input-field py-2 text-xs bg-white font-medium"
                >
                  <option value="7 days">7 days</option>
                  <option value="14 days">14 days</option>
                  <option value="30 days">30 days</option>
                  <option value="90 days">90 days</option>
                </select>
              </Field>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              disabled={!!allergyWarning}
              className="w-full text-xs py-2 min-h-10 mt-2"
            >
              Issue Clinical Prescription
            </Button>
          </form>
        </Card>

        {/* RIGHT COLUMN: ACTIVE RX PLAN ARCHIVE */}
        <Card className="p-5 border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <ClipboardList className="h-4.5 w-4.5 text-slate-400" />
            Active Clinical Prescriptions
          </h2>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {prescriptions.map((rx) => (
              <div 
                key={rx.id} 
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start justify-between gap-4 transition-colors ${
                  rx.status === 'discontinued'
                    ? 'bg-slate-50 text-slate-400 border-slate-100 line-through'
                    : 'bg-slate-50/20 text-slate-800 border-slate-100 hover:border-emerald-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-950 text-xs">{rx.medication}</span>
                    <span className={`text-[8px] uppercase font-extrabold px-1.5 py-0.2 rounded border ${
                      rx.status === 'discontinued'
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    }`}>
                      {rx.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    Patient: <strong className="text-slate-700">{rx.patientName}</strong> • Dose: <strong className="text-slate-700">{rx.dosage} ({rx.frequency})</strong>
                  </p>
                  <div className="text-[9px] text-slate-400 font-bold block mt-1.5">
                    Plan Period: {rx.duration} | Issued: {rx.date}
                  </div>
                </div>

                {rx.status !== 'discontinued' && (
                  <IconButton 
                    label="Discontinue drug"
                    onClick={() => terminatePrescription(rx.id)}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}

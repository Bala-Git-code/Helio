import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, FileText, LogOut, Pill, Search, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { BrandMark, Button, Card, EmptyState, Field, SectionHeader, StatCard } from './design-system';

const fetchPatientData = async (patientId) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const allPatientsData = {
    linkedPatientCode123: {
      id: 'linkedPatientCode123',
      name: 'Google User',
      age: 35,
      lastVisit: '2024-09-20',
      recentMedications: [
        { name: 'Aspirin', dosage: '81mg', lastTaken: '2024-09-15', frequency: 'Daily' },
        { name: 'Vitamin D', dosage: '1000IU', lastTaken: '2024-09-16', frequency: 'Daily' },
      ],
      allergies: ['Penicillin', 'Dust'],
      records: [
        { date: '2024-09-20', type: 'Lab Results', description: 'Complete Blood Count normal.' },
        { date: '2024-08-05', type: 'Prescription', description: 'Prescribed Vitamin D for low levels.' },
      ],
    },
    1: {
      id: '1',
      name: 'John Doe',
      age: 45,
      lastVisit: '2024-09-15',
      recentMedications: [
        { name: 'Lisinopril', dosage: '10mg', lastTaken: '2024-09-17', frequency: 'Daily' },
        { name: 'Metformin', dosage: '500mg', lastTaken: '2024-09-16', frequency: 'Twice daily' },
      ],
      allergies: ['Penicillin', 'Shellfish'],
      records: [
        { date: '2024-09-15', type: 'Check-up', description: 'Routine check-up, blood pressure monitored.' },
        { date: '2024-08-01', type: 'Vaccination', description: 'Seasonal flu shot administered.' },
      ],
    },
    2: {
      id: '2',
      name: 'Jane Smith',
      age: 32,
      lastVisit: '2024-09-18',
      recentMedications: [
        { name: 'Ibuprofen', dosage: '400mg', lastTaken: '2024-09-15', frequency: 'As needed' },
      ],
      allergies: ['Latex'],
      records: [
        { date: '2024-09-18', type: 'Consultation', description: 'Discussed persistent headaches.' },
        { date: '2024-08-10', type: 'Prescription', description: 'Prescribed Ibuprofen for pain management.' },
      ],
    },
  };

  return allPatientsData[patientId];
};

const DoctorDashboard = ({ user, onLogout, linkedPatientCode }) => {
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const getPatient = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (linkedPatientCode) {
          const data = await fetchPatientData(linkedPatientCode);
          setPatient(data || null);
        } else {
          setPatient(null);
        }
      } catch (err) {
        setError('Failed to load patient data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    getPatient();
  }, [linkedPatientCode]);

  const getRecentMedications = (medications) => {
    if (!medications) return [];
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return medications.filter((med) => new Date(med.lastTaken) >= fourteenDaysAgo);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const filteredRecords = (patient?.records || []).filter((record) => {
    const query = searchTerm.toLowerCase();
    return record.type.toLowerCase().includes(query) || record.description.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <main className="page-shell grid place-items-center px-4">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="font-medium text-slate-600">Loading patient context...</p>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell grid place-items-center px-4">
        <Card className="max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mt-4 text-xl font-semibold text-slate-950">Error loading data</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </Card>
      </main>
    );
  }

  if (!patient) {
    return (
      <main className="page-shell">
        <header className="nav-glass">
          <div className="content-shell flex items-center justify-between gap-4 py-4">
            <BrandMark label="Doctor Portal" subtitle="Patient medication overview" tone="record" />
            <Button variant="secondary" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <div className="content-shell grid min-h-[70vh] place-items-center py-10">
          <EmptyState
            icon={Search}
            title="No linked patient found"
            description="The requested patient could not be found or is not linked to this doctor account."
          />
        </div>
      </main>
    );
  }

  const recentMedications = getRecentMedications(patient.recentMedications);

  return (
    <main className="page-shell">
      <header className="nav-glass">
        <div className="content-shell flex items-center justify-between gap-4 py-4">
          <BrandMark label="Doctor Portal" subtitle="Clinician command center" tone="record" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="font-semibold text-slate-900">Dr. {user.name}</p>
              <p className="text-sm text-slate-500">Healthcare provider</p>
            </div>
            <Button variant="secondary" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="content-shell py-6 sm:py-8">
        <Card className="p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="section-kicker mb-4">Linked patient overview</p>
              <h1 className="text-balance text-3xl font-semibold text-slate-950 sm:text-5xl">
                {patient.name}'s care context is ready for review.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Recent medication activity, allergy warnings, and record history are grouped by clinical priority.
              </p>
            </div>
            <div className="rounded-[var(--radius-xl)] bg-blue-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Last visit</p>
              <p className="mt-2 text-2xl font-semibold">{formatDate(patient.lastVisit)}</p>
              <p className="mt-3 text-sm text-blue-100">Age {patient.age} • linked record {patient.id}</p>
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard icon={Pill} label="Recent medications" value={recentMedications.length} detail="Taken in the past 14 days" tone="primary" />
          <StatCard icon={AlertTriangle} label="Known allergies" value={patient.allergies?.length || 0} detail="Review before prescribing" tone="emergency" />
          <StatCard icon={FileText} label="Patient records" value={patient.records?.length || 0} detail="Clinical notes and documents" tone="record" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white">
                  <UserRound className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{patient.name}</h2>
                  <p className="text-sm text-slate-500">Age {patient.age}</p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Clinical snapshot</p>
                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Prioritize allergies, recent adherence, and record history before the next care decision.
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2 className="font-semibold text-slate-950">Known allergies</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.allergies?.length ? patient.allergies.map((allergy) => (
                  <span key={allergy} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                    {allergy}
                  </span>
                )) : <p className="text-sm text-slate-600">No allergies listed.</p>}
              </div>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card className="p-5 sm:p-6">
              <SectionHeader
                title="Recent medications"
                description="Only medications with activity in the last 14 days are shown here."
              />
              <div className="mt-5 space-y-3">
                {recentMedications.length ? recentMedications.map((medication) => (
                  <article key={`${medication.name}-${medication.lastTaken}`} className="rounded-[var(--radius-lg)] border border-emerald-100 bg-emerald-50/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{medication.name}</h3>
                        <p className="text-sm text-slate-600">{medication.dosage} • {medication.frequency}</p>
                      </div>
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Clock className="h-4 w-4" />
                        Last taken: {formatDate(medication.lastTaken)}
                      </p>
                    </div>
                  </article>
                )) : (
                  <EmptyState icon={Pill} title="No recent medication activity" description="No medications were recorded in the past 14 days." />
                )}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeader title="Patient records" description="Search visit history, labs, and prescription notes." />
                <Field label="Search records">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input className="input-field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Lab, prescription..." />
                  </div>
                </Field>
              </div>
              <div className="mt-5 space-y-3">
                {filteredRecords.length ? filteredRecords.map((record) => (
                  <article key={`${record.type}-${record.date}`} className="rounded-[var(--radius-lg)] border border-indigo-100 bg-indigo-50/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-semibold text-indigo-900">{record.type}</span>
                      <span className="text-sm text-slate-500">{formatDate(record.date)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{record.description}</p>
                  </article>
                )) : (
                  <EmptyState icon={FileText} title="No matching records" description="Try a different search term or clear the field." />
                )}
              </div>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/80 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                <p className="text-sm leading-6 text-emerald-900">
                  Clinical safety note: allergy information is highlighted before medication history to reduce prescribing risk.
                </p>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
};

export default DoctorDashboard;

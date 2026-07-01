import React from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  FileText,
  HeartPulse,
  MessageCircle,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { BrandMark, Button, Card, SectionHeader, StatCard } from './design-system';

const trustSignals = [
  { icon: ShieldCheck, label: 'Protected health routines' },
  { icon: Stethoscope, label: 'Doctor-connected context' },
  { icon: Users, label: 'Family care coordination' },
];

const careFeatures = [
  { icon: Pill, title: 'Medicine rhythm', text: 'Dose schedules, allergy checks, and voice input for daily adherence.' },
  { icon: Calendar, title: 'Appointment clarity', text: 'Visits, preparation notes, and follow-up summaries in one calm timeline.' },
  { icon: FileText, title: 'Record vault', text: 'A dedicated place for labs, imaging, prescriptions, and care documents.' },
  { icon: MessageCircle, title: 'AI companion', text: 'Plain-language guidance for routines, reminders, and care questions.' },
];

const WelcomePage = ({ onGetStarted }) => {
  return (
    <main className="page-shell overflow-hidden">
      <section className="relative min-h-[92vh]">
        <img
          src="/helio-care-consult.png"
          alt="A clinician and patient reviewing a digital health dashboard together in a bright consultation room"
          className="absolute inset-0 h-full w-full object-cover object-[58%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,251,250,0.98)_0%,rgba(246,251,250,0.92)_32%,rgba(246,251,250,0.45)_64%,rgba(246,251,250,0.08)_100%)]" />
        <div className="content-shell relative z-10 flex min-h-[92vh] flex-col justify-between py-5 sm:py-7">
          <nav className="flex items-center justify-between gap-4" aria-label="Landing">
            <BrandMark subtitle="Premium healthcare companion" />
            <Button variant="secondary" size="sm" onClick={onGetStarted}>
              Enter Helio
            </Button>
          </nav>

          <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.7fr)] lg:items-end">
            <div className="max-w-3xl animate-rise-in">
              <p className="section-kicker mb-5">Patient portal + doctor portal + AI care assistant</p>
              <h1 className="text-balance text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl lg:text-7xl">
                Helio keeps care organized when health feels personal.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                Manage medicines, appointments, records, emergency contacts, and doctor context in a protected workspace designed to feel calm, clear, and deeply human.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={onGetStarted}>
                  Start your care space
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button variant="secondary" size="lg">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  Private by design
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {trustSignals.map(({ icon: Icon, label }) => (
                  <span key={label} className="chip">
                    <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <Card className="hidden p-4 shadow-[var(--shadow-elevated)] lg:block">
              <div className="rounded-[1.25rem] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Today</p>
                    <h2 className="mt-1 text-2xl font-semibold">Care command center</h2>
                  </div>
                  <HeartPulse className="h-8 w-8 text-emerald-300" aria-hidden="true" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    ['84%', 'Health score'],
                    ['3', 'Medicines'],
                    ['10:30', 'Next dose'],
                    ['2', 'Care notes'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                      <div className="text-2xl font-semibold">{value}</div>
                      <div className="mt-1 text-xs text-slate-300">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-white p-4 text-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">AI insight</p>
                      <p className="mt-1 text-sm text-slate-600">Your morning dose and cardiology follow-up are aligned.</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-violet-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="content-shell -mt-10 pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Bell} label="Reminder readiness" value="98%" detail="Designed around missed-dose prevention" />
          <StatCard icon={Activity} label="Care timeline" value="24/7" detail="Records and routines stay available" tone="appointment" />
          <StatCard icon={CheckCircle2} label="Protected actions" value="1 tap" detail="Emergency and care-team access" tone="emergency" />
        </div>
      </section>

      <section className="content-shell pb-16">
        <SectionHeader
          eyebrow="Reusable care system"
          title="A healthcare interface with a gentle hierarchy"
          description="Each feature has its own signal while sharing one visual language: soft surfaces, clear actions, readable type, and accessible focus states."
        />
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {careFeatures.map(({ icon: Icon, title, text }) => (
            <Card key={title} interactive className="p-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
};

export default WelcomePage;

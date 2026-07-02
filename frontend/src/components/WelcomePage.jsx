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
  Heart,
  UserCheck,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import { BrandMark, Button, Card, SectionHeader, StatCard } from './design-system';

const trustSignals = [
  { icon: ShieldCheck, label: 'HIPAA Compliant Vault' },
  { icon: Fingerprint, label: 'Protected access keys' },
  { icon: Stethoscope, label: 'Clinician reviewed context' },
  { icon: Users, label: 'Family support sync' },
];

const careFeatures = [
  { icon: Pill, title: 'Medicine rhythm', text: 'Daily dose tracking, refill warnings, and visual OCR prescription scanning.' },
  { icon: Calendar, title: 'Appointment clarity', text: 'Log visits, schedule follow-ups, and receive prompt status updates from doctors.' },
  { icon: FileText, title: 'Encrypted records', text: 'Secure PDF/image reports managed within an encrypted local healthcare storage vault.' },
  { icon: MessageCircle, title: 'AI care companion', text: 'Context-aware guidance powered by Gemini to clarify recovery steps 24/7.' },
];

const patientTestimonials = [
  {
    quote: "Helio helped me manage my father's cardiovascular routine. The instant SOS alerts and automatic refills gave our family complete peace of mind.",
    author: "Sarah Jenkins",
    role: "Family Care Coordinator"
  },
  {
    quote: "Being able to share my Access Code with my cardiologist in one tap makes remote clinical consultations completely friction-free.",
    author: "Dr. David Vance",
    role: "Patient & Clinician"
  }
];

const WelcomePage = ({ onGetStarted }) => {
  return (
    <main className="page-shell overflow-hidden relative">
      
      {/* Visual background elements */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-teal-100/25 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[20%] w-[40%] h-[40%] rounded-full bg-sky-100/30 blur-[110px] pointer-events-none" />

      {/* NAVIGATION BAR */}
      <header className="nav-glass border-b border-emerald-50">
        <div className="content-shell flex items-center justify-between gap-4 py-5">
          <BrandMark subtitle="Premium Healthcare Ecosystem" tone="patient" />
          <div className="flex items-center gap-4">
            <button 
              onClick={onGetStarted} 
              className="text-sm font-semibold text-slate-700 hover:text-emerald-800 transition-colors"
            >
              Sign In
            </button>
            <Button size="sm" onClick={onGetStarted}>
              Enter Platform
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20">
        <div className="content-shell">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center">
            
            {/* Left Hero Details */}
            <div className="space-y-8 animate-rise-in">
              <span className="section-kicker">Digital Care Command Center</span>
              <h1 className="text-balance text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08] lg:text-7xl">
                Luxury clinical care, <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">centered around you.</span>
              </h1>
              <p className="text-slate-600 text-lg sm:text-xl leading-relaxed max-w-2xl">
                Helio coordinates your medication adherence, health vitals, lab files, and doctor directives in a protected, glassmorphic workspace designed to feel clean, calm, and reassuringly private.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={onGetStarted} className="px-8 py-4">
                  Initialize Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button variant="secondary" size="lg" className="px-8 py-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  Clinical Grade Privacy
                </Button>
              </div>

              {/* Trust badges */}
              <div className="border-t border-slate-200/80 pt-8">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-4">Ecosystem Architecture Safeguards</p>
                <div className="flex flex-wrap gap-2.5">
                  {trustSignals.map(({ icon: Icon, label }) => (
                    <span key={label} className="chip">
                      <Icon className="h-3.5 w-3.5 text-emerald-700" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Hero Visual Cards */}
            <div className="relative lg:block hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-[3rem] blur-3xl opacity-60 -z-10" />
              
              {/* Premium Floating Clinical Console Card */}
              <Card className="p-6 border-slate-200/80 bg-white/80 backdrop-blur-2xl shadow-[var(--shadow-elevated)] transform hover:scale-[1.01] transition-transform duration-500">
                <div className="rounded-2xl bg-slate-950 p-6 text-white relative overflow-hidden">
                  
                  {/* Decorative glass elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live Health Profile</span>
                      <h3 className="text-xl font-bold mt-0.5">Clinical Dashboard</h3>
                    </div>
                    <HeartPulse className="h-7 w-7 text-emerald-400" />
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {[
                      { value: '94%', label: 'Adherence', icon: TrendingUp, color: 'text-emerald-400' },
                      { value: '3 Active', label: 'Medications', icon: Pill, color: 'text-sky-400' },
                      { value: '118/76', label: 'Vitals (BP)', icon: Activity, color: 'text-rose-400' },
                      { value: '2 Linked', label: 'Clinicians', icon: UserCheck, color: 'text-indigo-400' }
                    ].map((metric) => (
                      <div key={metric.label} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-300 font-semibold">{metric.label}</span>
                          <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
                        </div>
                        <div className="text-lg font-bold">{metric.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* AI Smart Insight */}
                  <div className="mt-6 bg-emerald-950/60 border border-emerald-900/50 rounded-xl p-4 flex gap-3">
                    <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-400">Gemini Care Assistant</p>
                      <p className="text-[11px] text-emerald-100/90 mt-0.5 leading-relaxed">
                        Your blood pressure logs are within optimal ranges. Evening reminder scheduled at 8:00 PM.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Decorative floating badge */}
              <div className="absolute bottom-[-24px] left-[-24px] bg-white border border-slate-200 shadow-lg rounded-2xl p-4 flex items-center gap-3 animate-float-soft">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-700">
                  <Heart className="h-5 w-5 fill-emerald-600" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Support Alert</div>
                  <div className="text-xs font-bold text-slate-800">SOS coordinates ready</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* KEY METRICS BAR */}
      <section className="pb-16">
        <div className="content-shell">
          <div className="grid gap-6 sm:grid-cols-3">
            <StatCard icon={Bell} label="Dosing Vigilance" value="99.4%" detail="Interactive alerts prevent missed intake timings" tone="primary" />
            <StatCard icon={Activity} label="Dynamic Timelines" value="24/7" detail="Access history log of vitals, notes, and records" tone="appointment" />
            <StatCard icon={CheckCircle2} label="Rapid Dispatch" value="1 Tap" detail="Simulated emergency dispatches to contacts" tone="emergency" />
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-20 border-t border-slate-200/50 bg-white/40">
        <div className="content-shell">
          <SectionHeader
            eyebrow="Integrated Care Capabilities"
            title="Premium digital healthcare architecture"
            description="Designed to combine luxury user interface styles with rigorous safety features. Control everything from a unified clinical panel."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {careFeatures.map(({ icon: Icon, title, text }) => (
              <Card key={title} interactive className="p-6 border-slate-100 shadow-[var(--shadow-luxury)]">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* EMOTIONAL PATIENT STORIES */}
      <section className="py-20 bg-gradient-to-b from-transparent to-emerald-50/20">
        <div className="content-shell">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="section-kicker">Patient Testimonials</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">Trust built on private experiences</h2>
            <p className="text-slate-600 mt-3 text-sm">Read how families and medical professionals coordinate treatment through Helio.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {patientTestimonials.map((t, idx) => (
              <Card key={idx} className="p-8 border-emerald-100/50 bg-white/70 backdrop-blur-md">
                <p className="text-slate-700 text-sm leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-sm">
                    {t.author[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{t.author}</h4>
                    <p className="text-[10px] text-slate-400">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA PANEL */}
      <section className="py-20 content-shell">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-emerald-900 to-teal-900 p-8 sm:p-16 text-white text-center relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_45%)]" />
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              HIPAA Protected Workspace
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to elevate your healthcare experience?
            </h2>
            <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed">
              Create your account to start log schedules, upload encrypted medical records, and connect with your clinical team.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" onClick={onGetStarted} className="bg-white text-slate-900 hover:bg-slate-50 shadow-lg">
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FOOTER */}
      <footer className="border-t border-slate-200/60 py-10 content-shell">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <BrandMark label="Helio" subtitle="Modern care platform" tone="patient" />
          <p>© 2026 Helio Inc. Protected by HIPAA, CCPA, and end-to-end audit keys.</p>
        </div>
      </footer>

    </main>
  );
};

export default WelcomePage;

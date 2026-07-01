import React, { useState } from 'react';
import { Eye, EyeOff, HeartPulse, Lock, Mail, ShieldCheck, Stethoscope, User } from 'lucide-react';
import { BrandMark, Button, Card, Field, IconButton, cn } from './design-system';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const endpoint = isLogin ? '/login' : '/register';
    const url = `http://localhost:5000/api/auth${endpoint}`;

    try {
      const body = {
        email: formData.email,
        password: formData.password,
        role: userType,
      };

      if (!isLogin) body.name = formData.name;
      if (userType === 'doctor' && patientCode.trim()) body.patientCode = patientCode.trim();

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'We could not complete that request.');

      if (isLogin) {
        localStorage.setItem('jwtToken', data.token);
        onAuthSuccess({
          id: data.user?.id,
          name: data.user?.name || formData.email,
          email: data.user?.email || formData.email,
          userType: data.user?.role || userType,
          role: data.user?.role || userType,
          linkedPatientCode: data.user?.linkedPatientCode || patientCode || undefined,
        }, false);
      } else {
        setIsLogin(true);
        setError('Registration successful. Please sign in to continue.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="page-shell flex min-h-screen items-center px-4 py-8">
      <div className="content-shell grid items-center gap-8 lg:grid-cols-[0.95fr_0.75fr]">
        <section className="hidden lg:block">
          <BrandMark subtitle="Secure access to your care space" />
          <div className="mt-10 max-w-2xl">
            <p className="section-kicker mb-5">Protected sign in</p>
            <h1 className="text-balance text-5xl font-semibold leading-tight text-slate-950">
              A calm doorway for patients and clinicians.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Helio separates patient routines and doctor oversight while keeping every interaction readable, keyboard friendly, and clear.
            </p>
          </div>
          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <HeartPulse className="h-7 w-7 text-emerald-600" />
              <h2 className="mt-4 font-semibold text-slate-950">Patient portal</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Medicines, records, appointments, emergency access, and AI support.</p>
            </Card>
            <Card className="p-5">
              <Stethoscope className="h-7 w-7 text-blue-600" />
              <h2 className="mt-4 font-semibold text-slate-950">Doctor portal</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Linked patient context, recent medications, allergies, and records.</p>
            </Card>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
          <div className="mb-7 text-center lg:text-left">
            <div className="mb-5 lg:hidden">
              <BrandMark subtitle="Secure care access" />
            </div>
            <h2 className="text-3xl font-semibold text-slate-950">
              {isLogin ? 'Welcome back' : 'Create your Helio account'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isLogin ? 'Sign in to continue your care plan.' : 'Set up your protected health workspace.'}
            </p>
          </div>

          <div className="mb-6 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Choose account type">
            {[
              { value: 'patient', label: 'Patient', icon: User },
              { value: 'doctor', label: 'Doctor', icon: Stethoscope },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setUserType(value)}
                className={cn(
                  'inline-flex min-h-11 w-1/2 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                  userType === value ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                )}
                role="tab"
                aria-selected={userType === value}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className={cn('mb-5 rounded-2xl border px-4 py-3 text-sm', error.includes('successful') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700')} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Field label="Full name">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input className="input-field pl-10" type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Avery Morgan" required />
                </div>
              </Field>
            )}

            {userType === 'doctor' && isLogin && (
              <Field label="Patient access code" helper="Optional. Use it when a patient has linked you to their care record.">
                <input className="input-field" type="text" value={patientCode} onChange={(e) => setPatientCode(e.target.value)} placeholder="linkedPatientCode123" />
              </Field>
            )}

            <Field label="Email address">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input className="input-field pl-10" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" required />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input className="input-field pl-10 pr-14" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Enter your password" required />
                <IconButton label={showPassword ? 'Hide password' : 'Show password'} type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1.5 top-1.5 h-10 w-10 rounded-xl border-0 shadow-none">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </IconButton>
              </div>
            </Field>

            <Button type="submit" className="w-full" size="lg">
              <ShieldCheck className="h-5 w-5" />
              {isLogin ? 'Sign in securely' : 'Create account'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs font-medium text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            Continue with
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <a href="http://localhost:5000/api/auth/google" className="btn-secondary min-h-12 w-full px-4 text-sm">
            Google
          </a>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }} className="ml-2 font-semibold text-emerald-700 hover:text-emerald-800">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
};

export default AuthPage;

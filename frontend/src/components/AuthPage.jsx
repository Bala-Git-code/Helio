import React, { useState } from 'react';
import { Eye, EyeOff, HeartPulse, Lock, Mail, ShieldCheck, Stethoscope, User, ShieldAlert, Sparkles, Fingerprint } from 'lucide-react';
import { BrandMark, Button, Card, Field, IconButton, cn } from './design-system';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('patient'); // patient, doctor, admin
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? '/login' : '/register';
    // Align with our backend port configuration
    const url = `http://localhost:5000/api/auth${endpoint}`;

    try {
      const body = {
        email: formData.email,
        password: formData.password,
        role: userType,
      };

      if (!isLogin) body.name = formData.name;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Verification failed. Please try again.');

      if (isLogin) {
        localStorage.setItem('jwtToken', data.accessToken || data.token);
        onAuthSuccess({
          id: data.user?.id,
          name: data.user?.name || formData.email,
          email: data.user?.email || formData.email,
          userType: data.user?.role || userType,
          role: data.user?.role || userType,
        }, !isLogin); // Is new user if we registered just now (handled statefully)
      } else {
        // Automatically sign them in after successful patient registration
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          localStorage.setItem('jwtToken', loginData.accessToken || loginData.token);
          onAuthSuccess({
            id: loginData.user?.id,
            name: loginData.user?.name || formData.email,
            email: loginData.user?.email || formData.email,
            userType: loginData.user?.role || 'patient',
            role: loginData.user?.role || 'patient',
          }, true); // Trigger step-by-step onboarding wizard
        } else {
          setIsLogin(true);
          setError('Account registered! Please login.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="page-shell flex min-h-screen items-center px-4 py-8 relative">
      
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-emerald-100/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-teal-100/20 blur-[100px] pointer-events-none" />

      <div className="content-shell grid items-center gap-8 lg:grid-cols-[1fr_0.85fr] relative z-10">
        
        {/* Left Side: Editorial clinical notes */}
        <section className="hidden lg:block space-y-8 animate-rise-in">
          <BrandMark subtitle="Protected health workspace" tone="patient" />
          <div className="max-w-xl">
            <span className="section-kicker mb-4">Enterprise Care Gate</span>
            <h1 className="text-balance text-5xl font-extrabold leading-[1.1] text-slate-900 tracking-tight">
              A private entry for patient healing and clinician directives.
            </h1>
            <p className="mt-5 text-slate-600 text-base leading-relaxed">
              Helio coordinates clinical data securely. Restoring sessions, loading OCR schedules, and analyzing charts remain protected under end-to-end user encryption.
            </p>
          </div>
          <div className="grid max-w-lg gap-4 sm:grid-cols-2">
            <Card className="p-5 border-slate-100 shadow-[var(--shadow-luxury)]">
              <HeartPulse className="h-6 w-6 text-emerald-700" />
              <h3 className="mt-4 font-bold text-slate-800 text-sm">Patient Portal</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">Access visual vitals history, chat with your AI assistant, and check daily doses.</p>
            </Card>
            <Card className="p-5 border-slate-100 shadow-[var(--shadow-luxury)]">
              <Stethoscope className="h-6 w-6 text-indigo-700" />
              <h3 className="mt-4 font-bold text-slate-800 text-sm">Clinician Hub</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">Inspect patient adherence statistics, approve calendar bookings, and write clinical notes.</p>
            </Card>
          </div>
        </section>

        {/* Right Side: Auth Card Form */}
        <Card className="mx-auto w-full max-w-md p-6 sm:p-8 border-slate-200 shadow-[var(--shadow-elevated)] bg-white/90 backdrop-blur-md">
          <div className="mb-7 text-center">
            <div className="mb-5 lg:hidden">
              <BrandMark subtitle="Secure care access" tone="patient" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? 'Sign In Securely' : 'Create Helio Account'}
            </h2>
            <p className="mt-1.5 text-xs text-slate-500">
              {isLogin ? 'Sign in to access your digital care records.' : 'Fill out your protected registration files.'}
            </p>
          </div>

          {/* User Type Tabs */}
          <div className="mb-6 rounded-2xl bg-slate-100 p-1 flex" role="tablist" aria-label="Account selection type">
            {[
              { value: 'patient', label: 'Patient', icon: User },
              { value: 'doctor', label: 'Doctor', icon: Stethoscope },
              { value: 'admin', label: 'Admin', icon: Fingerprint }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setUserType(value);
                  setError(null);
                  if (value !== 'patient') {
                    setIsLogin(true); // Doctors & Admins cannot self-register
                  }
                }}
                className={cn(
                  'flex-1 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all duration-300',
                  userType === value 
                    ? 'bg-white text-emerald-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                )}
                role="tab"
                aria-selected={userType === value}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className={cn('mb-5 rounded-2xl border px-4 py-3 text-xs font-semibold leading-relaxed', error.includes('successful') || error.includes('registered') ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700')} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name (Registration Only) */}
            {!isLogin && userType === 'patient' && (
              <Field label="Full Name">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input 
                    className="input-field pl-10 text-sm" 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Avery Morgan" 
                    required 
                  />
                </div>
              </Field>
            )}

            {/* Email */}
            <Field label="Email Address">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input 
                  className="input-field pl-10 text-sm" 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="you@example.com" 
                  required 
                />
              </div>
            </Field>

            {/* Password */}
            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input 
                  className="input-field pl-10 pr-12 text-sm" 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  placeholder="••••••••" 
                  required 
                />
                <IconButton 
                  label={showPassword ? 'Hide password' : 'Show password'} 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-1.5 top-1.5 h-10 w-10 rounded-xl border-0 shadow-none hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconButton>
              </div>
            </Field>

            {/* Submit */}
            <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
              <ShieldCheck className="h-5 w-5" />
              {loading ? 'Authenticating...' : isLogin ? 'Sign In Securely' : 'Complete Registration'}
            </Button>
          </form>

          {/* Patient Google OAuth Link */}
          {userType === 'patient' && isLogin && (
            <>
              <div className="my-5 flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="h-px flex-1 bg-slate-100" />
                Or continue with
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <a 
                href="http://localhost:5000/api/auth/google" 
                className="btn-secondary w-full py-3.5 text-xs font-bold"
              >
                Sign In with Google
              </a>
            </>
          )}

          {/* Toggle Register/Login Link (Patients Only) */}
          {userType === 'patient' && (
            <p className="mt-6 text-center text-xs text-slate-500">
              {isLogin ? "Don't have a care account?" : 'Already registered?'}
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(null); }} 
                className="ml-1.5 font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          )}

          {/* Informational safeguards footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              HIPAA Protected
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Fingerprint className="h-3 w-3 text-emerald-600" />
              E2E Encrypted
            </span>
          </div>

        </Card>
      </div>
    </main>
  );
};

export default AuthPage;

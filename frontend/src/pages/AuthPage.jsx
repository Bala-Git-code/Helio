import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, UserCheck, Stethoscope, ArrowLeft, ArrowRight, Zap, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import ParticleCanvas from '../components/ParticleCanvas';

export const AuthPage = ({ onAuthSuccess, mode = 'login' }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [role, setRole] = useState('PATIENT');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { ...formData, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onAuthSuccess(data.token, data.user);
        if (data.user.role === 'DOCTOR') navigate('/doctor/dashboard');
        else navigate('/patient/dashboard');
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setError('Network connection failed. Please ensure the HELIO backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setError('');
    setSuccess('');
    setDemoLoadingRole(demoRole);

    try {
      const res = await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: demoRole }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Demo session active. Redirecting to ${demoRole} portal...`);
        onAuthSuccess(data.token, data.user);
        setTimeout(() => {
          if (data.user.role === 'DOCTOR') navigate('/doctor/dashboard');
          else navigate('/patient/dashboard');
        }, 400);
      } else {
        setError(data.error || 'Demo login failed.');
      }
    } catch (err) {
      console.warn('Demo login fetch error fallback:', err);
      // Client-side fallback if server completely offline
      const isPatient = demoRole.toLowerCase() === 'patient';
      const mockUser = {
        id: isPatient ? '64f8a1b2c3d4e5f607890123' : '64f8a1b2c3d4e5f607890456',
        name: isPatient ? 'Sarah Jenkins (Demo Patient)' : 'Dr. Marcus Reid (Demo Doctor)',
        email: isPatient ? 'patient@helio.health' : 'doctor@helio.health',
        role: isPatient ? 'PATIENT' : 'DOCTOR',
        phone: isPatient ? '+1-555-0192' : '+1-555-0847',
        specialty: isPatient ? '' : 'Endocrinology & Metabolic Medicine',
      };
      const mockToken = 'mock_demo_jwt_token_helio_enterprise_2026';
      onAuthSuccess(mockToken, mockUser);
      if (mockUser.role === 'DOCTOR') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <ParticleCanvas />

      <div className="card" style={{ zIndex: 10, maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', background: 'var(--bg-card)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)' }}>
        
        {/* Top Header & Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => navigate('/home')} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={14} /> Home
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HeartPulse size={22} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>HELIO</span>
          </div>
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', margin: '0 0 0.4rem' }}>
          {isLogin ? 'Sign In to HELIO Workspace' : 'Create Clinical Account'}
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Enterprise Medication Intelligence & Safety Platform
        </p>

        {/* 1-Click One-Click Demo Action Buttons */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={14} color="var(--warning)" /> One-Click Instant Demo Login
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              onClick={() => handleDemoLogin('patient')}
              disabled={!!demoLoadingRole}
              className="btn btn-sm btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem' }}
            >
              <UserCheck size={16} /> {demoLoadingRole === 'patient' ? 'Connecting...' : 'Demo Patient'}
            </button>

            <button
              onClick={() => handleDemoLogin('doctor')}
              disabled={!!demoLoadingRole}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem' }}
            >
              <Stethoscope size={16} /> {demoLoadingRole === 'doctor' ? 'Connecting...' : 'Demo Doctor'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span>OR SIGN IN WITH CREDENTIALS</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Role Toggle Selector (Register Mode) */}
        {!isLogin && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${role === 'PATIENT' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setRole('PATIENT')}
              style={{ flex: 1 }}
            >
              Patient Role
            </button>
            <button
              type="button"
              className={`btn btn-sm ${role === 'DOCTOR' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setRole('DOCTOR')}
              style={{ flex: 1 }}
            >
              Doctor Role
            </button>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder={role === 'DOCTOR' ? 'Dr. Marcus Reid' : 'Sarah Jenkins'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="user@helio.health"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && role === 'DOCTOR' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Specialty</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Endocrinology"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">License Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="MD-88421"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '0.75rem', background: 'var(--success-light)', color: 'var(--secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}>
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have a HELIO account? " : 'Already registered? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Register now' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

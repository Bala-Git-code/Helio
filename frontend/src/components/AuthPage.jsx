import React, { useState } from 'react';
import {
  Activity, UserCheck, Stethoscope, ArrowRight, ArrowLeft, Zap,
  Eye, EyeOff, CheckCircle
} from 'lucide-react';

export const AuthPage = ({ onAuthSuccess, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
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
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setError('Network or server connection failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── FAIL-SAFE DEMO LOGIN: Calls the new auto-upsert endpoint ──────────────
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
        setSuccess(`Welcome to HELIO, ${data.user.name.split(' ')[0]}!`);
        setTimeout(() => onAuthSuccess(data.token, data.user), 600);
      } else {
        setError(data.error || 'Demo login failed. Please try again.');
      }
    } catch (err) {
      setError('Cannot connect to HELIO server. Ensure the backend is running on port 5000.');
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Back to Home */}
        {onNavigate && (
          <button
            className="auth-back-btn"
            onClick={() => onNavigate('landing')}
          >
            <ArrowLeft size={15} /> Back to Home
          </button>
        )}

        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-logo-wrap">
            <Activity size={28} color="#ffffff" />
          </div>
          <div className="auth-brand-name">HELIO</div>
          <div className="auth-brand-sub">Enterprise Medication Intelligence & Clinical Platform</div>
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="auth-error-banner">
            <span>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="auth-success-banner">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Demo One-Click Login */}
        <div className="demo-section">
          <div className="demo-label">INSTANT DEMO ACCESS</div>
          <div className="demo-btn-row">
            <button
              className="btn btn-primary demo-btn"
              onClick={() => handleDemoLogin('patient')}
              disabled={!!demoLoadingRole || loading}
            >
              {demoLoadingRole === 'patient' ? (
                <span className="btn-spinner" />
              ) : (
                <UserCheck size={15} />
              )}
              Demo Patient
            </button>
            <button
              className="btn demo-btn-doctor"
              onClick={() => handleDemoLogin('doctor')}
              disabled={!!demoLoadingRole || loading}
            >
              {demoLoadingRole === 'doctor' ? (
                <span className="btn-spinner" />
              ) : (
                <Stethoscope size={15} />
              )}
              Demo Doctor
            </button>
          </div>
          <div className="demo-hint">
            <Zap size={12} color="#F59E0B" /> Auto-provisions demo account instantly — no database seed required
          </div>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or continue with credentials</span>
          <div className="auth-divider-line" />
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'auth-tab-active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'auth-tab-active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem' }}>
          {!isLogin && (
            <>
              {/* Role Selector */}
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${role === 'PATIENT' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setRole('PATIENT')}
                  >
                    <UserCheck size={14} /> Patient
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${role === 'DOCTOR' ? 'btn-secondary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setRole('DOCTOR')}
                  >
                    <Stethoscope size={14} /> Doctor / Physician
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {role === 'DOCTOR' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Specialty</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Endocrinology"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="MD-12345"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              required
              placeholder="name@helio.health"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                style={{ paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.25rem',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : null}
            {isLogin ? 'Sign In to HELIO' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ border: 'none', color: 'var(--primary)', fontWeight: 600 }}
          >
            {isLogin ? "Don't have an account? Register" : 'Already registered? Sign In'}
          </button>
        </div>
      </div>

      <style>{`
        .btn-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AuthPage;

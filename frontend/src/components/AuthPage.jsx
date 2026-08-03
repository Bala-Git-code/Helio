import React, { useState } from 'react';
import { Activity, UserCheck, Stethoscope, ArrowRight } from 'lucide-react';

export const AuthPage = ({ onAuthSuccess }) => {
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      setError('Network or server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'Password123!' }),
      });

      const data = await res.json();
      if (data.success) {
        onAuthSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Demo login failed. Make sure database is seeded with `npm run seed`.');
      }
    } catch (err) {
      setError('Server error during demo login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
            <Activity size={32} /> HELIO
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Enterprise Medication Intelligence & Clinical Platform
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Demo Quick Logins */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            DEMO ONE-CLICK LOGIN
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleDemoLogin('patient@helio.health')} disabled={loading}>
              <UserCheck size={14} /> Demo Patient
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleDemoLogin('doctor@helio.health')} disabled={loading}>
              <Stethoscope size={14} /> Demo Doctor
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Role Category</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${role === 'PATIENT' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setRole('PATIENT')}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${role === 'DOCTOR' ? 'btn-secondary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setRole('DOCTOR')}
                  >
                    Doctor / Physician
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
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {isLogin ? 'Sign In to HELIO' : 'Create Account'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setIsLogin(!isLogin)}
            style={{ border: 'none', color: 'var(--primary)' }}
          >
            {isLogin ? "Don't have an account? Register" : 'Already registered? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

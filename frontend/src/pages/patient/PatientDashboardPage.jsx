import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Pill, CheckCircle2, XCircle, AlertCircle, Clock, Flame, Scan, Bot, Mic, Plus, ArrowRight } from 'lucide-react';
import AdherenceProgressRing from '../../components/AdherenceProgressRing';
import EmptyState from '../../components/EmptyState';

export const PatientDashboardPage = () => {
  const { token, user } = useOutletContext();
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [refillForecast, setRefillForecast] = useState([]);
  const [complianceScore, setComplianceScore] = useState(100);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmedMedId, setConfirmedMedId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [medRes, statsRes, forecastRes] = await Promise.all([
        fetch('/api/v1/patient/medications', { headers }),
        fetch('/api/v1/patient/adherence/stats', { headers }),
        fetch('/api/v1/patient/refill-forecast', { headers }),
      ]);

      const medData = await medRes.json();
      const statsData = await statsRes.json();
      const forecastData = await forecastRes.json();

      if (medData.success) setMedications(medData.data);
      if (statsData.success) {
        setComplianceScore(statsData.data.complianceScore);
        setCurrentStreak(statsData.data.currentStreak || 0);
      }
      if (forecastData.success) setRefillForecast(forecastData.data);
    } catch (err) {
      console.error('Error loading patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleLogDose = async (medicationId, status) => {
    try {
      if (status === 'TAKEN') {
        setConfirmedMedId(medicationId);
        setTimeout(() => setConfirmedMedId(null), 1600);
      }

      await fetch('/api/v1/patient/adherence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicationId,
          scheduledTime: new Date(),
          status,
          confirmationChannel: 'APP',
        }),
      });

      fetchDashboardData();
    } catch (err) {
      console.error('Failed to log dose:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading your clinical medication dashboard...</p>
      </div>
    );
  }

  const urgentRefills = refillForecast.filter((r) => r.isUrgent);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner Greeting */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%)', borderRadius: 'var(--radius-lg)', padding: '2rem', color: '#fff', boxShadow: 'var(--shadow-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
            Patient Overview HUD
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0.25rem', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Sarah'}!
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
            Your medication schedule is active. Keep up your daily streak!
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <AdherenceProgressRing score={complianceScore} size={90} strokeWidth={9} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FBBF24', fontWeight: 800, fontSize: '1.1rem' }}>
              <Flame size={20} /> {currentStreak} Day Streak
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.2rem' }}>
              {complianceScore >= 90 ? 'Outstanding Adherence!' : 'Action Needed on Schedule'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <button onClick={() => navigate('/patient/scanner')} className="card" style={{ padding: '1.25rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
          <div style={{ padding: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
            <Scan size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Document Scanner</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan Rx or lab report</div>
          </div>
        </button>

        <button onClick={() => navigate('/patient/ai-assistant')} className="card" style={{ padding: '1.25rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
          <div style={{ padding: '0.75rem', background: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
            <Bot size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Gemini AI Assistant</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ask clinical questions</div>
          </div>
        </button>

        <button onClick={() => navigate('/patient/voice-logger')} className="card" style={{ padding: '1.25rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', borderRadius: 'var(--radius-md)' }}>
            <Mic size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Voice Dose Logger</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Log via speech AI</div>
          </div>
        </button>
      </div>

      {/* Urgent Refill Alerts (if any) */}
      {urgentRefills.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--warning)', background: 'var(--warning-light)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={24} color="var(--warning)" />
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: 800, color: '#78350F', margin: 0 }}>Upcoming Refill Required</h4>
            <p style={{ fontSize: '0.85rem', color: '#92400E', margin: '0.2rem 0 0' }}>
              You have {urgentRefills.length} medication(s) running low ({urgentRefills.map((r) => r.name).join(', ')}).
            </p>
          </div>
          <button onClick={() => navigate('/patient/medications')} className="btn btn-sm btn-outline" style={{ borderColor: '#92400E', color: '#92400E' }}>
            Manage Refills <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Today's Dose Schedule */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Today's Dose Schedule</h3>
          <button onClick={() => navigate('/patient/medications')} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} /> Manage Medications
          </button>
        </div>

        {medications.length === 0 ? (
          <EmptyState title="No Active Medications" description="Scan a prescription document or add your medications to start tracking your daily doses." actionText="Scan Prescription" onAction={() => navigate('/patient/scanner')} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {medications.map((med) => {
              const isConfirmed = confirmedMedId === med._id;
              return (
                <div
                  key={med._id}
                  className={`card ${isConfirmed ? 'dose-glow-flash' : ''}`}
                  style={{
                    padding: '1.5rem',
                    borderLeft: `4px solid ${med.remainingQuantity <= med.refillThreshold ? 'var(--warning)' : 'var(--primary)'}`,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{med.name}</h4>
                      <span className="badge badge-primary" style={{ marginTop: '0.4rem', display: 'inline-block' }}>
                        {med.dosage} • {med.frequency?.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: med.remainingQuantity <= med.refillThreshold ? 'var(--warning)' : 'var(--text-secondary)' }}>
                        {med.remainingQuantity} pills left
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Threshold: {med.refillThreshold}</div>
                    </div>
                  </div>

                  {med.instructions && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      💡 {med.instructions}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <button onClick={() => handleLogDose(med._id, 'TAKEN')} className="btn btn-sm btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} /> Log Taken
                    </button>
                    <button onClick={() => handleLogDose(med._id, 'MISSED')} className="btn btn-sm btn-outline" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                      <XCircle size={16} /> Missed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboardPage;

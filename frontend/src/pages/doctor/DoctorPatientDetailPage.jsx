import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { User, Pill, History, ShieldCheck, FilePlus, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import AdherenceProgressRing from '../../components/AdherenceProgressRing';
import EmptyState from '../../components/EmptyState';

export const DoctorPatientDetailPage = () => {
  const { token } = useOutletContext();
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  const [patientMeds, setPatientMeds] = useState([]);
  const [stats, setStats] = useState({ complianceScore: 100, currentStreak: 0, totalDoses: 0, takenDoses: 0, missedDoses: 0 });
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeepPatientFile = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [medRes, statsRes, timelineRes] = await Promise.all([
          fetch(`/api/v1/patient/medications?patientId=${patientId}`, { headers }),
          fetch(`/api/v1/patient/adherence/stats?patientId=${patientId}`, { headers }),
          fetch(`/api/v1/patient/timeline?patientId=${patientId}`, { headers }),
        ]);

        const medData = await medRes.json();
        const statsData = await statsRes.json();
        const timelineData = await timelineRes.json();

        if (medData.success) setPatientMeds(medData.data);
        if (statsData.success) setStats(statsData.data);
        if (timelineData.success) setTimeline(timelineData.data);
      } catch (err) {
        console.error('Error fetching patient file:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeepPatientFile();
  }, [token, patientId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Opening deep patient clinical file...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button onClick={() => navigate('/doctor/patients')} className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Patient Header Card */}
      <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--secondary)' }}>
            Deep Clinical File • Patient Record ID: {patientId}
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.4rem 0' }}>Sarah Jenkins (Demo Patient)</h1>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
            Type 2 Diabetes Mellitus (2019) • Essential Hypertension (2021)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)' }}>
          <AdherenceProgressRing score={stats.complianceScore} size={80} strokeWidth={8} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--secondary)' }}>{stats.complianceScore}% Score</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{stats.takenDoses} Taken / {stats.missedDoses} Missed</div>
          </div>
        </div>
      </div>

      {/* Active Medication Management */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Active Prescriptions</h3>
          <button onClick={() => navigate('/doctor/prescribe')} className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FilePlus size={15} /> Prescribe New Drug
          </button>
        </div>

        {patientMeds.length === 0 ? (
          <EmptyState title="No Active Prescriptions" description="No active medication records found for this patient file." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {patientMeds.map((med) => (
              <div key={med._id} className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontWeight: 800, margin: 0 }}>{med.name}</h4>
                <span className="badge badge-primary" style={{ marginTop: '0.3rem', display: 'inline-block' }}>
                  {med.dosage} • {med.frequency}
                </span>

                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>Remaining Supply: <strong>{med.remainingQuantity} pills</strong></div>
                  <div>Times: <strong>{(med.scheduleTimes || []).join(', ') || '08:00'}</strong></div>
                  {med.instructions && <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>"{med.instructions}"</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adherence Audit Trail Feed */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Adherence Log Trail</h3>
        {timeline.length === 0 ? (
          <EmptyState title="No Adherence Logs" description="No logged dose events recorded yet." />
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Event Title</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Channel</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((event, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>{event.title}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>{new Date(event.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span className={`badge ${event.status === 'TAKEN' ? 'badge-success' : 'badge-danger'}`}>
                        {event.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)' }}>{event.channel || 'APP'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatientDetailPage;

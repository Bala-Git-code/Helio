import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, ShieldAlert, Activity, FilePlus, ArrowRight, ShieldCheck, PhoneCall, Video } from 'lucide-react';
import SecurityVideoModal from '../../components/SecurityVideoModal';
import EmptyState from '../../components/EmptyState';

export const DoctorDashboardPage = () => {
  const { token, user } = useOutletContext();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [adherenceData, setAdherenceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [selectedPatientForCall, setSelectedPatientForCall] = useState(null);

  const fetchDoctorDashboard = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [patRes, adhRes] = await Promise.all([
        fetch('/api/v1/doctor/patients', { headers }),
        fetch('/api/v1/doctor/adherence-dashboard', { headers }),
      ]);

      const patData = await patRes.json();
      const adhData = await adhRes.json();

      if (patData.success) setPatients(patData.data);
      if (adhData.success) setAdherenceData(adhData.data);
    } catch (err) {
      console.error('Error loading doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorDashboard();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading clinical patient cohort overview...</p>
      </div>
    );
  }

  const attentionPatients = adherenceData.filter((a) => a.hasAttentionFlag);
  const avgCompliance = adherenceData.length > 0
    ? Math.round(adherenceData.reduce((acc, curr) => acc + curr.complianceScore, 0) / adherenceData.length)
    : 92;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner Greeting */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)', borderRadius: 'var(--radius-lg)', padding: '2rem', color: '#fff', boxShadow: 'var(--shadow-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 800, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
            Clinical Intelligence Dashboard
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0.25rem', letterSpacing: '-0.02em' }}>
            Welcome, {user?.name || 'Dr. Marcus Reid'}!
          </h1>
          <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>
            {user?.specialty || 'Endocrinology & Metabolic Medicine'} • License: {user?.licenseNumber || 'MD-88421'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>{patients.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Linked Patients</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{avgCompliance}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cohort Compliance</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: attentionPatients.length > 0 ? 'var(--danger)' : 'var(--secondary)' }}>
              {attentionPatients.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Urgent Attention Flags</div>
          </div>
        </div>
      </div>

      {/* High-Priority Attention Alerts (Patients with >2 Missed Doses) */}
      {attentionPatients.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={22} /> High-Priority Patient Attention Flags (&gt;2 Missed Doses)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {attentionPatients.map((item) => (
              <div key={item.patient.id} className="card" style={{ borderColor: 'var(--danger)', background: 'var(--danger-light)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, color: '#7F1D1D', margin: 0 }}>{item.patient.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 700 }}>{item.attentionReason}</span>
                  </div>
                  <span className="badge badge-danger">{item.complianceScore}% Adherence</span>
                </div>

                {item.patient.caregiverContact?.name && (
                  <p style={{ fontSize: '0.8rem', color: '#7F1D1D', marginTop: '0.5rem' }}>
                    Caregiver: {item.patient.caregiverContact.name} ({item.patient.caregiverContact.relationship}) • {item.patient.caregiverContact.phone}
                  </p>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedPatientForCall(item.patient);
                      setIsVideoOpen(true);
                    }}
                    className="btn btn-sm btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#991B1B', borderColor: '#7F1D1D' }}
                  >
                    <Video size={14} /> Encrypted Telehealth Call
                  </button>
                  <button onClick={() => navigate(`/doctor/patient/${item.patient.id}`)} className="btn btn-sm btn-outline" style={{ borderColor: '#991B1B', color: '#7F1D1D' }}>
                    Inspect File <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Cohort Summary Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Active Patient Roster</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => navigate('/doctor/patients')} className="btn btn-sm btn-outline">View Directory</button>
            <button onClick={() => navigate('/doctor/prescribe')} className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FilePlus size={15} /> Prescribe Drug
            </button>
          </div>
        </div>

        {adherenceData.length === 0 ? (
          <EmptyState title="No Linked Patients" description="Generate a DoctorPatientLink consent invite code to connect patient accounts." actionText="Generate Invite" onAction={() => navigate('/doctor/patients')} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {adherenceData.map((item) => (
              <div key={item.patient.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{item.patient.name}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.patient.email}</div>
                  </div>
                  <span className={`badge ${item.complianceScore >= 85 ? 'badge-success' : 'badge-warning'}`}>
                    {item.complianceScore}% Score
                  </span>
                </div>

                <div style={{ margin: '1rem 0', background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Consecutive Missed: <strong style={{ color: item.consecutiveMissed > 0 ? 'var(--warning)' : 'var(--success)' }}>{item.consecutiveMissed}</strong></span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={14} /> Consent Active
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => navigate(`/doctor/patient/${item.patient.id}`)} className="btn btn-sm btn-outline" style={{ flex: 1 }}>
                    Full Patient File
                  </button>
                  <button onClick={() => navigate('/doctor/prescribe')} className="btn btn-sm btn-secondary">
                    Prescribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Video Telehealth Modal */}
      {isVideoOpen && (
        <SecurityVideoModal
          patientName={selectedPatientForCall?.name || 'Patient'}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorDashboardPage;

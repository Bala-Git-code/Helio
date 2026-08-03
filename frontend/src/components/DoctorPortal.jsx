import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FilePlus, ShieldCheck, UserPlus, Send, Activity, ShieldAlert, PhoneCall, Video } from 'lucide-react';
import SecurityVideoModal from './SecurityVideoModal';
import EmptyState from './EmptyState';

export const DoctorPortal = ({ token, user }) => {
  const [patients, setPatients] = useState([]);
  const [adherenceData, setAdherenceData] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Security Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Invite Patient Consent State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResult, setInviteResult] = useState(null);

  // Issue Prescription State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [rxForm, setRxForm] = useState({
    medicationName: '',
    dosage: '',
    frequency: 'TWICE_DAILY',
    durationDays: 30,
    instructions: '',
  });

  const [safetyCheckResult, setSafetyCheckResult] = useState(null);

  const fetchDoctorData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [patRes, adhRes, rxRes] = await Promise.all([
        fetch('/api/v1/doctor/patients', { headers }),
        fetch('/api/v1/doctor/adherence-dashboard', { headers }),
        fetch('/api/v1/doctor/prescriptions', { headers }),
      ]);

      const patData = await patRes.json();
      const adhData = await adhRes.json();
      const rxData = await rxRes.json();

      if (patData.success) setPatients(patData.data);
      if (adhData.success) setAdherenceData(adhData.data);
      if (rxData.success) setPrescriptions(rxData.data);
    } catch (err) {
      console.error('Error loading Doctor Portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [token]);

  // Handle Generating Patient Consent Link
  const handleCreateConsentInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await fetch('/api/v1/doctor/consent/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientEmail: inviteEmail }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteResult(data);
        setInviteEmail('');
        fetchDoctorData();
      } else {
        alert(data.error || 'Failed to link patient consent.');
      }
    } catch (err) {
      console.error('Consent link creation failed:', err);
    }
  };

  // Handle Issuing New Prescription
  const handleIssuePrescription = async (e, bypassSafetyCheck = false) => {
    e.preventDefault();
    if (!selectedPatientId || !rxForm.medicationName || !rxForm.dosage) {
      alert('Please select a patient and fill in medication details.');
      return;
    }

    try {
      const res = await fetch('/api/v1/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: selectedPatientId,
          ...rxForm,
          durationDays: Number(rxForm.durationDays),
          bypassSafetyCheck,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Prescription for ${rxForm.medicationName} successfully issued and Outbox event dispatched!`);
        setRxForm({ medicationName: '', dosage: '', frequency: 'TWICE_DAILY', durationDays: 30, instructions: '' });
        setSafetyCheckResult(null);
        fetchDoctorData();
      } else if (data.safetyCheck) {
        setSafetyCheckResult(data.safetyCheck);
      } else {
        alert(data.error || 'Failed to issue prescription.');
      }
    } catch (err) {
      console.error('Prescription issuance failed:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner & Security Video Launcher */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)' }}>Physician Command Center</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Welcome Dr. {user?.name} ({user?.specialty || 'Endocrinology'}) • License: {user?.licenseNumber || 'Verified'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={() => setIsVideoModalOpen(true)}>
              <Video size={16} color="var(--primary)" /> Consent & Security Video
            </button>
            <div className="badge badge-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <ShieldCheck size={18} /> Consent Security Active
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Patient Compliance Monitor & Consent Roster */}
      <div className="grid-2">
        {/* Compliance Monitor & Attention Flags */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Activity color="var(--danger)" size={22} /> Adherence Monitor & Escalations
            </h2>
            <span className="badge badge-danger">Real-time Compliance</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton skeleton-box" style={{ height: '75px' }} />
              <div className="skeleton skeleton-box" style={{ height: '75px' }} />
            </div>
          ) : adherenceData.length === 0 ? (
            <EmptyState type="noMissed" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {adherenceData.map((item) => (
                <div
                  key={item.patient.id}
                  className={`card ${item.hasAttentionFlag ? 'pulse-red-border' : ''}`}
                  style={{
                    padding: '1.1rem',
                    backgroundColor: item.hasAttentionFlag ? 'var(--danger-light)' : 'var(--bg-secondary)',
                    marginBottom: 0,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {item.patient.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.patient.email} • {item.patient.phone || 'No phone'}
                      </div>
                      {item.patient.caregiverContact?.name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <PhoneCall size={12} /> Caregiver: {item.patient.caregiverContact.name} ({item.patient.caregiverContact.phone})
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: item.complianceScore >= 80 ? 'var(--secondary)' : 'var(--danger)' }}>
                        {item.complianceScore}%
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ADHERENCE</div>
                    </div>
                  </div>

                  {item.hasAttentionFlag && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <AlertTriangle size={16} /> ATTENTION ALERT: {item.attentionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient Consent Link Manager */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Users color="var(--primary)" size={22} /> Patient Consent & Roster
            </h2>
          </div>

          <form onSubmit={handleCreateConsentInvite} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input
              type="email"
              className="form-control"
              placeholder="Patient Email (e.g. patient@helio.health)"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">
              <UserPlus size={16} /> Link
            </button>
          </form>

          {inviteResult && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--success-light)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600 }}>
              ✓ Consent Link verified and active for patient!
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patients.map((p) => (
              <div key={p.linkId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.patient?.name || 'Patient'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.patient?.email}</div>
                </div>
                <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prescription Builder & Audit Logs */}
      <div className="grid-2">
        {/* Prescription Creation Builder */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <FilePlus color="var(--primary)" size={22} /> Prescribe Medication
            </h2>
          </div>

          {safetyCheckResult && (
            <div style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
            }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                <ShieldAlert size={16} /> Drug Interaction Contraindication ({safetyCheckResult.severity})
              </div>
              <div style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                {safetyCheckResult.warning}
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                style={{ marginTop: '0.5rem', width: '100%' }}
                onClick={(e) => handleIssuePrescription(e, true)}
              >
                Override Safety Alert & Force Prescribe
              </button>
            </div>
          )}

          <form onSubmit={(e) => handleIssuePrescription(e, false)}>
            <div className="form-group">
              <label className="form-label">Select Linked Patient</label>
              <select className="form-control" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} required>
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.patient?._id} value={p.patient?._id}>
                    {p.patient?.name} ({p.patient?.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Medication Name</label>
              <input type="text" className="form-control" placeholder="e.g. Warfarin" value={rxForm.medicationName} onChange={(e) => setRxForm({ ...rxForm, medicationName: e.target.value })} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Dosage</label>
                <input type="text" className="form-control" placeholder="e.g. 5mg" value={rxForm.dosage} onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Days)</label>
                <input type="number" className="form-control" value={rxForm.durationDays} onChange={(e) => setRxForm({ ...rxForm, durationDays: e.target.value })} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Instructions</label>
              <textarea className="form-control" rows={3} placeholder="Take 1 tablet daily with morning meal." value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <Send size={16} /> Issue Prescription & Safety Check
            </button>
          </form>
        </div>

        {/* Prescription Audit Logs */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Prescription History & Audit Log</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }}>
            {prescriptions.length === 0 ? (
              <EmptyState type="prescriptions" />
            ) : (
              prescriptions.map((rx) => (
                <div key={rx._id} style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div style={{ fontWeight: 700 }}>{rx.medicationName} ({rx.dosage})</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Patient: {rx.patientId?.name} • Issued: {new Date(rx.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Instructions: {rx.instructions}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Security Explanation Video Modal */}
      <SecurityVideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />
    </div>
  );
};

export default DoctorPortal;

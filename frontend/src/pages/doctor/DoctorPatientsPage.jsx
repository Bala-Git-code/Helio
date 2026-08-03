import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, UserPlus, Search, ShieldCheck, Copy, CheckCircle2, ArrowRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

export const DoctorPatientsPage = () => {
  const { token } = useOutletContext();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Consent Link Generator State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/v1/doctor/patients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPatients(data.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const handleGenerateConsentInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setGeneratingInvite(true);

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
        setInviteResult(data.data);
        setInviteEmail('');
        fetchPatients();
      } else {
        alert(data.error || 'Failed to generate consent link.');
      }
    } catch (err) {
      console.error('Invite generation failed:', err);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const filteredPatients = patients.filter((item) => {
    const p = item.patient || {};
    const query = searchQuery.toLowerCase();
    return (p.name || '').toLowerCase().includes(query) || (p.email || '').toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading patient consent directory...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dedicated Patient Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage active patient consent authorizations, view clinical files, and generate new DoctorPatientLink codes.
          </p>
        </div>
      </div>

      {/* Consent Link Invitation Generator Card */}
      <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} color="var(--secondary)" /> Generate DoctorPatientLink Authorization Code
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Enter a registered patient email to generate an active HIPAA consent link and authorize medical record access.
        </p>

        <form onSubmit={handleGenerateConsentInvite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            className="form-control"
            placeholder="patient@helio.health"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{ flex: 1, minWidth: '240px' }}
            required
          />
          <button type="submit" disabled={generatingInvite} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {generatingInvite ? 'Generating Link...' : 'Issue Consent Link'}
          </button>
        </form>

        {inviteResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--success-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--secondary)' }}>
            <div style={{ fontWeight: 800, color: 'var(--secondary-hover)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={18} /> Consent Link Created & Active!
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <code style={{ background: 'rgba(255,255,255,0.8)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '0.95rem' }}>
                {inviteResult.inviteCode || 'HELIO-CONSENT-ACTIVE'}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteResult.inviteCode || 'HELIO-CONSENT-ACTIVE');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn btn-sm btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Copy size={14} /> {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Directory Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-control"
          placeholder="Search patients by name or email address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '2.75rem', fontSize: '0.95rem' }}
        />
      </div>

      {/* Patient Directory Roster Grid */}
      {filteredPatients.length === 0 ? (
        <EmptyState title="No Matching Patients" description="No patient accounts found matching your search query." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredPatients.map((item) => {
            const p = item.patient || {};
            return (
              <div key={item.linkId} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.name?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{p.name}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.email}</div>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={13} /> {item.status}
                    </span>
                  </div>

                  <div style={{ margin: '1rem 0', background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div>Phone: <strong>{p.phone || 'N/A'}</strong></div>
                    {p.caregiverContact?.name && (
                      <div style={{ marginTop: '0.25rem' }}>
                        Caregiver: <strong>{p.caregiverContact.name} ({p.caregiverContact.relationship})</strong>
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={() => navigate(`/doctor/patient/${p._id}`)} className="btn btn-outline btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  Inspect Full Patient File <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorPatientsPage;

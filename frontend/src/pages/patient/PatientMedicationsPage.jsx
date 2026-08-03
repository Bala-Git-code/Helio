import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pill, Plus, AlertTriangle, ShieldCheck, Clock, RefreshCw, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

export const PatientMedicationsPage = () => {
  const { token } = useOutletContext();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Medication Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'ONCE_DAILY',
    totalQuantity: 30,
    remainingQuantity: 30,
    refillThreshold: 7,
    scheduleTimes: '08:00',
    instructions: '',
  });

  const [checkingSafety, setCheckingSafety] = useState(false);
  const [safetyResult, setSafetyResult] = useState(null);

  const fetchMedications = async () => {
    try {
      const res = await fetch('/api/v1/patient/medications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMedications(data.data);
    } catch (err) {
      console.error('Failed to fetch medications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [token]);

  const handleCheckSafety = async () => {
    if (!newMed.name || !newMed.dosage) return;
    setCheckingSafety(true);
    setSafetyResult(null);

    try {
      const res = await fetch('/api/v1/patient/check-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newMedication: { name: newMed.name, dosage: newMed.dosage } }),
      });
      const data = await res.json();
      if (data.success) setSafetyResult(data.data);
    } catch (err) {
      console.error('Safety check failed:', err);
    } finally {
      setCheckingSafety(false);
    }
  };

  const handleAddMedication = async (e, skipInteractionCheck = false) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage) return;

    try {
      const timesArr = newMed.scheduleTimes.split(',').map((t) => t.trim());
      const res = await fetch('/api/v1/patient/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newMed,
          scheduleTimes: timesArr,
          skipInteractionCheck,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setNewMed({ name: '', dosage: '', frequency: 'ONCE_DAILY', totalQuantity: 30, remainingQuantity: 30, refillThreshold: 7, scheduleTimes: '08:00', instructions: '' });
        setSafetyResult(null);
        fetchMedications();
      } else if (data.safetyCheck) {
        setSafetyResult(data.safetyCheck);
      }
    } catch (err) {
      console.error('Error adding medication:', err);
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!window.confirm('Are you sure you want to remove this medication prescription?')) return;
    try {
      await fetch(`/api/v1/patient/medications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMedications();
    } catch (err) {
      console.error('Error deleting medication:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading prescription inventory...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dedicated Medication Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage active prescriptions, pill counts, schedule times, and AI Drug Interaction verification.
          </p>
        </div>

        <button onClick={() => setIsAddOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Prescription
        </button>
      </div>

      {medications.length === 0 ? (
        <EmptyState title="No Active Prescriptions" description="Your prescription inventory is currently empty. Add your first medication to enable automated dosing alerts." actionText="Add Medication" onAction={() => setIsAddOpen(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {medications.map((med) => (
            <div key={med._id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.6rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
                      <Pill size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>{med.name}</h3>
                      <span className="badge badge-primary" style={{ marginTop: '0.25rem', display: 'inline-block' }}>{med.dosage}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMedication(med._id)} className="btn btn-sm btn-outline" style={{ borderColor: 'transparent', color: 'var(--danger)' }} title="Remove Medication">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ margin: '1.25rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Frequency</span>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{med.frequency?.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Schedule Times</span>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{(med.scheduleTimes || []).join(', ') || '08:00'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Pill Count</span>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: med.remainingQuantity <= med.refillThreshold ? 'var(--warning)' : 'var(--text-primary)' }}>
                      {med.remainingQuantity} / {med.totalQuantity}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Refill Alert</span>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>≤ {med.refillThreshold} pills</div>
                  </div>
                </div>

                {med.instructions && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{med.instructions}"
                  </p>
                )}
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Status: <strong style={{ color: 'var(--success)' }}>ACTIVE</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontWeight: 600 }}>
                  <ShieldCheck size={14} /> Interaction Screened
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Medication Modal */}
      {isAddOpen && (
        <div style={{ fixed: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.25rem' }}>Add New Prescription</h3>

            <form onSubmit={handleAddMedication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Medication Name</label>
                <input type="text" className="form-control" placeholder="e.g. Metformin, Lisinopril" value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Dosage</label>
                  <input type="text" className="form-control" placeholder="e.g. 500mg, 10mg" value={newMed.dosage} onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Frequency</label>
                  <select className="form-control" value={newMed.frequency} onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}>
                    <option value="ONCE_DAILY">Once Daily</option>
                    <option value="TWICE_DAILY">Twice Daily</option>
                    <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                    <option value="AS_NEEDED">As Needed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Total Quantity</label>
                  <input type="number" className="form-control" value={newMed.totalQuantity} onChange={(e) => setNewMed({ ...newMed, totalQuantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="form-label">Refill Threshold</label>
                  <input type="number" className="form-control" value={newMed.refillThreshold} onChange={(e) => setNewMed({ ...newMed, refillThreshold: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div>
                <label className="form-label">Schedule Times (Comma-separated 24h format)</label>
                <input type="text" className="form-control" placeholder="08:00, 20:00" value={newMed.scheduleTimes} onChange={(e) => setNewMed({ ...newMed, scheduleTimes: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Dosing Instructions</label>
                <textarea className="form-control" rows={2} placeholder="Take with food..." value={newMed.instructions} onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })} />
              </div>

              {/* Safety Check Button & Result Display */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} color="var(--primary)" /> Gemini AI Safety Screening
                  </span>
                  <button type="button" onClick={handleCheckSafety} disabled={checkingSafety || !newMed.name} className="btn btn-sm btn-outline">
                    {checkingSafety ? 'Analyzing...' : 'Run Screen'}
                  </button>
                </div>

                {safetyResult && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: safetyResult.hasInteraction ? 'var(--danger-light)' : 'var(--success-light)', color: safetyResult.hasInteraction ? 'var(--danger)' : 'var(--secondary)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {safetyResult.hasInteraction ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
                      {safetyResult.hasInteraction ? `CONTRAINDICATION SEVERITY: ${safetyResult.severity}` : 'No Significant Drug Interactions Detected'}
                    </div>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0 }}>{safetyResult.warning || safetyResult.clinicalNotes}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMedicationsPage;

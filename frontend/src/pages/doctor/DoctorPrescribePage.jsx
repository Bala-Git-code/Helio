import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FilePlus, ShieldAlert, CheckCircle2, Sparkles, AlertTriangle, Send } from 'lucide-react';

export const DoctorPrescribePage = () => {
  const { token } = useOutletContext();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [rxForm, setRxForm] = useState({
    medicationName: '',
    dosage: '',
    frequency: 'TWICE_DAILY',
    durationDays: 30,
    instructions: '',
  });

  const [checkingSafety, setCheckingSafety] = useState(false);
  const [safetyCheckResult, setSafetyCheckResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/v1/doctor/patients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setPatients(data.data);
          const firstPatId = data.data[0].patient?._id || data.data[0].patient?.id;
          if (firstPatId) setSelectedPatientId(firstPatId);
        }
      } catch (err) {
        console.error('Failed to load patients for prescription builder:', err);
      }
    };
    fetchPatients();
  }, [token]);

  const handleRunInteractionCheck = async () => {
    if (!selectedPatientId || !rxForm.medicationName || !rxForm.dosage) return;
    setCheckingSafety(true);
    setSafetyCheckResult(null);

    try {
      // Fetch patient's existing active meds
      const medRes = await fetch(`/api/v1/patient/medications?patientId=${selectedPatientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const medData = await medRes.json();
      const existingMeds = medData.success ? medData.data : [];

      const checkRes = await fetch('/api/v1/patient/check-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newMedication: { name: rxForm.medicationName, dosage: rxForm.dosage },
          existingMedications: existingMeds,
        }),
      });

      const checkData = await checkRes.json();
      if (checkData.success) setSafetyCheckResult(checkData.data);
    } catch (err) {
      console.error('Safety check failed:', err);
    } finally {
      setCheckingSafety(false);
    }
  };

  const handleIssuePrescription = async (e, bypassSafetyCheck = false) => {
    e.preventDefault();
    if (!selectedPatientId || !rxForm.medicationName || !rxForm.dosage) return;
    setSubmitting(true);
    setErrorMsg(null);

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
          bypassSafetyCheck,
        }),
      });

      const data = await res.json();
      if (data.success) {
        navigate('/doctor/dashboard');
      } else if (data.safetyCheck) {
        setSafetyCheckResult(data.safetyCheck);
        setErrorMsg(data.error);
      } else {
        setErrorMsg(data.error || 'Failed to issue prescription.');
      }
    } catch (err) {
      console.error('Prescription issue error:', err);
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Sparkles size={14} /> Gemini 1.5 Flash Drug Interaction Engine
        </span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Prescription Builder & DDI Safety Engine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Issue new prescriptions for active patients. Gemini Flash checks for harmful drug-drug contraindications in real-time.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)' }}>
        <form onSubmit={(e) => handleIssuePrescription(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label">Select Patient</label>
            <select className="form-control" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} required>
              {patients.map((item) => {
                const p = item.patient || {};
                return (
                  <option key={item.linkId} value={p._id || p.id}>
                    {p.name} ({p.email})
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Medication Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Spironolactone, Warfarin, Metformin"
                value={rxForm.medicationName}
                onChange={(e) => setRxForm({ ...rxForm, medicationName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Dosage</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 25mg, 500mg"
                value={rxForm.dosage}
                onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Frequency</label>
              <select className="form-control" value={rxForm.frequency} onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })}>
                <option value="ONCE_DAILY">Once Daily</option>
                <option value="TWICE_DAILY">Twice Daily</option>
                <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                <option value="AS_NEEDED">As Needed</option>
              </select>
            </div>
            <div>
              <label className="form-label">Duration (Days)</label>
              <input
                type="number"
                className="form-control"
                value={rxForm.durationDays}
                onChange={(e) => setRxForm({ ...rxForm, durationDays: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Clinical Instructions & Notes</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Take once daily with morning breakfast..."
              value={rxForm.instructions}
              onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })}
            />
          </div>

          {/* DDI Safety Screening Panel */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h5 style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} color="var(--secondary)" /> Drug-Drug Interaction Safety Screen
                </h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  Screen proposed drug against patient's active regimen
                </p>
              </div>
              <button type="button" onClick={handleRunInteractionCheck} disabled={checkingSafety || !rxForm.medicationName} className="btn btn-sm btn-secondary">
                {checkingSafety ? 'Checking...' : 'Run Interaction Screen'}
              </button>
            </div>

            {safetyCheckResult && (
              <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-sm)', background: safetyCheckResult.hasInteraction ? 'var(--danger-light)' : 'var(--success-light)', color: safetyCheckResult.hasInteraction ? 'var(--danger)' : 'var(--secondary-hover)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {safetyCheckResult.hasInteraction ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
                  {safetyCheckResult.hasInteraction ? `HIGH RISK CONTRAINDICATION DETECTED (${safetyCheckResult.severity})` : 'Safety Screen Clear — No Contraindications Found'}
                </div>
                <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', marginBottom: 0 }}>
                  {safetyCheckResult.warning || safetyCheckResult.clinicalNotes}
                </p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div style={{ padding: '1rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} /> {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {safetyCheckResult?.hasInteraction && safetyCheckResult.severity === 'HIGH' && (
              <button type="button" onClick={(e) => handleIssuePrescription(e, true)} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                Bypass & Force Issue
              </button>
            )}
            <button type="submit" disabled={submitting} className="btn btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.85rem' }}>
              <Send size={18} /> {submitting ? 'Issuing Prescription...' : 'Issue Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorPrescribePage;

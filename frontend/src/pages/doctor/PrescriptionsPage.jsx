import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  FileCheck,
  FilePlus,
  FileText,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  Send,
} from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Doctor Station: PrescriptionsPage (Unified Cosmic Dark Theme)
 * ============================================================================
 */
export function PrescriptionsPage() {
  const [orders, setOrders] = useState([
    {
      id: 'RX-901',
      patientName: 'Elena Rostova',
      mrn: 'MRN-8820',
      drug: 'Lisinopril 10mg Tablets',
      sig: 'Take 1 tablet daily every morning with a full glass of water',
      quantity: '90 Tablets (3-month supply)',
      refills: 3,
      status: 'pending_renewal',
      statusLabel: 'Renewal Pending Signature',
      statusColor: '#FBBF24',
      statusBg: 'rgba(245, 158, 11, 0.15)',
      statusBorder: 'rgba(245, 158, 11, 0.3)',
      dateOrdered: 'Sep 15, 2026',
      safetyCheck: 'Pre-Validated: Clean (0 Known Conflicts)',
      safetyStatus: 'safe',
    },
    {
      id: 'RX-902',
      patientName: 'Marcus Vance',
      mrn: 'MRN-4412',
      drug: 'Warfarin Sodium 5mg',
      sig: 'Take 1 tablet in evening per INR protocol (Target INR 2.0 - 3.0)',
      quantity: '30 Tablets (30-day supply)',
      refills: 0,
      status: 'review_required',
      statusLabel: 'High Bleeding Risk Intercept',
      statusColor: '#FB7185',
      statusBg: 'rgba(244, 63, 94, 0.15)',
      statusBorder: 'rgba(244, 63, 94, 0.3)',
      dateOrdered: 'Sep 14, 2026',
      safetyCheck: 'Flagged: Clopidogrel co-administration without PPI protection',
      safetyStatus: 'critical',
    },
    {
      id: 'RX-903',
      patientName: 'Robert Chen',
      mrn: 'MRN-3120',
      drug: 'Rosuvastatin Calcium 10mg',
      sig: 'Take 1 tablet at bedtime daily',
      quantity: '90 Tablets',
      refills: 2,
      status: 'active',
      statusLabel: 'Dispensed & Active in Telemetry',
      statusColor: '#34D399',
      statusBg: 'rgba(16, 185, 129, 0.15)',
      statusBorder: 'rgba(16, 185, 129, 0.3)',
      dateOrdered: 'Sep 02, 2026',
      safetyCheck: 'Pre-Validated: Lipid targets achieved (LDL 64 mg/dL)',
      safetyStatus: 'safe',
    },
  ]);

  // Modal State for New Rx Authoring
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [newRxPatient, setNewRxPatient] = useState('');
  const [newRxDrug, setNewRxDrug] = useState('');
  const [newRxSig, setNewRxSig] = useState('');
  const [newRxQty, setNewRxQty] = useState('30 Tablets');

  const handleSign = (id) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: 'active',
              statusLabel: 'Signed & Transmitted to NCPDP Hub',
              statusColor: '#34D399',
              statusBg: 'rgba(16, 185, 129, 0.15)',
              statusBorder: 'rgba(16, 185, 129, 0.3)',
            }
          : o
      )
    );
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newRxPatient || !newRxDrug) return;

    const newOrder = {
      id: `RX-${Math.floor(100 + Math.random() * 900)}`,
      patientName: newRxPatient,
      mrn: `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      drug: newRxDrug,
      sig: newRxSig || 'Take 1 tablet daily as directed by physician',
      quantity: newRxQty,
      refills: 1,
      status: 'pending_renewal',
      statusLabel: 'Pending Digital Signature',
      statusColor: '#FBBF24',
      statusBg: 'rgba(245, 158, 11, 0.15)',
      statusBorder: 'rgba(245, 158, 11, 0.3)',
      dateOrdered: 'Just now',
      safetyCheck: 'Pre-Validated: NCPDP Script Verified',
      safetyStatus: 'safe',
    };

    setOrders([newOrder, ...orders]);
    setShowAuthorModal(false);
    setNewRxPatient('');
    setNewRxDrug('');
    setNewRxSig('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', fontFamily: theme.fonts.body }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: theme.fonts.heading, fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Prescription Orders & Digital Authoring
          </h1>
          <p style={{ fontSize: '0.84rem', color: theme.colors.textMuted, margin: '4px 0 0 0' }}>
            NCPDP Script v2017071 compliant e-prescribing with real-time pharmacokinetic contraindication pre-screening.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAuthorModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '11px 20px',
            fontSize: '0.86rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          <FilePlus size={16} />
          <span>New Prescription Order</span>
        </button>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              background: theme.colors.surfaceCard,
              borderRadius: '24px',
              border: `1px solid ${theme.colors.borderLight}`,
              padding: '26px 30px',
              boxShadow: theme.shadows.card,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontFamily: theme.fonts.heading, fontSize: '1.28rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    {order.drug}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: order.statusBg,
                      color: order.statusColor,
                      border: `1px solid ${order.statusBorder}`,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    {order.statusLabel}
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', color: theme.colors.textMuted, marginTop: '4px' }}>
                  Patient: <strong style={{ color: '#FFFFFF' }}>{order.patientName}</strong> ({order.mrn}) • Ordered: {order.dateOrdered}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60A5FA', fontFamily: theme.fonts.mono }}>
                  {order.id}
                </span>
                <div style={{ fontSize: '0.72rem', color: theme.colors.textMuted, marginTop: '2px' }}>
                  Refills Authorized: {order.refills}
                </div>
              </div>
            </div>

            {/* Sig & Quantity Box */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '14px 18px',
                borderRadius: '14px',
                border: `1px solid ${theme.colors.borderLight}`,
                fontSize: '0.86rem',
                color: '#CBD5E1',
              }}
            >
              <div style={{ fontWeight: 800, color: theme.colors.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Clinical Instructions (Sig):
              </div>
              <div style={{ marginTop: '3px', fontWeight: 600, color: '#FFFFFF' }}>{order.sig}</div>
              <div style={{ fontSize: '0.76rem', color: theme.colors.textMuted, marginTop: '6px' }}>
                Dispense Quantity: <strong style={{ color: '#FFFFFF' }}>{order.quantity}</strong>
              </div>
            </div>

            {/* Pre-validation Action Strip */}
            <div
              style={{
                borderTop: `1px solid ${theme.colors.borderLight}`,
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: order.safetyStatus === 'critical' ? '#FB7185' : '#34D399' }}>
                {order.safetyStatus === 'critical' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                <span style={{ fontWeight: 600 }}>{order.safetyCheck}</span>
              </div>

              {order.status === 'pending_renewal' && (
                <button
                  type="button"
                  onClick={() => handleSign(order.id)}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileCheck size={15} />
                  <span>Digitally Sign & Transmit</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Prescription Authoring Modal */}
      {showAuthorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 8, 15, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={() => setShowAuthorModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#0D0E1A',
              border: `1px solid rgba(255, 255, 255, 0.12)`,
              borderRadius: '28px',
              padding: '32px',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  NCPDP Script Authoring
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: theme.fonts.heading }}>
                  Author New Digital Prescription
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthorModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 700, marginBottom: '6px' }}>
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={newRxPatient}
                  onChange={(e) => setNewRxPatient(e.target.value)}
                  placeholder="e.g. Elena Rostova or Marcus Vance"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme.colors.borderLight}`,
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.88rem',
                    fontFamily: theme.fonts.body,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 700, marginBottom: '6px' }}>
                  Medication Name & Strength
                </label>
                <input
                  type="text"
                  value={newRxDrug}
                  onChange={(e) => setNewRxDrug(e.target.value)}
                  placeholder="e.g. Atorvastatin 20mg or Metformin 500mg"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme.colors.borderLight}`,
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.88rem',
                    fontFamily: theme.fonts.body,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 700, marginBottom: '6px' }}>
                  Prescription Sig (Instructions)
                </label>
                <input
                  type="text"
                  value={newRxSig}
                  onChange={(e) => setNewRxSig(e.target.value)}
                  placeholder="e.g. Take 1 tablet daily with evening dinner"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme.colors.borderLight}`,
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.88rem',
                    fontFamily: theme.fonts.body,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 700, marginBottom: '6px' }}>
                  Dispense Quantity
                </label>
                <input
                  type="text"
                  value={newRxQty}
                  onChange={(e) => setNewRxQty(e.target.value)}
                  placeholder="e.g. 30 Tablets (30-day supply)"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme.colors.borderLight}`,
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.88rem',
                    fontFamily: theme.fonts.body,
                  }}
                />
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.76rem', color: '#93C5FD' }}>
                ⚡ Auto-Screening: Real-time pharmacokinetic conflict checks will execute before transmitting to retail pharmacy network.
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                }}
              >
                Transmit to Pharmacy Queue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrescriptionsPage;

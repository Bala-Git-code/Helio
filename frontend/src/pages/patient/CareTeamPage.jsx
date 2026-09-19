import React from 'react';
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserCheck
} from 'lucide-react';
import { theme } from '../../theme/theme';
import { ShareAccessCode } from '../../components/patient/ShareAccessCode';

/**
 * ============================================================================
 * HELIO Care Team Directory Page (Pure React Styled)
 * ============================================================================
 */
export const CareTeamPage = () => {
  const clinicians = [
    {
      id: 'c1',
      name: 'Dr. Aris Thorne, MD, FACC',
      role: 'Primary Attending Cardiologist',
      clinic: 'Helio Heart & Vascular Institute',
      location: 'Building B, Suite 402',
      phone: '+1 (555) 234-5678',
      email: 'a.thorne@heliohealth.org',
      activeRx: ['Lisinopril 10mg', 'Atorvastatin 20mg', 'Omega-3 1000mg'],
      availability: 'Mon, Wed, Fri (09:00 AM - 04:30 PM)',
      initials: 'AT',
      badgeColor: theme.colors.indigo600,
    },
    {
      id: 'c2',
      name: 'Dr. Sarah Jenkins, MD',
      role: 'Consulting Endocrinologist',
      clinic: 'Metabolic Health Center',
      location: 'Pavilion East, Suite 210',
      phone: '+1 (555) 876-5432',
      email: 's.jenkins@heliohealth.org',
      activeRx: ['Metformin 500mg ER'],
      availability: 'Tue, Thu (10:00 AM - 05:00 PM)',
      initials: 'SJ',
      badgeColor: theme.colors.teal600,
    },
    {
      id: 'c3',
      name: 'Marcus Bell, PharmD, BCPS',
      role: 'Clinical Pharmacist & Adherence Specialist',
      clinic: 'Helio Integrated Specialty Pharmacy',
      location: 'Ground Floor, Dispensing Wing',
      phone: '+1 (555) 345-6789',
      email: 'm.bell@heliopharmacy.org',
      activeRx: ['All Active Formularies & Interaction Audits'],
      availability: 'Daily (08:00 AM - 06:00 PM)',
      initials: 'MB',
      badgeColor: theme.colors.amethyst600,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', fontFamily: theme.fonts.body }}>
      <div>
        <h1 style={{ fontFamily: theme.fonts.heading, fontSize: '1.75rem', fontWeight: 700, margin: 0, color: theme.colors.textPrimary }}>
          My Clinical Care Team
        </h1>
        <p style={{ fontSize: '0.84rem', color: theme.colors.textMuted, margin: '4px 0 0 0' }}>
          Direct communication channels with your licensed physicians, clinical pharmacists, and prescribing specialists.
        </p>
      </div>

      {/* Patient Pairing Access Delegation Card */}
      <ShareAccessCode />

      {/* Clinicians Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '20px' }}>
        {clinicians.map((doc) => (
          <div
            key={doc.id}
            style={{
              background: theme.colors.surfaceCard,
              borderRadius: theme.radii.xl,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: '24px',
              boxShadow: theme.shadows.card,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '18px',
            }}
          >
            <div>
              {/* Doctor Identity */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: theme.radii.pill,
                    background: `linear-gradient(135deg, ${doc.badgeColor} 0%, #1E1B4B 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontSize: '1rem',
                  }}
                >
                  {doc.initials}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontFamily: theme.fonts.heading, fontSize: '1.14rem', fontWeight: 700, margin: 0, color: theme.colors.textPrimary }}>
                      {doc.name}
                    </h3>
                    <ShieldCheck size={16} color={theme.colors.teal500} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: doc.badgeColor, fontWeight: 600 }}>
                    {doc.role}
                  </div>
                </div>
              </div>

              {/* Clinic Metadata */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: theme.colors.textSecondary }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color={theme.colors.textMuted} />
                  <span>{doc.clinic} — {doc.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color={theme.colors.textMuted} />
                  <span>{doc.availability}</span>
                </div>
              </div>

              {/* Supervised Regimens */}
              <div style={{ marginTop: '14px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.textMuted }}>
                  Supervised Prescriptions:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {doc.activeRx.map((rx, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: theme.radii.pill,
                        backgroundColor: theme.colors.surfaceGroundWarm,
                        color: theme.colors.textPrimary,
                        border: `1px solid ${theme.colors.borderLight}`,
                      }}
                    >
                      {rx}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                borderTop: `1px solid ${theme.colors.borderLight}`,
                paddingTop: '14px',
                display: 'flex',
                gap: '10px',
              }}
            >
              <button
                type="button"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: theme.colors.indigo600,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: theme.radii.pill,
                  padding: '9px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: theme.shadows.subtle,
                }}
              >
                <MessageSquare size={14} />
                <span>Secure Message</span>
              </button>

              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: theme.colors.surfaceCard,
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: theme.radii.pill,
                  padding: '9px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Phone size={14} />
                <span>Call Clinic</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareTeamPage;

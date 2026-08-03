import React from 'react';
import { ShieldCheck, X, PlayCircle, Lock } from 'lucide-react';

export const SecurityVideoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay">
      <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ color: 'var(--primary)' }}>
            <ShieldCheck size={22} /> WhatsApp Security & Consent Architecture
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Video Player Container */}
        <div style={{
          position: 'relative',
          paddingTop: '56.25%', // 16:9 Aspect Ratio
          backgroundColor: '#000000',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-md)',
        }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
            src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0"
            title="HELIO WhatsApp Consent & Security Architecture Overview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            <Lock size={16} color="var(--secondary)" /> HIPAA-Compliant End-to-End Encrypted Notifications
          </div>
          <p>
            All WhatsApp Cloud API messages utilize two-way interactive button confirmations (`Confirm Dose` / `Skip Dose`) protected by role-based authorization and explicit patient consent links.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityVideoModal;

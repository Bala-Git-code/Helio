import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { History, CheckCircle2, XCircle, FileText, Clock, Smartphone, Mic, Bot } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

export const PatientTimelinePage = () => {
  const { token } = useOutletContext();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    try {
      const res = await fetch('/api/v1/patient/timeline', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTimeline(data.data);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading health audit trail timeline...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Health & Adherence Audit Timeline</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Complete chronological log of confirmed doses, missed medication alerts, prescription changes, and physician updates.
        </p>
      </div>

      {timeline.length === 0 ? (
        <EmptyState title="Audit Trail Empty" description="Logged doses and prescription updates will appear here automatically." />
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          {/* Vertical Timeline Line */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '15px', width: '2px', background: 'var(--border-color)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {timeline.map((event, idx) => {
              const isTaken = event.status === 'TAKEN';
              const isMissed = event.status === 'MISSED';
              const isRx = event.type === 'PRESCRIPTION_ADDED';

              return (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Timeline Dot Icon */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-2rem',
                      top: '0.2rem',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isRx ? 'var(--primary)' : isTaken ? 'var(--secondary)' : 'var(--danger)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 4px var(--bg-primary)',
                    }}
                  >
                    {isRx ? <FileText size={16} /> : isTaken ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>

                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{event.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {event.details && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                        {event.details}
                      </p>
                    )}

                    {event.channel && (
                      <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, background: 'var(--bg-tertiary)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>
                        {event.channel === 'VOICE' ? <Mic size={12} /> : <Smartphone size={12} />}
                        Logged via {event.channel} Channel
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTimelinePage;

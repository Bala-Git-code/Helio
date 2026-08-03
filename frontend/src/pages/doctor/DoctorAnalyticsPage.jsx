import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart3, TrendingUp, AlertCircle, Calendar, RefreshCcw, Activity } from 'lucide-react';

export const DoctorAnalyticsPage = () => {
  const { token } = useOutletContext();
  const [adherenceData, setAdherenceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCohortData = async () => {
      try {
        const res = await fetch('/api/v1/doctor/adherence-dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setAdherenceData(data.data);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCohortData();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Calculating cohort compliance analytics & heatmaps...</p>
      </div>
    );
  }

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Heatmap simulated intensity matrix
  const heatmapData = [
    [95, 92, 88, 94, 90, 82, 79],
    [98, 96, 94, 95, 91, 85, 80],
    [90, 89, 87, 91, 88, 76, 72],
    [96, 95, 92, 94, 92, 88, 84],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dedicated Cohort Analytics & Forecasting</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Aggregate compliance trend graphs, day-of-week missed dose heatmaps, and refill delay forecasting across all linked patient cohorts.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Average Adherence</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--secondary)', margin: '0.2rem 0' }}>91.4%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <TrendingUp size={14} /> +3.2% vs last month
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Refill Delay Risk</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--warning)', margin: '0.2rem 0' }}>14.2%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Predicted supply exhaustion &lt; 5 days</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Caregiver Escalations</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', margin: '0.2rem 0' }}>2 Active</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Outbox notifications dispatched</div>
        </div>
      </div>

      {/* Missed Dose Day-of-Week Heatmap */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--primary)" /> Day-of-Week Cohort Compliance Heatmap
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Visualizing dose adherence rates by day of week. Weekend days (Sat/Sun) display lower compliance rates requiring targeted reminder interventions.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: '0.5rem', minWidth: '600px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Week</div>
            {daysOfWeek.map((d) => (
              <div key={d} style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d}</div>
            ))}

            {heatmapData.map((row, weekIdx) => (
              <React.Fragment key={weekIdx}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Wk {weekIdx + 1}
                </div>
                {row.map((val, dayIdx) => {
                  const bg = val >= 90 ? 'rgba(16, 185, 129, 0.25)' : val >= 80 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)';
                  const color = val >= 90 ? '#065F46' : val >= 80 ? '#92400E' : '#991B1B';
                  return (
                    <div
                      key={dayIdx}
                      style={{
                        background: bg,
                        color,
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        padding: '1rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      {val}%
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Cohort Adherence Roster Breakdown Table */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Patient Cohort Roster Compliance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Patient</th>
                <th style={{ padding: '0.85rem 1rem' }}>Compliance Score</th>
                <th style={{ padding: '0.85rem 1rem' }}>Consecutive Missed</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {adherenceData.map((item) => (
                <tr key={item.patient.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{item.patient.name}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: item.complianceScore >= 85 ? 'var(--secondary)' : 'var(--warning)' }}>
                    {item.complianceScore}%
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{item.consecutiveMissed} doses</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${item.hasAttentionFlag ? 'badge-danger' : 'badge-success'}`}>
                      {item.hasAttentionFlag ? 'ATTENTION REQUIRED' : 'STABLE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorAnalyticsPage;

import React, { useState, useEffect } from 'react';
import { Pill, Mic, MicOff, AlertCircle, Calendar, Bot, Clock, CheckCircle2, XCircle, Plus, Send, Sparkles, Upload, Flame, ShieldAlert, Smartphone } from 'lucide-react';
import AdherenceProgressRing from './AdherenceProgressRing';
import AudioVisualizer from './AudioVisualizer';
import EmptyState from './EmptyState';

export const PatientPortal = ({ token, user }) => {
  const [medications, setMedications] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [refillForecast, setRefillForecast] = useState([]);
  const [complianceScore, setComplianceScore] = useState(100);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Dose Confirmation Flash Effect ID
  const [confirmedMedId, setConfirmedMedId] = useState(null);

  // Voice Logging State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // AI Chat Assistant Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: `Hello ${user?.name || 'Patient'}! I am HELIO, your AI Medication Intelligence Assistant. How can I support your schedule today?` }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Add Medication & Safety Checker State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: 'ONCE_DAILY', totalQuantity: 30, scheduleTimes: '08:00', instructions: '' });
  const [safetyCheckResult, setSafetyCheckResult] = useState(null);
  const [checkingSafety, setCheckingSafety] = useState(false);

  // OCR Document Scanner State
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const fetchPatientData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [medRes, statsRes, timelineRes, forecastRes] = await Promise.all([
        fetch('/api/v1/patient/medications', { headers }),
        fetch('/api/v1/patient/adherence/stats', { headers }),
        fetch('/api/v1/patient/timeline', { headers }),
        fetch('/api/v1/patient/refill-forecast', { headers }),
      ]);

      const medData = await medRes.json();
      const statsData = await statsRes.json();
      const timelineData = await timelineRes.json();
      const forecastData = await forecastRes.json();

      if (medData.success) setMedications(medData.data);
      if (statsData.success) {
        setComplianceScore(statsData.data.complianceScore);
        setCurrentStreak(statsData.data.currentStreak || 0);
      }
      if (timelineData.success) setTimeline(timelineData.data);
      if (forecastData.success) setRefillForecast(forecastData.data);
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [token]);

  // Dose Logging Handler with Green Glow Micro-Interaction
  const handleLogDose = async (medicationId, status, confirmationChannel = 'APP', notes = '') => {
    try {
      if (status === 'TAKEN') {
        setConfirmedMedId(medicationId);
        setTimeout(() => setConfirmedMedId(null), 1600);
      }

      const res = await fetch('/api/v1/patient/adherence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicationId,
          scheduledTime: new Date(),
          status,
          confirmationChannel,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchPatientData();
      }
    } catch (err) {
      console.error('Error logging dose:', err);
    }
  };

  // Web Speech API Voice Logging Handler
  const toggleVoiceLogging = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Web Speech API is not supported in this browser. Please use Chrome/Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening for voice command... (e.g. "I took Metformin")');
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      if (event.results[current].isFinal) {
        processVoiceCommand(text);
      }
    };

    recognition.onerror = (err) => {
      console.error('Speech recognition error:', err.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processVoiceCommand = (phrase) => {
    const text = phrase.toLowerCase();
    const matchedMed = medications.find(m => text.includes(m.name.toLowerCase()));

    if (matchedMed) {
      const isTaken = text.includes('took') || text.includes('taken') || text.includes('yes') || text.includes('have');
      const status = isTaken ? 'TAKEN' : 'SKIPPED';
      handleLogDose(matchedMed._id, status, 'VOICE', `Voice Logged: "${phrase}"`);
      setTranscript(`Auto-logged ${status} for ${matchedMed.name}`);
    } else if (medications.length > 0) {
      handleLogDose(medications[0]._id, 'TAKEN', 'VOICE', `Voice Logged: "${phrase}"`);
      setTranscript(`Auto-logged TAKEN for ${medications[0].name}`);
    } else {
      setTranscript(`Could not match medication in: "${phrase}"`);
    }
  };

  // Drug Interaction Pre-Check
  const handleCheckInteractions = async () => {
    if (!newMed.name) return;
    setCheckingSafety(true);
    setSafetyCheckResult(null);

    try {
      const res = await fetch('/api/v1/patient/check-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newMedication: newMed }),
      });

      const data = await res.json();
      if (data.success) {
        setSafetyCheckResult(data.data);
      }
    } catch (err) {
      console.error('Safety check failed:', err);
    } finally {
      setCheckingSafety(false);
    }
  };

  // Add Medication Submit
  const handleAddMedication = async (e, skipInteractionCheck = false) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/patient/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newMed,
          scheduleTimes: [newMed.scheduleTimes],
          totalQuantity: Number(newMed.totalQuantity),
          remainingQuantity: Number(newMed.totalQuantity),
          skipInteractionCheck,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewMed({ name: '', dosage: '', frequency: 'ONCE_DAILY', totalQuantity: 30, scheduleTimes: '08:00', instructions: '' });
        setSafetyCheckResult(null);
        fetchPatientData();
      } else if (data.safetyCheck) {
        setSafetyCheckResult(data.safetyCheck);
      }
    } catch (err) {
      console.error('Error adding medication:', err);
    }
  };

  // AI Chat Handler
  const handleSendAiQuery = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || aiLoading) return;

    const userText = inputQuery;
    setInputQuery('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setAiLoading(true);

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: userText,
          history: chatMessages.slice(-5),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: data.data.reply }]);
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Error connecting to Gemini AI assistant.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // OCR Document Upload Handler
  const handleOcrUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    setOcrLoading(true);
    setOcrResult(null);

    try {
      const res = await fetch('/api/v1/ai/analyze-document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setOcrResult(data.data);
      }
    } catch (err) {
      console.error('OCR analysis failed:', err);
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner, Animated Progress Ring & Streaks Counter */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)' }}>Welcome back, {user?.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Your 30-Day Medication Adherence Score and Clinical Streaks are strictly tracked by HELIO.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Animated Circular SVG Progress Ring */}
            <AdherenceProgressRing score={complianceScore} size={96} strokeWidth={8} />

            {/* Streak Counter Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', borderRadius: 'var(--radius-lg)', fontWeight: 800, boxShadow: 'var(--shadow-sm)' }}>
              <Flame size={28} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '1.35rem', lineHeight: 1 }}>{currentStreak} Days</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ADHERENCE STREAK</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={18} /> Add Medication
              </button>
              <button className="btn btn-outline" onClick={() => setIsOcrModalOpen(true)}>
                <Upload size={18} /> Scan Rx OCR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Logging Bar with Live Audio Visualizer */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderLeft: '5px solid var(--secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
            onClick={toggleVoiceLogging}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            {isListening ? 'Listening...' : 'Voice Dose Logger'}
          </button>
          <AudioVisualizer isActive={isListening} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {transcript || 'Click to speak e.g. "I took 500mg Metformin"'}
          </span>
        </div>

        <button className="btn btn-outline" onClick={() => setIsAiModalOpen(true)}>
          <Bot size={18} color="var(--primary)" /> Ask Gemini AI Assistant
        </button>
      </div>

      {/* Main Grid: Smart Medication Tracker & Refill Forecast */}
      <div className="grid-2">
        {/* Smart Medication Tracker */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Pill color="var(--primary)" size={22} /> Active Dose Schedules
            </h2>
            <span className="badge badge-primary">{medications.length} Active</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton skeleton-box" style={{ height: '70px' }} />
              <div className="skeleton skeleton-box" style={{ height: '70px' }} />
            </div>
          ) : medications.length === 0 ? (
            <EmptyState type="medications" onAction={() => setIsAddModalOpen(true)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {medications.map((med) => {
                const isConfirmed = confirmedMedId === med._id;
                return (
                  <div
                    key={med._id}
                    className={`card ${isConfirmed ? 'pulse-green-glow' : ''}`}
                    style={{ padding: '1.1rem', backgroundColor: isConfirmed ? 'var(--secondary-light)' : 'var(--bg-secondary)', marginBottom: 0 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{med.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          Dosage: <strong>{med.dosage}</strong> • Frequency: {med.frequency}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Scheduled Timings: {med.scheduleTimes?.join(', ') || '08:00'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleLogDose(med._id, 'TAKEN', 'APP')}
                          title="Mark Take Dose"
                        >
                          <CheckCircle2 size={16} /> Take
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleLogDose(med._id, 'SKIPPED', 'APP')}
                          title="Mark Skip Dose"
                        >
                          <XCircle size={16} /> Skip
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Refill Intelligence Widget */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Clock color="var(--secondary)" size={22} /> Refill Intelligence
            </h2>
            <span className="badge badge-warning">Supply Decay Engine</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton skeleton-box" style={{ height: '40px' }} />
              <div className="skeleton skeleton-box" style={{ height: '40px' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {refillForecast.map((item) => {
                const percentage = Math.min(100, Math.round((item.remainingQuantity / (item.remainingQuantity + 15)) * 100));
                return (
                  <div key={item.medicationId} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>{item.name} ({item.remainingQuantity} pills left)</span>
                      <span style={{ color: item.isUrgent ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {item.daysRemaining} days remaining
                      </span>
                    </div>

                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.isUrgent ? 'var(--danger)' : 'var(--secondary)',
                        }}
                      />
                    </div>

                    {item.isUrgent && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertCircle size={14} /> Low stock! Predicted refill date: {new Date(item.predictedRefillDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Health Timeline Feed */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Calendar color="var(--primary)" size={22} /> Clinical Health Timeline
          </h2>
        </div>

        {timeline.length === 0 ? (
          <EmptyState type="noMissed" />
        ) : (
          <div className="timeline">
            {timeline.map((event, idx) => (
              <div key={idx} className="timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{event.title}</div>
                  {event.channel && (
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                      <Smartphone size={12} /> {event.channel}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(event.timestamp).toLocaleString()}
                </div>
                {event.details && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {event.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Chat Modal */}
      {isAiModalOpen && (
        <div className="ai-modal-overlay">
          <div className="ai-chat-window">
            <div className="card-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: 0 }}>
              <div className="card-title" style={{ fontSize: '1rem' }}>
                <Bot color="var(--primary)" size={20} /> HELIO Gemini Medical Assistant
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setIsAiModalOpen(false)}>Close</button>
            </div>

            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-msg ${msg.sender === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
                  {msg.text}
                </div>
              ))}
              {aiLoading && <div className="chat-msg chat-msg-ai">Gemini is analyzing your query...</div>}
            </div>

            <form onSubmit={handleSendAiQuery} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Ask about side effects, schedules, or interactions..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={aiLoading}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {isAddModalOpen && (
        <div className="ai-modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <div className="card-header">
              <h3 className="card-title"><Plus size={20} /> Add Medication & Safety Check</h3>
              <button className="btn btn-outline btn-sm" onClick={() => { setIsAddModalOpen(false); setSafetyCheckResult(null); }}>Cancel</button>
            </div>

            <form onSubmit={(e) => handleAddMedication(e, false)}>
              <div className="form-group">
                <label className="form-label">Medication Name</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-control" required value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} placeholder="e.g. Warfarin" />
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleCheckInteractions} disabled={checkingSafety}>
                    {checkingSafety ? 'Checking...' : 'Check Safety'}
                  </button>
                </div>
              </div>

              {safetyCheckResult && (
                <div style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  backgroundColor: safetyCheckResult.hasInteraction ? 'var(--danger-light)' : 'var(--success-light)',
                  color: safetyCheckResult.hasInteraction ? 'var(--danger)' : 'var(--success)',
                  border: `1px solid ${safetyCheckResult.hasInteraction ? 'var(--danger)' : 'var(--success)'}`,
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <ShieldAlert size={16} /> Severity: {safetyCheckResult.severity}
                  </div>
                  <div style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                    {safetyCheckResult.warning}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Dosage</label>
                <input type="text" className="form-control" required value={newMed.dosage} onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })} placeholder="e.g. 5mg" />
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-control" value={newMed.frequency} onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}>
                  <option value="ONCE_DAILY">Once Daily</option>
                  <option value="TWICE_DAILY">Twice Daily</option>
                  <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                  <option value="AS_NEEDED">As Needed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Pills Supplied</label>
                <input type="number" className="form-control" value={newMed.totalQuantity} onChange={(e) => setNewMed({ ...newMed, totalQuantity: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Medication</button>
                {safetyCheckResult?.hasInteraction && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={(e) => handleAddMedication(e, true)}>
                    Bypass & Save
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR Dropper Modal with Scanning Laser Overlay */}
      {isOcrModalOpen && (
        <div className="ai-modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '540px' }}>
            <div className="card-header">
              <h3 className="card-title"><Sparkles color="var(--primary)" size={20} /> Gemini Vision OCR Dropper</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsOcrModalOpen(false)}>Close</button>
            </div>

            {/* Drag & Drop Visual Area with Laser Overlay */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handleOcrUpload(e.dataTransfer.files[0]);
              }}
              style={{
                position: 'relative',
                border: '2px dashed var(--primary-border)',
                borderRadius: 'var(--radius-md)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-tertiary)',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              {ocrLoading && <div className="laser-beam" />}
              <Upload size={36} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Drag & Drop Prescription Document or Click to Upload</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Supports PNG, JPG, JPEG, and PDF format</div>

              <input
                type="file"
                accept="image/*,.pdf"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                onChange={(e) => handleOcrUpload(e.target.files[0])}
              />
            </div>

            {ocrLoading && (
              <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 600 }}>
                Multimodal Gemini Vision sweep active...
              </div>
            )}

            {ocrResult && (
              <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} /> Extracted Prescription Data
                </h4>
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>Medication:</strong> {ocrResult.medicationName}</div>
                  <div><strong>Dosage:</strong> {ocrResult.dosage}</div>
                  <div><strong>Frequency:</strong> {ocrResult.frequency}</div>
                  <div><strong>Instructions:</strong> {ocrResult.instructions}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;

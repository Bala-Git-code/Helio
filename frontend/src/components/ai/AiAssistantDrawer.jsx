import React, { useState } from 'react';
import {
  AlertCircle,
  Bot,
  ChevronRight,
  CornerDownLeft,
  Send,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Gemini AI Health Assistant Drawer (Unified Cosmic Dark Theme)
 * ============================================================================
 */
export const AiAssistantDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello Elena, I'm Helio AI, your personal clinical medication assistant. How can I help clarify your routine, food interactions, or side effects today?",
      timestamp: 'Just now',
      triage: 'routine',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    'Can I take Metformin with food?',
    'Any interaction between Atorvastatin & Grapefruit?',
    'What should I do if I miss an evening Lisinopril dose?',
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Simulate intelligent clinical triage & response
    setTimeout(() => {
      let aiResponse = '';
      let triageLevel = 'routine';

      if (query.toLowerCase().includes('grapefruit') || query.toLowerCase().includes('atorvastatin')) {
        aiResponse =
          "⚠️ Moderate Safety Alert: Grapefruit contains furanocoumarins which inhibit CYP3A4 enzymes in the gut. This can substantially raise Atorvastatin blood concentrations, increasing the risk of muscle toxicity (myopathy). It is strongly advised to avoid whole grapefruit and grapefruit juice while on your 20mg Atorvastatin regimen.";
        triageLevel = 'warning';
      } else if (query.toLowerCase().includes('miss') || query.toLowerCase().includes('lisinopril')) {
        aiResponse =
          "If you miss a dose of Lisinopril 10mg, take it as soon as you remember that day. However, if it is almost time for your next scheduled dose, skip the missed dose and resume your regular schedule. Never take a double dose to compensate.";
        triageLevel = 'routine';
      } else {
        aiResponse =
          "Metformin 500mg ER should always be taken with or immediately following your largest meal (typically dinner) to optimize gastrointestinal tolerance and minimize nausea or cramping.";
        triageLevel = 'routine';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          triage: triageLevel,
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(4, 4, 10, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '460px',
          maxWidth: '90vw',
          height: '100%',
          backgroundColor: '#0D0E1A',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: theme.fonts.body,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, #0D0E1A 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
              }}
            >
              <img src="/helio-logo-symbol-white.png" alt="HELIO Logo" style={{ width: 22, height: 22, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontFamily: theme.fonts.heading, fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Helio Gemini Assistant
                </h3>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: theme.radii.pill,
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: '#C4B5FD',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                  }}
                >
                  Pro 2.5
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#A1A1C0', margin: 0 }}>
                Clinical Decision Support & Rx Intelligence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: '#A1A1C0',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: theme.radii.sm,
            }}
            aria-label="Close Assistant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            color: '#FBBF24',
          }}
        >
          <AlertCircle size={15} flexShrink={0} />
          <span>AI outputs are for clinical education. Always consult your prescriber for emergency medical decisions.</span>
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#08080F',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
              }}
            >
              {msg.sender === 'ai' && (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: theme.radii.pill,
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Bot size={16} />
                </div>
              )}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: theme.radii.lg,
                  fontSize: '0.84rem',
                  lineHeight: '1.48',
                  backgroundColor:
                    msg.sender === 'user'
                      ? '#6D28D9'
                      : msg.triage === 'warning'
                      ? 'rgba(244, 63, 94, 0.15)'
                      : 'rgba(255, 255, 255, 0.04)',
                  color:
                    msg.sender === 'user'
                      ? '#FFFFFF'
                      : msg.triage === 'warning'
                      ? '#FB7185'
                      : '#FFFFFF',
                  border:
                    msg.sender === 'user'
                      ? 'none'
                      : msg.triage === 'warning'
                      ? '1px solid rgba(244, 63, 94, 0.35)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div>{msg.text}</div>
                <div
                  style={{
                    fontSize: '0.66rem',
                    color: msg.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : '#64647A',
                    marginTop: '6px',
                    textAlign: 'right',
                  }}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#A1A1C0', fontSize: '0.78rem' }}>
              <Sparkles size={16} color="#8B5CF6" />
              <span>Helio AI analyzing pharmacological safety...</span>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#0D0E1A' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#A1A1C0', marginBottom: '8px' }}>
            Suggested Clinical Inquiries
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                style={{
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: theme.radii.sm,
                  padding: '7px 12px',
                  fontSize: '0.76rem',
                  color: '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                <span>{q}</span>
                <ChevronRight size={13} color="#A1A1C0" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div style={{ padding: '14px 20px 20px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#0D0E1A' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about drug safety, symptoms, or missed doses..."
              style={{
                width: '100%',
                padding: '11px 48px 11px 16px',
                borderRadius: theme.radii.pill,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                outline: 'none',
                fontFamily: theme.fonts.body,
              }}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              style={{
                position: 'absolute',
                right: '6px',
                width: '34px',
                height: '34px',
                borderRadius: theme.radii.pill,
                backgroundColor: inputQuery.trim() ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputQuery.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantDrawer;

import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, AlertCircle, ShieldAlert, Pill, ArrowUpRight } from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Patient AI Medication Chat Page (/patient/chat - Unified Dark Theme)
 * ============================================================================
 */
export function PatientChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello Elena, I'm Helio AI, your dedicated Medication Intelligence companion. I continuously cross-reference your active prescriptions (Metformin, Atorvastatin, Lisinopril) with real-time pharmacological databases. Ask me anything about food interactions, scheduling adjustments, or missed doses.",
      timestamp: '9:00 AM',
      triage: 'routine',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQueries = [
    'Can I drink grapefruit juice while taking Atorvastatin?',
    'What should I do if I missed my morning Metformin?',
    'Why do I feel slight dizziness after Lisinopril?',
    'Explain the half-life of my medications',
  ];

  const handleSend = (text) => {
    const query = text || inputQuery;
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

    setTimeout(() => {
      let aiText = "I've analyzed your question against your clinical profile. All current vitals and renal clearance markers are within nominal limits.";
      let triage = 'routine';

      if (query.toLowerCase().includes('grapefruit') || query.toLowerCase().includes('atorvastatin')) {
        aiText = "⚠️ Significant Interaction Intercepted: Grapefruit contains potent furanocoumarin compounds that irreversibly inhibit CYP3A4 enzymes in your intestinal wall. This halts the first-pass metabolism of Atorvastatin, resulting in up to a 200-300% surge in systemic plasma concentration. This exponentially elevates the clinical risk of rhabdomyolysis (severe muscle breakdown). Recommendation: Abstain completely from grapefruit and grapefruit juice.";
        triage = 'critical';
      } else if (query.toLowerCase().includes('missed') || query.toLowerCase().includes('metformin')) {
        aiText = "If you miss a dose of Metformin (500mg), take it as soon as you remember with a meal or light snack. However, if it is already close to your next scheduled evening dose, skip the missed dose and resume your regular regimen. Never double dose to compensate.";
        triage = 'advisory';
      } else if (query.toLowerCase().includes('dizziness') || query.toLowerCase().includes('lisinopril')) {
        aiText = "Mild orthostatic hypotension (transient dizziness upon standing) can occur during the first few weeks of Lisinopril therapy as your vascular resistance relaxes. Ensure you transition from sitting to standing gradually, maintain proper hydration, and log your blood pressure readings in the Adherence Journal.";
        triage = 'advisory';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          triage,
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: theme.fonts.body }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.2) 0%, rgba(13, 14, 26, 0.8) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '20px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.5)',
            }}
          >
            <Sparkles size={24} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: theme.fonts.heading }}>
              Helio Cognitive Pharmacotherapy Assistant
            </h2>
            <p style={{ color: '#A1A1C0', fontSize: '0.85rem', margin: '3px 0 0 0' }}>
              Connected to RxNorm, NIH Medline, and your active clinical record
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34D399', boxShadow: '0 0 8px #34D399' }} />
          <span>Active Neural Link</span>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
        {suggestedQueries.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              padding: '8px 16px',
              color: '#CBD5E1',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#CBD5E1';
            }}
          >
            <span>{q}</span>
            <ArrowUpRight size={13} color="#8B5CF6" />
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div
        style={{
          background: 'rgba(13, 14, 26, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '24px',
          minHeight: '440px',
          maxHeight: '560px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isAlert = msg.triage === 'critical';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '10px',
                    background: isAlert
                      ? 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)'
                      : 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isAlert ? '0 2px 8px rgba(225, 29, 72, 0.4)' : '0 2px 8px rgba(124, 58, 237, 0.4)',
                  }}
                >
                  {isAlert ? <AlertCircle size={18} color="#FFFFFF" /> : <Bot size={18} color="#FFFFFF" />}
                </div>
              )}

              <div>
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                      : isAlert
                      ? 'rgba(244, 63, 94, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isAlert ? '1px solid rgba(244, 63, 94, 0.35)' : (isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'),
                    color: isUser ? '#FFFFFF' : (isAlert ? '#FB7185' : '#F1F5F9'),
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    fontWeight: isUser ? 600 : 400,
                    boxShadow: isUser ? '0 2px 12px rgba(5, 150, 105, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64647A', display: 'block', marginTop: '4px', textAlign: isUser ? 'right' : 'left' }}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#34D399', fontSize: '0.85rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34D399', animation: 'pulse 1s infinite' }} />
            <span>Cross-checking pharmacological receptor data...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          gap: '12px',
          background: 'rgba(13, 14, 26, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '8px 12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        }}
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask Helio AI about dosage rules, side effects, or drug interactions..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: '0.92rem',
            padding: '8px 12px',
            fontFamily: theme.fonts.body,
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            boxShadow: '0 2px 10px rgba(124, 58, 237, 0.4)',
          }}
        >
          <span>Ask</span>
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

export default PatientChatPage;


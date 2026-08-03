import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bot, Send, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export const PatientAiAssistantPage = () => {
  const { token, user } = useOutletContext();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.name?.split(' ')[0] || 'there'}! I am HELIO, your AI Medication Intelligence Assistant. You can ask me questions about your current prescription schedule, potential drug interactions, side effects, or general wellness advice. How can I help you today?`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: userText,
          contextHistory: messages.slice(-4),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.data.reply }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.error || 'I am having trouble answering right now.' }]);
      }
    } catch (err) {
      console.error('Chat AI Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `[HELIO Simulation Response] Regarding "${userText}": Always consult your physician for direct dosage changes. If you experience emergency side effects, seek immediate medical attention.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Powered by Gemini 1.5 Flash
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Fullscreen Gemini Medical Assistant</h1>
        </div>

        <button onClick={() => setMessages([messages[0]])} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Clear Conversation
        </button>
      </div>

      {/* Main Chat Box Container */}
      <div
        className="card"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
        }}
      >

        {/* Chat Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                }}
              >

                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isUser ? 'var(--secondary)' : 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {isUser ? <User size={18} /> : <Bot size={18} />}
                </div>

                <div
                  style={{
                    background: isUser ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: isUser ? '#fff' : 'var(--text-primary)',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    borderBottomRightRadius: isUser ? 0 : 'var(--radius-md)',
                    borderBottomLeftRadius: isUser ? 'var(--radius-md)' : 0,
                    boxShadow: 'var(--shadow-sm)',
                    lineHeight: 1.5,
                    fontSize: '0.95rem',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} />
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--primary)' }}></div>
                Gemini Flash is analyzing your clinical query...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Form Footer */}
        <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Ask about side effects, food interactions, or dosing instructions..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            style={{ flex: 1, padding: '0.85rem 1.25rem', fontSize: '0.95rem' }}
          />

          <button type="submit" disabled={loading || !inputQuery.trim()} className="btn btn-primary" style={{ padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} /> Send
          </button>
        </form>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
        <AlertCircle size={14} /> HELIO AI Assistant provides informational guidance only. Always follow your licensed healthcare provider's instructions.
      </div>
    </div>
  );
};

export default PatientAiAssistantPage;

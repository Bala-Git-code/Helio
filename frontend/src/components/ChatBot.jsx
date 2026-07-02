import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, MessageCircle, Mic, MicOff } from 'lucide-react';
import { apiRequest } from '../utils/api';

const ChatBot = ({ onClose, user, medicines, appointments = [] }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: `Hello ${user.name.split(' ')[0]}! I'm your AI health assistant. I can help you with information about your medicines, appointments, health tips, and answer any health-related questions you might have. How can I help you today?`,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const historyLog = messages.map(msg => ({
        isBot: msg.isBot,
        text: msg.text
      }));

      const response = await apiRequest('/health/ai-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage.text,
          history: historyLog
        })
      });

      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: response.reply,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I am having trouble connecting to my healthcare records. ${err.message}`,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Voice recognition not supported in this browser');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.25rem] shadow-[var(--shadow-elevated)] border border-slate-200 w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-2xl shadow-md mr-4 text-white">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                AI Health Assistant
              </h2>
              <p className="text-slate-500 text-xs font-semibold">Protected Care Advisor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex items-start space-x-3 max-w-[85%] ${message.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  message.isBot 
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm' 
                    : 'bg-slate-700 text-white shadow-sm'
                }`}>
                  {message.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-3.5 text-xs sm:text-sm shadow-sm ${
                  message.isBot 
                    ? 'bg-slate-50 border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none' 
                    : 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-2xl rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{message.text}</p>
                  <p className={`text-[9px] mt-2 font-bold uppercase tracking-wider text-right ${
                    message.isBot ? 'text-slate-400' : 'text-emerald-100/90'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about medications, schedules, or health concerns..."
                rows={1}
                className="w-full px-4 py-3.5 pr-12 border border-slate-200 rounded-2xl bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50/80 outline-none transition-all duration-200 resize-none text-xs sm:text-sm text-slate-800"
              />
              <button
                onClick={handleVoiceInput}
                className={`absolute right-3.5 top-3.5 p-1 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
                title="Voice input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-3.5 rounded-2xl shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
          {isListening && (
            <p className="text-[10px] text-red-600 mt-2.5 flex items-center font-bold tracking-wide uppercase">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
              Voice Listening... Speak clearly
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, MessageCircle, Mic, MicOff } from 'lucide-react';

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

  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('medicine') || message.includes('medication')) {
      if (medicines.length > 0) {
        const medicineList = medicines.map(med => 
          `${med.name} (${med.dosage}) - ${med.times.join(', ')}`
        ).join('\n');
        return `Here are your current medicines:\n\n${medicineList}\n\nRemember to take them as prescribed. Is there anything specific you'd like to know about your medications?`;
      }
      return "You haven't added any medicines yet. Would you like me to help you set up your first medicine reminder?";
    }
    
    if (message.includes('appointment') || message.includes('doctor')) {
      if (appointments.length > 0) {
        const appointmentList = appointments.map(apt => 
          `${apt.doctorName} (${apt.specialty}) - ${new Date(apt.date).toLocaleDateString()} at ${apt.time}`
        ).join('\n');
        return `Here are your upcoming appointments:\n\n${appointmentList}\n\nWould you like me to help you prepare any questions for your doctor?`;
      }
      return "You don't have any appointments scheduled yet. Would you like me to help you book an appointment?";
    }
    
    if (message.includes('emergency') || message.includes('sos')) {
      if (user.emergencyContact?.name) {
        return `Your emergency contact is ${user.emergencyContact.name} (${user.emergencyContact.relationship}) at ${user.emergencyContact.phone}. In case of emergency, you can use the SOS button on your dashboard.`;
      }
      return "I do not see an emergency contact in your profile yet. You can still use the SOS button on your dashboard, and it is a good idea to add an emergency contact in your profile.";
    }
    
    if (message.includes('health tip') || message.includes('tip')) {
      const tips = [
        "Stay hydrated! Aim for 8 glasses of water daily.",
        "Regular exercise can improve your mood and energy levels.",
        "Try to get 7-9 hours of quality sleep each night.",
        "Eating colorful fruits and vegetables provides essential nutrients.",
        "Take breaks from screens to rest your eyes.",
        "Practice deep breathing exercises to manage stress."
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! How are you feeling today? Is there anything health-related I can help you with?";
    }
    
    // Default responses for health-related queries
    const healthResponses = [
      "I'm here to help with your health management. Could you be more specific about what you'd like to know?",
      "For specific medical advice, please consult with your healthcare provider. I can help with general health information and managing your medicine reminders.",
      "That's an interesting question! While I can provide general health information, it's always best to discuss specific concerns with your doctor.",
      "I can help you with medicine reminders, health tips, and general wellness information. What would you like to know more about?"
    ];
    
    return healthResponses[Math.floor(Math.random() * healthResponses.length)];
  };

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

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputText),
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl shadow-lg mr-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                AI Health Assistant
              </h2>
              <p className="text-gray-600 text-sm">Your personal health companion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex items-start space-x-3 max-w-[80%] ${message.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.isBot 
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white' 
                    : 'bg-gray-600 text-white'
                }`}>
                  {message.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.isBot 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                }`}>
                  <p className="whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.isBot ? 'text-gray-500' : 'text-emerald-100'
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about your medicines, health tips, or any health questions..."
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none"
              />
              <button
                onClick={handleVoiceInput}
                className={`absolute right-3 top-3 p-1 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {isListening && (
            <p className="text-sm text-red-600 mt-2 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              Listening... Speak your question
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

import React, { useState } from 'react';
import { 
  Sparkles, AlertTriangle, CheckCircle, MessageSquare, ArrowRight, 
  Send, ListFilter, ShieldAlert, Cpu, ClipboardCheck, Info
} from 'lucide-react';
import { Card, Button, Field } from '../design-system';

export default function AIConsultantPanel({
  patients = [],
  selectedPatientId
}) {
  const [activePatientId, setActivePatientId] = useState(selectedPatientId || 'p1');
  const [drugA, setDrugA] = useState('Warfarin');
  const [drugB, setDrugB] = useState('Aspirin');
  const [interactionResult, setInteractionResult] = useState(null);
  
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState([
    {
      role: 'assistant',
      content: 'Welcome to HELIO Clinical Copilot. Select a patient or ask a clinical question regarding drug interaction, adherence telemetry, or note drafts.'
    }
  ]);

  // Drug lists
  const drugOptions = ['Warfarin', 'Aspirin', 'Metformin', 'Lisinopril', 'Spironolactone', 'Ibuprofen', 'Metoprolol'];

  const checkInteractions = () => {
    if (drugA === drugB) {
      setInteractionResult({
        status: 'safe',
        message: 'No interactions. Selected medications are identical.'
      });
      return;
    }

    const key = [drugA, drugB].sort().join(' + ');

    switch (key) {
      case 'Aspirin + Warfarin':
        setInteractionResult({
          status: 'danger',
          message: 'CRITICAL ALERT: Concomitant use increases bleeding risk. Aspirin inhibits platelet aggregation, compounding Warfarins anticoagulant effect. Monitor INR closely or suggest alternative antiplatelet therapy.'
        });
        break;
      case 'Lisinopril + Spironolactone':
        setInteractionResult({
          status: 'warning',
          message: 'WARNING: Potential hyperkalemia. Both agents decrease potassium excretion. Close monitoring of serum potassium and renal functions is strongly recommended.'
        });
        break;
      case 'Ibuprofen + Warfarin':
        setInteractionResult({
          status: 'danger',
          message: 'CRITICAL ALERT: Major risk of gastrointestinal hemorrhage. NSAIDs can cause mucosal injury and increase bleeding hazard in anticoagulated patients. Use Acetaminophen for pain control if acceptable.'
        });
        break;
      default:
        setInteractionResult({
          status: 'safe',
          message: 'No severe interaction registered in clinical libraries between these substances. Continue monitoring standard patient response.'
        });
    }
  };

  const handleSendChat = (text) => {
    const prompt = text || chatInput;
    if (!prompt.trim()) return;

    const userMsg = { role: 'user', content: prompt };
    setChatLog(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Simulate AI clinical completion
    setTimeout(() => {
      let aiResponse = "";
      if (prompt.toLowerCase().includes('adherence')) {
        aiResponse = "Patient Arthur Pendragons adherence with Metformin is currently at 72%. He missed three consecutive morning doses this week. Recommended adjustment: transition to Metformin XR (Extended Release) 500mg taken once daily with the evening meal to reduce morning gastrointestinal issues and improve clinical adherence.";
      } else if (prompt.toLowerCase().includes('lab') || prompt.toLowerCase().includes('summary')) {
        aiResponse = "Clinical Abstract for Arthur Pendragon (42y):\n• Active Diagnoses: Hypertension (stage 1), Diabetes Mellitus (type 2).\n• Latest Vitals: BP 142/88 mmHg, HR 74 bpm, Weight 88 kg.\n• Medication Adherence: Metformin (72%), Lisinopril (94%).\n• Clinical Recommendation: Order a fresh HbA1c panel and basic metabolic panel (BMP) prior to his follow-up next month.";
      } else if (prompt.toLowerCase().includes('interaction')) {
        aiResponse = "I can analyze drug interactions. Select specific substances on the Drug-Drug Interaction panel on the left to verify caution warnings from the clinical library.";
      } else {
        aiResponse = `Copilot response concerning: "${prompt}". Please verify the clinical diagnosis parameters against standard hospital guidelines. This summary is intended to augment, not replace, primary clinical judgement.`;
      }

      setChatLog(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsTyping(false);
    }, 700);
  };

  const quickPrompts = [
    { label: 'Lab Summary (Arthur)', prompt: 'Generate clinical lab summary for Arthur Pendragon' },
    { label: 'Check Metformin Adherence', prompt: 'Summarize drug adherence telemetry for Arthur' },
    { label: 'Draft Discharge Plan', prompt: 'Draft follow-up discharge advice note for diabetic patient' }
  ];

  return (
    <div className="space-y-6 animate-rise-in">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-violet-700 animate-pulse" />
          AI Clinical Copilot Workspace
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Augment clinical workflows, audit drug-drug interactions, and write note summaries instantly.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        
        {/* LEFT COLUMN: DRUG INTERACTION AUDITOR */}
        <div className="space-y-6">
          <Card className="p-5 border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-600" />
              Drug-Drug Interaction Auditor
            </h2>

            <div className="space-y-4">
              <Field label="Active Substance A">
                <select 
                  value={drugA} 
                  onChange={(e) => setDrugA(e.target.value)}
                  className="input-field py-2.5 text-xs bg-white"
                >
                  {drugOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <Field label="Active Substance B">
                <select 
                  value={drugB} 
                  onChange={(e) => setDrugB(e.target.value)}
                  className="input-field py-2.5 text-xs bg-white"
                >
                  {drugOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <Button 
                variant="primary" 
                size="sm" 
                onClick={checkInteractions}
                className="w-full text-xs py-2 min-h-10"
              >
                Audit Clinical Interactions
              </Button>
            </div>

            {/* INTERACTION RESULTS */}
            {interactionResult && (
              <div className={`mt-5 p-4 rounded-2xl border text-xs leading-relaxed ${
                interactionResult.status === 'danger'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : interactionResult.status === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2 mb-1.5 font-bold uppercase text-[10px] tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  Interaction Assessment: {interactionResult.status.toUpperCase()}
                </div>
                {interactionResult.message}
              </div>
            )}
          </Card>

          {/* QUICK PROMPTS TEMPLATE LIST */}
          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Quick Consultation Prompts</h3>
            <div className="space-y-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(qp.prompt)}
                  className="w-full text-left p-3 text-xs rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/20 text-slate-700 transition-colors flex items-center justify-between focus:ring-2 focus:ring-violet-400 focus:outline-none"
                >
                  <span className="font-semibold">{qp.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: AI CONVERSATION CHANNEL */}
        <Card className="p-5 flex flex-col h-[520px] justify-between border-slate-200">
          
          {/* Top Panel bar */}
          <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-violet-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">Copilot Assistant</span>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5">Clinical Decision Support AI</span>
              </div>
            </div>
            <span className="bg-violet-50 text-violet-800 text-[10px] font-bold px-2 py-0.5 rounded border border-violet-100">Active</span>
          </div>

          {/* Chat dialog logs */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 scroll-smooth">
            {chatLog.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${
                  chat.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  chat.role === 'user'
                    ? 'bg-violet-700 text-white font-semibold rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
                }`}>
                  {chat.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                  <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Copilot is researching...</span>
              </div>
            )}
          </div>

          {/* Chat Send console bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} 
            className="flex gap-2 border-t border-slate-100 pt-3 mt-3"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Copilot: 'Order HbA1c review' or drug inquiries..."
              className="input-field py-2 text-xs flex-1 min-h-10"
              aria-label="Ask clinical assistant"
            />
            <Button 
              type="submit" 
              variant="primary" 
              className="min-h-10 px-3 w-10 grid place-items-center"
              aria-label="Send clinical inquiry"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
        </Card>
      </div>

    </div>
  );
}

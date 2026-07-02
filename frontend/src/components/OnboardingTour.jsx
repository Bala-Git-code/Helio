import React, { useState } from 'react';
import { X, ArrowRight, Pill, MessageCircle, FileText, ShieldAlert, Sparkles, HeartPulse } from 'lucide-react';
import { Card, Button } from './design-system';

const tourSlides = [
  {
    icon: Sparkles,
    title: "Welcome to Helio Portal",
    description: "Your luxury digital care concierge. We coordinate medication schedules, record historic vitals, and link clinical data in one protected dashboard.",
    color: "from-emerald-600 to-teal-600 text-white"
  },
  {
    icon: Pill,
    title: "Prescription OCR Scanners",
    description: "Scan your pharmacy receipt or prescription document to automatically populate medicine reminder timings and active ingredient logs.",
    color: "from-teal-600 to-cyan-600 text-white"
  },
  {
    icon: MessageCircle,
    title: "Protected AI Chat Companion",
    description: "Powered by Gemini, your health companion answers treatment inquiries, explains follow-up directives, and helps summarize care guidelines.",
    color: "from-indigo-600 to-purple-600 text-white"
  },
  {
    icon: ShieldAlert,
    title: "One-Tap Smart SOS Alerts",
    description: "Trigger emergency alerts from anywhere. Helio fetches your coordinates and notifies support circles with critical clinical snapshots.",
    color: "from-red-600 to-orange-600 text-white"
  }
];

const OnboardingTour = ({ onClose }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const handleNext = () => {
    if (activeSlide < tourSlides.length - 1) {
      setActiveSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const SlideIcon = tourSlides[activeSlide].icon;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full overflow-hidden border-slate-200 shadow-[var(--shadow-elevated)] bg-white/95 animate-rise-in">
        
        {/* Visual Hero Header */}
        <div className={`p-8 bg-gradient-to-br ${tourSlides[activeSlide].color} flex flex-col items-center justify-center text-center relative`}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
            title="Dismiss Tour"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="p-4 bg-white/15 rounded-2xl backdrop-blur-md mb-4 shadow-sm">
            <SlideIcon className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">{tourSlides[activeSlide].title}</h3>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-center min-h-[72px]">
            {tourSlides[activeSlide].description}
          </p>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2">
            {tourSlides.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx ? 'w-5 bg-emerald-700' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button 
              onClick={onClose}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex-1"
            >
              Skip Guide
            </button>
            <button 
              onClick={handleNext}
              className="btn-primary py-2.5 px-5 text-xs font-bold flex-1 flex items-center justify-center gap-1"
            >
              {activeSlide === tourSlides.length - 1 ? 'Get Started' : 'Next Guide'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </Card>
    </div>
  );
};

export default OnboardingTour;

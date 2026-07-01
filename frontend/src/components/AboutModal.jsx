import React from 'react';
import { X, Heart, Shield, Stethoscope, Pill, Calendar, MessageCircle, Users } from 'lucide-react';

const AboutModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-card-strong max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-2xl shadow-lg mr-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                About Helio
              </h2>
              <p className="text-gray-600">Your Personal Smart Health Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          <div className="space-y-8">
            {/* Mission Statement */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Empowering Your Health Journey
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Helio is a comprehensive digital healthcare companion designed to help patients manage their health routines more effectively. 
                We combine smart reminders, AI support, emergency safety features, and intuitive voice input into one seamless system.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
                <div className="bg-emerald-600 p-3 rounded-xl w-fit mb-4">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Medicine Reminders</h4>
                <p className="text-gray-600">
                  Set smart reminders for your medications with voice input. Never miss a dose with our intelligent scheduling system.
                </p>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200">
                <div className="bg-teal-600 p-3 rounded-xl w-fit mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Appointment Management</h4>
                <p className="text-gray-600">
                  Book and manage doctor appointments with detailed information including specialty, location, and contact details.
                </p>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200">
                <div className="bg-cyan-600 p-3 rounded-xl w-fit mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">AI Health Assistant</h4>
                <p className="text-gray-600">
                  Get personalized health advice and answers to your questions with our intelligent chatbot powered by advanced AI.
                </p>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                <div className="bg-red-600 p-3 rounded-xl w-fit mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Emergency SOS</h4>
                <p className="text-gray-600">
                  One-click emergency alerts with location sharing to your emergency contacts for immediate assistance.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                <div className="bg-purple-600 p-3 rounded-xl w-fit mb-4">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Healthcare Focused</h4>
                <p className="text-gray-600">
                  Designed specifically for healthcare management with medical-grade security and privacy protection.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="bg-green-600 p-3 rounded-xl w-fit mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Family Care</h4>
                <p className="text-gray-600">
                  Manage emergency contacts and keep your loved ones informed about your health status and appointments.
                </p>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 text-center">Why Choose Helio?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Secure & Private</h4>
                    <p className="text-emerald-100 text-sm">Your health data is encrypted and protected with medical-grade security.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Voice Enabled</h4>
                    <p className="text-emerald-100 text-sm">Use natural speech to set reminders and interact with your health assistant.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Always Available</h4>
                    <p className="text-emerald-100 text-sm">24/7 access to your health information and emergency support.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Doctor Approved</h4>
                    <p className="text-emerald-100 text-sm">Built with healthcare professionals to ensure medical accuracy.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="text-center bg-gray-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Get in Touch</h3>
              <p className="text-gray-600 mb-4">
                Have questions or need support? We're here to help you on your health journey.
              </p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Made with care for your health</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-primary w-full py-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
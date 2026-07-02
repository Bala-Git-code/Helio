import React, { useState } from 'react';
import { X, Calendar, User, MapPin, Phone, Stethoscope, Clock, FileText } from 'lucide-react';
import { Button, Card, Field } from './design-system';

const AppointmentBooking = ({ onClose, onAddAppointment }) => {
  const [formData, setFormData] = useState({
    doctorName: '',
    specialty: '',
    date: '',
    time: '',
    clinicAddress: '',
    doctorPhone: '',
    notes: ''
  });

  const specialties = [
    'General Physician',
    'Cardiologist',
    'Dermatologist',
    'Neurologist',
    'Orthopedic',
    'Pediatrician',
    'Psychiatrist',
    'Gynecologist',
    'Dentist',
    'Ophthalmologist',
    'ENT Specialist',
    'Endocrinologist'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const appointment = {
      id: Date.now().toString(),
      doctorName: formData.doctorName,
      specialty: formData.specialty,
      date: formData.date,
      time: formData.time,
      clinicAddress: formData.clinicAddress,
      doctorPhone: formData.doctorPhone,
      notes: formData.notes
    };
    
    onAddAppointment(appointment);
    onClose();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-card-strong p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl shadow-lg mr-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Book Appointment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Doctor Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center uppercase tracking-wide border-b border-slate-100 pb-2">
              <Stethoscope className="w-4 h-4 mr-2 text-emerald-700" />
              Doctor Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Doctor Name">
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleInputChange}
                    className="input-field pl-10 text-sm"
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>
              </Field>

              <Field label="Specialty">
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  className="input-field text-sm bg-white"
                  required
                >
                  <option value="">Select Specialty</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Doctor's Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="doctorPhone"
                  value={formData.doctorPhone}
                  onChange={handleInputChange}
                  className="input-field pl-10 text-sm"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </Field>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center uppercase tracking-wide border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 mr-2 text-teal-600" />
              Appointment Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field text-sm"
                  required
                />
              </Field>

              <Field label="Time">
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="input-field pl-10 text-sm"
                    required
                  />
                </div>
              </Field>
            </div>

            <Field label="Clinic/Hospital Address">
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="clinicAddress"
                  value={formData.clinicAddress}
                  onChange={handleInputChange}
                  className="input-field pl-10 text-sm"
                  placeholder="123 Medical Center Dr, City, State"
                  required
                />
              </div>
            </Field>

            <Field label="Notes (Optional)">
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field pl-10 text-sm resize-none"
                  placeholder="Any symptoms to discuss..."
                />
              </div>
            </Field>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 px-6 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 px-6 py-3"
            >
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentBooking;
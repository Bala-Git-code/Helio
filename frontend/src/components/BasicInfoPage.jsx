import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, ArrowLeft, Calendar, MapPin, Phone, Plus, Trash2, User, Users, ShieldCheck, Heart, Settings } from 'lucide-react';
import { Button, Card, Field, IconButton, SectionHeader } from './design-system';

const BasicInfoPage = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    bloodType: 'O+',
    emergencyContact: { name: '', relationship: 'spouse', phone: '' },
    allergies: [''],
    conditions: [''],
    preferences: {
      language: 'en',
      reminders: 'push', // push, sms, email
      highContrast: false,
    },
    consentChecked: false
  });

  const nextStep = () => {
    // Basic validation before stepping forward
    if (step === 1) {
      if (!formData.name || !formData.age || !formData.gender || !formData.phone || !formData.address) {
        alert('Please fill out all personal details.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.emergencyContact.name || !formData.emergencyContact.phone) {
        alert('Please log an emergency contact name and phone.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.consentChecked) {
      alert('You must check the HIPAA authorization consent to initialize your dashboard.');
      return;
    }
    onComplete({
      name: formData.name,
      age: parseInt(formData.age, 10),
      gender: formData.gender,
      phone: formData.phone,
      address: formData.address,
      bloodType: formData.bloodType,
      emergencyContact: formData.emergencyContact,
      allergies: formData.allergies.filter((allergy) => allergy.trim() !== ''),
      conditions: formData.conditions.filter((cond) => cond.trim() !== ''),
      preferences: formData.preferences,
      healthScore: 84
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, [field]: value } });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        [name]: type === 'checkbox' ? checked : value
      }
    });
  };

  // Allergies handlers
  const addAllergy = () => setFormData({ ...formData, allergies: [...formData.allergies, ''] });
  const updateAllergy = (index, value) => {
    const nextAllergies = [...formData.allergies];
    nextAllergies[index] = value;
    setFormData({ ...formData, allergies: nextAllergies });
  };
  const removeAllergy = (index) => setFormData({ ...formData, allergies: formData.allergies.filter((_, i) => i !== index) });

  // Conditions handlers
  const addCondition = () => setFormData({ ...formData, conditions: [...formData.conditions, ''] });
  const updateCondition = (index, value) => {
    const nextConditions = [...formData.conditions];
    nextConditions[index] = value;
    setFormData({ ...formData, conditions: nextConditions });
  };
  const removeCondition = (index) => setFormData({ ...formData, conditions: formData.conditions.filter((_, i) => i !== index) });

  return (
    <main className="page-shell px-4 py-8 relative">
      <div className="content-shell max-w-3xl">
        
        {/* Onboarding step headers */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            <span>Onboarding Progress</span>
            <span className="text-emerald-800">Step {step} of 4</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        <SectionHeader
          eyebrow="Guided Setup File"
          title="Configure your protected care profile."
          description="Let Helio tailor notification reminders, AI contexts, emergency dispatches, and clinical charts for you."
        />

        <Card className="mt-8 p-6 sm:p-8 border-slate-200 shadow-[var(--shadow-luxury)] bg-white/90 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: PERSONAL DETAILS */}
            {step === 1 && (
              <div className="space-y-6 animate-rise-in">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Personal details</h3>
                    <p className="text-xs text-slate-500">Used for your medical charts and dashboard greeting.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full Name">
                    <input className="input-field text-sm" type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Avery Morgan" required />
                  </Field>
                  <Field label="Age">
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input className="input-field pl-10 text-sm" type="number" min="0" name="age" value={formData.age} onChange={handleInputChange} placeholder="34" required />
                    </div>
                  </Field>
                  <Field label="Gender">
                    <select className="input-field text-sm bg-white" name="gender" value={formData.gender} onChange={handleInputChange} required>
                      <option value="">Select Gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Phone Number">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input className="input-field pl-10 text-sm" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 123-4567" required />
                    </div>
                  </Field>
                </div>
                <Field label="Address">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input className="input-field pl-10 text-sm" type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Main St, City, State" required />
                  </div>
                </Field>
              </div>
            )}

            {/* STEP 2: CLINICAL PROFILE */}
            {step === 2 && (
              <div className="space-y-6 animate-rise-in">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-700">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Clinical Indicators</h3>
                    <p className="text-xs text-slate-500">Flags critical allergy notices and conditions for doctors.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Blood Type">
                    <select className="input-field text-sm bg-white" name="bloodType" value={formData.bloodType} onChange={handleInputChange}>
                      <option value="O+">O Rh Positive (O+)</option>
                      <option value="O-">O Rh Negative (O-)</option>
                      <option value="A+">A Rh Positive (A+)</option>
                      <option value="A-">A Rh Negative (A-)</option>
                      <option value="B+">B Rh Positive (B+)</option>
                      <option value="B-">B Rh Negative (B-)</option>
                      <option value="AB+">AB Rh Positive (AB+)</option>
                      <option value="AB-">AB Rh Negative (AB-)</option>
                    </select>
                  </Field>
                </div>

                {/* Emergency Contact */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Emergency Contact Link</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Contact name">
                      <input className="input-field text-sm" type="text" name="emergency.name" value={formData.emergencyContact.name} onChange={handleInputChange} placeholder="Jordan Morgan" required />
                    </Field>
                    <Field label="Relationship">
                      <select className="input-field text-sm bg-white" name="emergency.relationship" value={formData.emergencyContact.relationship} onChange={handleInputChange} required>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="child">Child</option>
                        <option value="sibling">Sibling</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Phone number">
                      <input className="input-field text-sm" type="tel" name="emergency.phone" value={formData.emergencyContact.phone} onChange={handleInputChange} placeholder="+1 (555) 987-6543" required />
                    </Field>
                  </div>
                </div>

                {/* Known Allergies */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Known Allergies</h4>
                    <Button type="button" variant="secondary" size="sm" onClick={addAllergy} className="text-xs py-1 px-2.5">
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.allergies.map((allergy, index) => (
                      <div key={index} className="flex gap-2">
                        <input className="input-field text-sm" type="text" value={allergy} onChange={(e) => updateAllergy(index, e.target.value)} placeholder="Penicillin, Peanuts, Latex..." />
                        {formData.allergies.length > 1 && (
                          <IconButton label="Remove allergy" type="button" onClick={() => removeAllergy(index)} className="rounded-xl border-0 hover:bg-red-50 h-10 w-10">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </IconButton>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medical Conditions */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Medical Conditions</h4>
                    <Button type="button" variant="secondary" size="sm" onClick={addCondition} className="text-xs py-1 px-2.5">
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.conditions.map((condition, index) => (
                      <div key={index} className="flex gap-2">
                        <input className="input-field text-sm" type="text" value={condition} onChange={(e) => updateCondition(index, e.target.value)} placeholder="Asthma, Hypertension..." />
                        {formData.conditions.length > 1 && (
                          <IconButton label="Remove condition" type="button" onClick={() => removeCondition(index)} className="rounded-xl border-0 hover:bg-red-50 h-10 w-10">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </IconButton>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* STEP 3: PREFERENCES & ACCESS */}
            {step === 3 && (
              <div className="space-y-6 animate-rise-in">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">System Preferences</h3>
                    <p className="text-xs text-slate-500">Tailor language and accessibility settings.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="System Language">
                    <select className="input-field text-sm bg-white" name="language" value={formData.preferences.language} onChange={handlePreferencesChange}>
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </Field>

                  <Field label="Notification Reminders">
                    <select className="input-field text-sm bg-white" name="reminders" value={formData.preferences.reminders} onChange={handlePreferencesChange}>
                      <option value="push">In-App Push Alerts</option>
                      <option value="sms">Simulated SMS Notifications</option>
                      <option value="email">Email Digests</option>
                    </select>
                  </Field>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Accessibility Options</h4>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="highContrast"
                      checked={formData.preferences.highContrast}
                      onChange={handlePreferencesChange}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs font-semibold text-slate-700">
                      Enable high-contrast layout filters
                    </div>
                  </label>
                </div>

              </div>
            )}

            {/* STEP 4: HIPAA CONSENT & VERIFICATION */}
            {step === 4 && (
              <div className="space-y-6 animate-rise-in">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">HIPAA Consent & Review</h3>
                    <p className="text-xs text-slate-500">Review details before configuring your health dashboard.</p>
                  </div>
                </div>

                {/* Consent review details */}
                <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-5 text-xs space-y-3 leading-relaxed text-slate-600">
                  <p className="font-bold text-slate-800">Verification Summary Checklist:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Full Name: <strong className="text-slate-900">{formData.name}</strong></li>
                    <li>Clinical Phone: <strong className="text-slate-900">{formData.phone}</strong></li>
                    <li>Blood Indicator: <strong className="text-slate-900">{formData.bloodType}</strong></li>
                    <li>Emergency Contact Name: <strong className="text-slate-900">{formData.emergencyContact.name}</strong></li>
                  </ul>
                  <p className="border-t border-slate-200 pt-3">
                    Helio encrypts user profile charts locally. By checking the authorization below, you verify that these details are correct and consent to log medication history under audit safeguards.
                  </p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl">
                  <input 
                    type="checkbox" 
                    checked={formData.consentChecked}
                    onChange={(e) => setFormData({ ...formData, consentChecked: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    required
                  />
                  <div className="text-xs font-bold text-emerald-900">
                    I authorize Helio to manage my encrypted health profile.
                  </div>
                </label>

              </div>
            )}

            {/* NAV ACTIONS */}
            <div className="flex space-x-4 pt-6 border-t border-slate-100">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary py-3 px-6 text-sm flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary py-3 px-6 text-sm flex-1 flex items-center justify-center gap-1.5 ml-auto"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary py-3 px-6 text-sm flex-1 flex items-center justify-center gap-1.5"
                >
                  Initialize Dashboard
                  <ShieldCheck className="h-4 w-4" />
                </button>
              )}
            </div>

          </form>
        </Card>
      </div>
    </main>
  );
};

export default BasicInfoPage;

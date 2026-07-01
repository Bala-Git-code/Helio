import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Calendar, MapPin, Phone, Plus, Trash2, User, Users } from 'lucide-react';
import { Button, Card, Field, IconButton, SectionHeader } from './design-system';

const BasicInfoPage = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
    allergies: [''],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      name: formData.name,
      age: parseInt(formData.age, 10),
      gender: formData.gender,
      phone: formData.phone,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      allergies: formData.allergies.filter((allergy) => allergy.trim() !== ''),
    });
  };

  const addAllergy = () => setFormData({ ...formData, allergies: [...formData.allergies, ''] });
  const updateAllergy = (index, value) => {
    const nextAllergies = [...formData.allergies];
    nextAllergies[index] = value;
    setFormData({ ...formData, allergies: nextAllergies });
  };
  const removeAllergy = (index) => setFormData({ ...formData, allergies: formData.allergies.filter((_, i) => i !== index) });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, [field]: value } });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  return (
    <main className="page-shell px-4 py-8">
      <div className="content-shell max-w-4xl">
        <SectionHeader
          eyebrow="Care profile"
          title="Tell Helio what matters in an emergency and day to day."
          description="This profile personalizes reminders, care-team context, allergy warnings, and emergency access."
        />

        <Card className="mt-8 p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Personal details</h2>
                  <p className="text-sm text-slate-500">Used for your dashboard greeting and care profile.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name">
                  <input className="input-field" type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Avery Morgan" required />
                </Field>
                <Field label="Age">
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input className="input-field pl-10" type="number" min="0" name="age" value={formData.age} onChange={handleInputChange} placeholder="34" required />
                  </div>
                </Field>
                <Field label="Gender">
                  <select className="input-field" name="gender" value={formData.gender} onChange={handleInputChange} required>
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Phone number">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input className="input-field pl-10" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 123-4567" required />
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Address">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input className="input-field pl-10" type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Main St, City, State" required />
                  </div>
                </Field>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Emergency contact</h2>
                  <p className="text-sm text-slate-500">Visible in urgent workflows and AI guidance.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Contact name">
                  <input className="input-field" type="text" name="emergency.name" value={formData.emergencyContact.name} onChange={handleInputChange} placeholder="Jordan Morgan" required />
                </Field>
                <Field label="Relationship">
                  <select className="input-field" name="emergency.relationship" value={formData.emergencyContact.relationship} onChange={handleInputChange} required>
                    <option value="">Select</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Phone number">
                  <input className="input-field" type="tel" name="emergency.phone" value={formData.emergencyContact.phone} onChange={handleInputChange} placeholder="+1 (555) 987-6543" required />
                </Field>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Known allergies</h2>
                    <p className="text-sm text-slate-500">Add anything Helio should flag before reminders.</p>
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addAllergy}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {formData.allergies.map((allergy, index) => (
                  <div key={index} className="flex gap-3">
                    <input className="input-field" type="text" value={allergy} onChange={(e) => updateAllergy(index, e.target.value)} placeholder="Penicillin, peanuts, latex..." />
                    {formData.allergies.length > 1 && (
                      <IconButton label="Remove allergy" type="button" onClick={() => removeAllergy(index)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <Button type="submit" size="lg" className="w-full">
              Continue to dashboard
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
};

export default BasicInfoPage;

import React, { useState } from 'react';
import { LogOut, UserPlus, Shield, Stethoscope, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BrandMark, Button, Card, Field } from './design-system';
import { apiRequest } from '../utils/api';

const AdminDashboard = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialty: '',
    department: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const specialties = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 
    'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Gynecologist', 
    'Dentist', 'Ophthalmologist', 'ENT Specialist', 'Endocrinologist'
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await apiRequest('/auth/register-doctor', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setSuccess(`Doctor account for Dr. ${formData.name} was successfully created.`);
      setFormData({
        name: '',
        email: '',
        password: '',
        specialty: '',
        department: '',
        licenseNumber: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to create doctor account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell min-h-screen">
      <header className="nav-glass">
        <div className="content-shell flex items-center justify-between gap-4 py-4">
          <BrandMark label="Helio Admin" subtitle="Workspace access controller" tone="emergency" />
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">Administrator</p>
            </span>
            <Button variant="secondary" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="content-shell py-8 max-w-4xl">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-red-600 border border-rose-100">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="section-kicker mb-3">Admin portal</p>
              <h1 className="text-3xl font-semibold text-slate-950">Manage clinician accounts</h1>
              <p className="mt-2 text-slate-600">Register new doctors and provision clinical permissions to link patient records.</p>
            </div>
          </div>
        </Card>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_340px]">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-950 mb-5 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Register Doctor
            </h2>

            {success && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Doctor full name">
                  <input
                    className="input-field"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Smith"
                    required
                  />
                </Field>
                <Field label="Medical license number">
                  <input
                    className="input-field"
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. LIC-90281"
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Specialty">
                  <select
                    className="input-field"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
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
                <Field label="Department">
                  <input
                    className="input-field"
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g. Cardiology"
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email address">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      className="input-field pl-10"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="doctor@helio.com"
                      required
                    />
                  </div>
                </Field>
                <Field label="Temporary password">
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      className="input-field pl-10"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </Field>
              </div>

              <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
                {loading ? 'Provisioning...' : 'Provision Doctor Account'}
              </Button>
            </form>
          </Card>

          <aside className="space-y-6">
            <Card className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
              <ShieldCheck className="h-8 w-8 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-slate-900">Access security</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Newly provisioned doctors can immediately access the Helio Doctor portal. Patients can link their dashboards to these clinicians using the secure H-XXXXXX access code.
              </p>
            </Card>
            
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Quick support
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Need to bulk upload provider accounts? Please contact the DevOps team or consult the administrative configuration files.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;

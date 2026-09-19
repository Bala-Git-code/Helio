import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';

// Guards & Routing Helpers
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRedirect } from './components/auth/RoleRedirect';

// Public Marketing & Auth Views
import { LandingPage } from './pages/landing/LandingPage';
import { HowItWorksPage } from './pages/landing/HowItWorksPage';
import { AuthPage } from './pages/auth/AuthPage';

// Segregated Workspace Layouts (Anti-Vanilla Asymmetrical Architectures)
import { PatientPortalLayout } from './layouts/PatientPortalLayout';
import { DoctorPortalLayout } from './layouts/DoctorPortalLayout';

// Patient Workspace Sub-Pages
import { RoutinePage } from './pages/patient/RoutinePage';
import { MedicationsPage } from './pages/patient/MedicationsPage';
import { InteractionsPage } from './pages/patient/InteractionsPage';
import { PatientChatPage } from './pages/patient/PatientChatPage';
import { CareTeamPage } from './pages/patient/CareTeamPage';

// Doctor / Clinician Workspace Sub-Pages
import { ClinicalOverviewPage } from './pages/doctor/ClinicalOverviewPage';
import { PatientCohortPage } from './pages/doctor/PatientCohortPage';
import { PrescriptionsPage } from './pages/doctor/PrescriptionsPage';
import { DoctorAlertsPage } from './pages/doctor/DoctorAlertsPage';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform (App.jsx)
 * ============================================================================
 * 
 * Master Routing Architecture:
 * - Public Marketing Layer: Landing Page (/)
 * - Authentication Layer: Dedicated Google OAuth Login (/login, /auth)
 * - Intelligent Role Resolving Layer: (/portal, /app)
 * - Patient Portal Layer (/patient/*): Warm Vitality & Adherence Workspace
 * - Doctor Portal Layer (/doctor/*): High-Velocity Clinical Command Center
 */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ================================================================
              1. PUBLIC MARKETING & CONVERSION LAYER
              ================================================================ */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />

          {/* ================================================================
              2. DEDICATED AUTHENTICATION & OAUTH LAYER
              ================================================================ */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* ================================================================
              3. INTELLIGENT ROLE-BASED DISPATCHER
              ================================================================ */}
          <Route path="/portal" element={<RoleRedirect />} />
          <Route path="/app" element={<RoleRedirect />} />

          {/* ================================================================
              4. PATIENT PORTAL (SEGREGATED WORKSPACE & NESTED ROUTES)
              ================================================================ */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientPortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/patient/dashboard" replace />} />
            <Route path="dashboard" element={<RoutinePage />} />
            <Route path="routine" element={<Navigate to="/patient/dashboard" replace />} />
            <Route path="medications" element={<MedicationsPage />} />
            <Route path="interactions" element={<InteractionsPage />} />
            <Route path="chat" element={<PatientChatPage />} />
            <Route path="care-team" element={<CareTeamPage />} />
          </Route>

          {/* ================================================================
              5. DOCTOR / CLINICIAN PORTAL (COMMAND CENTER & NESTED ROUTES)
              ================================================================ */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorPortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path="dashboard" element={<ClinicalOverviewPage />} />
            <Route path="clinical-overview" element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path="patients" element={<PatientCohortPage />} />
            <Route path="patient-cohort" element={<Navigate to="/doctor/patients" replace />} />
            <Route path="prescriptions" element={<PrescriptionsPage />} />
            <Route path="alerts" element={<DoctorAlertsPage />} />
            <Route path="toxicity-radar" element={<Navigate to="/doctor/alerts" replace />} />
          </Route>

          {/* ================================================================
              6. FALLBACK & WILDCARD REDIRECTION
              ================================================================ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

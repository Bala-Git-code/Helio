import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import SplashScreenPage from './pages/SplashScreenPage';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

import PatientLayout from './pages/patient/PatientLayout';
import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import PatientMedicationsPage from './pages/patient/PatientMedicationsPage';
import PatientScannerPage from './pages/patient/PatientScannerPage';
import PatientAiAssistantPage from './pages/patient/PatientAiAssistantPage';
import PatientTimelinePage from './pages/patient/PatientTimelinePage';
import PatientVoiceLoggerPage from './pages/patient/PatientVoiceLoggerPage';

import DoctorLayout from './pages/doctor/DoctorLayout';
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorPatientsPage from './pages/doctor/DoctorPatientsPage';
import DoctorPatientDetailPage from './pages/doctor/DoctorPatientDetailPage';
import DoctorPrescribePage from './pages/doctor/DoctorPrescribePage';
import DoctorAnalyticsPage from './pages/doctor/DoctorAnalyticsPage';

export function App() {
  const [theme, setTheme] = useState(localStorage.getItem('helio_theme') || 'light');
  const [token, setToken] = useState(localStorage.getItem('helio_token') || 'demo_active_token_2026');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('helio_user');
    return saved ? JSON.parse(saved) : {
      id: '64f8a1b2c3d4e5f607890123',
      name: 'Sarah Jenkins (Demo Patient)',
      email: 'patient@helio.health',
      role: 'PATIENT',
      phone: '+1-555-0192',
    };
  });

  // Sync Theme Attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('helio_theme', theme);
  }, [theme]);

  // Handle Google OAuth Redirect Token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem('helio_token', urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchUserProfile(urlToken);
    }
  }, []);

  const fetchUserProfile = async (authToken) => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('helio_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('helio_token', newToken);
    localStorage.setItem('helio_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('helio_token');
    localStorage.removeItem('helio_user');
    window.location.href = '/home';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Main Brand Splash Screen */}
        <Route path="/" element={<SplashScreenPage />} />

        {/* Enterprise Landing Page */}
        <Route path="/home" element={<LandingPage theme={theme} setTheme={setTheme} />} />

        {/* Auth Workspace Routes */}
        <Route path="/auth/login" element={<AuthPage onAuthSuccess={handleAuthSuccess} mode="login" />} />
        <Route path="/auth/register" element={<AuthPage onAuthSuccess={handleAuthSuccess} mode="register" />} />

        {/* Dedicated Patient Portal Routes */}
        <Route
          path="/patient"
          element={
            <PatientLayout
              user={user}
              token={token}
              theme={theme}
              setTheme={setTheme}
              onLogout={handleLogout}
            />
          }
        >
          <Route index element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboardPage />} />
          <Route path="medications" element={<PatientMedicationsPage />} />
          <Route path="scanner" element={<PatientScannerPage />} />
          <Route path="ai-assistant" element={<PatientAiAssistantPage />} />
          <Route path="timeline" element={<PatientTimelinePage />} />
          <Route path="voice-logger" element={<PatientVoiceLoggerPage />} />
        </Route>

        {/* Dedicated Doctor Portal Routes */}
        <Route
          path="/doctor"
          element={
            <DoctorLayout
              user={user}
              token={token}
              theme={theme}
              setTheme={setTheme}
              onLogout={handleLogout}
            />
          }
        >
          <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboardPage />} />
          <Route path="patients" element={<DoctorPatientsPage />} />
          <Route path="patient/:id" element={<DoctorPatientDetailPage />} />
          <Route path="prescribe" element={<DoctorPrescribePage />} />
          <Route path="analytics" element={<DoctorAnalyticsPage />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
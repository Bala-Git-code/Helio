import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PatientPortal from './components/PatientPortal';
import DoctorPortal from './components/DoctorPortal';
import AuthPage from './components/AuthPage';

export function App() {
  const [theme, setTheme] = useState(localStorage.getItem('helio_theme') || 'light');
  const [token, setToken] = useState(localStorage.getItem('helio_token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('helio_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activePortal, setActivePortal] = useState('patient');

  // Handle URL token from Google OAuth Redirect
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

  // Sync Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('helio_theme', theme);
  }, [theme]);

  // Set default view based on user role when logging in
  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      setActivePortal('doctor');
    } else {
      setActivePortal('patient');
    }
  }, [user]);

  const fetchUserProfile = async (authToken) => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('helio_user', JSON.stringify(data.user));
      } else {
        handleLogout();
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
  };

  return (
    <div className="app-container">
      <Navbar
        user={user}
        activePortal={activePortal}
        setActivePortal={setActivePortal}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {!token || !user ? (
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        ) : activePortal === 'doctor' ? (
          <DoctorPortal token={token} user={user} />
        ) : (
          <PatientPortal token={token} user={user} />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem', textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
        HELIO Enterprise Medication Intelligence Platform • React 18, Express 5 & MongoDB Atlas • Clinical Intelligence AI
      </footer>
    </div>
  );
}

export default App;
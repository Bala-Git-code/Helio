import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import WelcomePage from './components/WelcomePage';
import AuthPage from './components/AuthPage';
import BasicInfoPage from './components/BasicInfoPage';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import OnboardingTour from './components/OnboardingTour';

function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [user, setUser] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentSummaries, setAppointmentSummaries] = useState([]);
  
  // App Notifications & Tours
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // 1. Session Restore on Application Mount
  useEffect(() => {
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        const isExpired = decodedToken.exp * 1000 < Date.now();
        
        if (!isExpired) {
          const userData = {
            id: decodedToken.user.id,
            role: decodedToken.user.role,
            name: decodedToken.user.name || 'User',
            email: decodedToken.user.email || 'No email',
            userType: decodedToken.user.role
          };
          
          setUser(userData);
          
          // Route based on role
          if (userData.userType === 'doctor') {
            setCurrentPage('doctorDashboard');
          } else if (userData.userType === 'admin') {
            setCurrentPage('adminDashboard');
          } else {
            setCurrentPage('dashboard');
          }
        } else {
          localStorage.removeItem('jwtToken');
        }
      } catch (err) {
        localStorage.removeItem('jwtToken');
      }
    }
  }, []);

  // 2. Google OAuth Redirect Handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('jwtToken', token);
      
      const decodedToken = jwtDecode(token);
      const userData = {
        id: decodedToken.user.id,
        role: decodedToken.user.role,
        name: decodedToken.user.name || 'New User', 
        email: decodedToken.user.email || 'No email',
        userType: decodedToken.user.role
      };

      handleAuthSuccess(userData, false, true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleGetStarted = () => {
    setCurrentPage('auth');
  };

  const handleGoHome = () => {
    setCurrentPage('welcome');
  };

  const handleAuthSuccess = (userData, isNewUser, showNotification = false) => {
    setUser(userData);
    setShowLoginNotification(showNotification);

    if (userData.userType === 'doctor') {
      setCurrentPage('doctorDashboard');
    } else if (userData.userType === 'admin') {
      setCurrentPage('adminDashboard');
    } else {
      if (isNewUser) {
        setCurrentPage('basicInfo');
      } else {
        setCurrentPage('dashboard');
      }
    }
  };

  const handleBasicInfoComplete = (basicInfo) => {
    if (user) {
      setUser({ ...user, ...basicInfo });
      setCurrentPage('dashboard');
      setShowTour(true); // Launch guided tour on onboarding complete
    }
  };

  const handleAddMedicine = (medicine) => {
    setMedicines(prev => [...prev, medicine]);
  };

  const handleDeleteMedicine = (id) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
  };

  const handleAddAppointment = (appointment) => {
    setAppointments(prev => [...prev, appointment]);
  };

  const handleDeleteAppointment = (id) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
  };

  const handleSaveAppointmentSummary = (summary) => {
    setAppointmentSummaries(prev => [...prev, summary]);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    setUser(null);
    setCurrentPage('welcome');
    setMedicines([]);
    setAppointments([]);
    setAppointmentSummaries([]);
    setShowTour(false);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };
  
  const handleNotificationDismiss = () => {
      setShowLoginNotification(false);
  };

  return (
    <div className="page-shell">
      {currentPage === 'welcome' && <WelcomePage onGetStarted={handleGetStarted} />}
      {currentPage === 'auth' && <AuthPage onAuthSuccess={handleAuthSuccess} />}
      {currentPage === 'basicInfo' && <BasicInfoPage onComplete={handleBasicInfoComplete} />}
      
      {currentPage === 'doctorDashboard' && user && (
        <DoctorDashboard 
          user={user}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'adminDashboard' && user && (
        <AdminDashboard 
          user={user}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onUpdateUser={handleUpdateUser}
          medicines={medicines}
          appointments={appointments}
          appointmentSummaries={appointmentSummaries}
          onAddMedicine={handleAddMedicine}
          onDeleteMedicine={handleDeleteMedicine}
          onAddAppointment={handleAddAppointment}
          onDeleteAppointment={handleDeleteAppointment}
          onSaveAppointmentSummary={handleSaveAppointmentSummary}
          onGoHome={handleGoHome}
          showSuccessNotification={showLoginNotification}
          onNotificationDismiss={handleNotificationDismiss}
        />
      )}

      {/* Guide tour overlay */}
      {showTour && <OnboardingTour onClose={() => setShowTour(false)} />}
    </div>
  );
}

export default App;
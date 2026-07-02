import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode"; // You need to install this: npm install jwt-decode
import WelcomePage from './components/WelcomePage';
import AuthPage from './components/AuthPage';
import BasicInfoPage from './components/BasicInfoPage';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [user, setUser] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentSummaries, setAppointmentSummaries] = useState([]);

  // 1. ADD A NEW STATE TO TRIGGER THE NOTIFICATION
  const [showLoginNotification, setShowLoginNotification] = useState(false);

  // 2. ADD THIS useEffect TO HANDLE THE GOOGLE REDIRECT
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // If a token is found in the URL, it means we're coming from a Google login
    if (token) {
      localStorage.setItem('jwtToken', token);
      
      // Decode the token to get user information
      const decodedToken = jwtDecode(token);
      const userData = {
        id: decodedToken.user.id,
        role: decodedToken.user.role,
        name: decodedToken.user.name || 'New User', 
        email: decodedToken.user.email || 'No email',
        userType: decodedToken.user.role
      };

      // Call the success handler, treating it as an existing user and triggering the notification
      handleAuthSuccess(userData, false, true);

      // Clean the URL by removing the token, so it doesn't get processed again
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []); // The empty array [] ensures this runs only once when the app first loads

  const handleGetStarted = () => {
    setCurrentPage('auth');
  };

  const handleGoHome = () => {
    setCurrentPage('welcome');
  };

  // 3. MODIFY handleAuthSuccess TO ACCEPT THE NOTIFICATION TRIGGER
  const handleAuthSuccess = (userData, isNewUser, showNotification = false) => {
    setUser(userData);
    setShowLoginNotification(showNotification); // Set the state here

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
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };
  
  // A new handler to dismiss the notification from the Dashboard
  const handleNotificationDismiss = () => {
      setShowLoginNotification(false);
  }

  return (
    <div className="page-shell">
      {currentPage === 'welcome' && <WelcomePage onGetStarted={handleGetStarted} />}
      {currentPage === 'auth' && <AuthPage onAuthSuccess={handleAuthSuccess} />}
      {currentPage === 'basicInfo' && <BasicInfoPage onComplete={handleBasicInfoComplete} />}
      {currentPage === 'doctorDashboard' && user && (
        <DoctorDashboard 
          user={user}
          linkedPatientCode={user.linkedPatientCode}
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'adminDashboard' && user && (
        <AdminDashboard 
          user={user}
          onLogout={handleLogout}
        />
      )}
      {/* 4. PASS THE NEW PROP AND HANDLER TO THE DASHBOARD */}
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
    </div>
  );
}

export default App;
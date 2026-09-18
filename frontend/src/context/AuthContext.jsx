import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * ============================================================================
 * HELIO Enterprise Authentication & Role Management Context
 * ============================================================================
 * 
 * Manages authenticated user session, role permission states ('patient' | 'doctor'),
 * Google OAuth integration hooks, live adherence scores, and role-based redirect pathways.
 */

const AuthContext = createContext(null);

const STORAGE_KEY = 'helio_auth_state';

const DEFAULT_PATIENT = {
  id: 'usr_pat_9921',
  name: 'Elena Rostova',
  email: 'elena.rostova@heliohealth.io',
  role: 'patient',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  condition: 'Type 2 Diabetes & Hypertension',
  adherenceRate: 94,
  streakDays: 14,
};

const DEFAULT_DOCTOR = {
  id: 'usr_doc_4402',
  name: 'Dr. Julian Vance, MD',
  email: 'dr.vance@heliohealth.io',
  role: 'doctor',
  avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  specialty: 'Clinical Pharmacotherapy & Cardiology',
  activePatientsCount: 148,
  criticalAlertsCount: 3,
};

export function AuthProvider({ children }) {
  // Load saved session or initialize as default active patient
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PATIENT;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  /**
   * Simulated Google OAuth Login
   * Accepts target role ('patient' or 'doctor')
   */
  const loginWithGoogle = async (preferredRole = 'patient') => {
    setIsLoading(true);
    try {
      // Simulate OAuth network latency
      await new Promise((resolve) => setTimeout(resolve, 800));
      const newUser = preferredRole === 'doctor' ? DEFAULT_DOCTOR : DEFAULT_PATIENT;
      setUser(newUser);
      return { success: true, user: newUser };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Email/Password Auth
   */
  const login = async (email, password, preferredRole = 'patient') => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const baseUser = preferredRole === 'doctor' ? DEFAULT_DOCTOR : DEFAULT_PATIENT;
      const loggedUser = { ...baseUser, email: email || baseUser.email };
      setUser(loggedUser);
      return { success: true, user: loggedUser };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Switch between Patient and Doctor personas (vital for dev & demos)
   */
  const switchRole = (newRole) => {
    if (newRole === 'doctor') {
      setUser(DEFAULT_DOCTOR);
    } else {
      setUser(DEFAULT_PATIENT);
    }
  };

  /**
   * Dynamically update patient's adherence rate upon dose toggle
   */
  const updateAdherenceRate = (rate) => {
    setUser((prev) => (prev ? { ...prev, adherenceRate: rate } : prev));
  };

  /**
   * Sign out
   */
  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient',
    adherenceRate: user?.adherenceRate ?? 94,
    streakDays: user?.streakDays ?? 14,
    isLoading,
    loginWithGoogle,
    login,
    logout,
    switchRole,
    updateAdherenceRate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

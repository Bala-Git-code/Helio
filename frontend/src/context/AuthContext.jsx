import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * ============================================================================
 * HELIO Enterprise Authentication & Session Context (context/AuthContext.jsx)
 * ============================================================================
 * 
 * Strict Security Architecture:
 * - Zero-JWT & Zero-Password: Identity is backed exclusively by server-side Redis sessions.
 * - Single Sign-On: Google OAuth 2.0 is the sole identity provider.
 * - Browser Cookies: Communicates via rolling httpOnly session cookies ('helio.sid').
 * - All internal API calls enforce `credentials: 'include'`.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Introspect current active session from Redis session store
   */
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      // In standalone frontend development or network interruptions
      console.warn('[HELIO AUTH] Session check status:', err.message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Google OAuth 2.0 Redirect Trigger
   * Dispatches top-level navigation to the backend Google OAuth endpoint
   * with the selected clinical role passed in the query parameter.
   */
  const loginWithGoogle = (preferredRole = 'patient') => {
    const roleParam = encodeURIComponent(preferredRole);
    // Top-level browser navigation to OAuth flow
    window.location.href = `/api/auth/google?role=${roleParam}`;
  };

  /**
   * Session Termination
   * Destroys server-side Redis session and revokes the 'helio.sid' cookie
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    } catch (err) {
      console.warn('[HELIO AUTH] Server logout warning:', err.message);
    } finally {
      setUser(null);
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  /**
   * Local state updater for real-time patient dose tracking
   */
  const updateAdherenceRate = (newRate) => {
    setUser((prev) => (prev ? { ...prev, adherenceRate: newRate } : prev));
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
    authError,
    loginWithGoogle,
    logout,
    refreshSession: checkSession,
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

export default AuthContext;

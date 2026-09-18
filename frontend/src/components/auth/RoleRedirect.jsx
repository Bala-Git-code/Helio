import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ============================================================================
 * RoleRedirect: Intelligent Workspace Routing Layer
 * ============================================================================
 * 
 * Automatically resolves the authenticated user's assigned role
 * ('patient' vs 'doctor') and redirects them to their designated workspace.
 */
export function RoleRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'doctor') {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  return <Navigate to="/patient/dashboard" replace />;
}

export default RoleRedirect;

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ============================================================================
 * ProtectedRoute: Role-Based Routing Guard
 * ============================================================================
 * 
 * Enforces authentication and role segregation. Prevents patient access
 * to clinical doctor tools and doctor misdirection to personal patient portals.
 */
export function ProtectedRoute({ allowedRole, children }) {
  const { user, isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#08080F',
          color: '#FFFFFF',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '1.25rem',
          letterSpacing: '0.05em',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTopColor: '#8B5CF6',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Verifying Clinical Credentials...
        </div>
      </div>
    );
  }

  // Not logged in -> Send to auth page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Cross-role protection: redirect to legitimate portal
  if (allowedRole && role !== allowedRole) {
    const targetPortal = role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
    return <Navigate to={targetPortal} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;

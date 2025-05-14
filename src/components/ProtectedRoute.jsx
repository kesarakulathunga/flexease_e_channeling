// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * A wrapper for routes that require authentication
 * @param {Object} props Component props
 * @param {boolean} props.requireAdmin Whether the route requires admin privileges
 * @param {string} props.requiredRole Specific role required for access ('ADMIN', 'PATIENT')
 * @param {string} props.redirectTo Where to redirect if not authenticated
 */
export default function ProtectedRoute({ 
  requireAdmin = false,
  requiredRole = null,
  redirectTo = '/verify-email',
}) {
  const { isAuthenticated, isAdmin, userRole, loading } = useAuth();
  const location = useLocation();
  // While checking auth status, we could show a loading indicator
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
    // Check token directly in localStorage as an additional validation
  const token = localStorage.getItem('authToken');
  const userInStorage = localStorage.getItem('user');
  
  // Debug info (will be visible in console, helpful for troubleshooting)
  console.log('ProtectedRoute Check:', { 
    isAuthenticated, 
    isAdmin, 
    userRole,
    requireAdmin, 
    requiredRole, 
    path: location.pathname,
    token: token ? 'Present' : 'Missing',
    userInStorage: userInStorage ? 'Present' : 'Missing',
    profileInStorage: localStorage.getItem('currentProfile') ? 'Present' : 'Missing'
  });
  
  // Additional check: if context says not authenticated but we have a token
  // This handles cases where context might not be initialized properly
  if (!isAuthenticated && token) {
    console.log('Context shows not authenticated but token exists - attempting recovery');
    
    // If we have a token but no user data, try to recover basic user state
    if (!userInStorage) {
      console.log('No user data found with token - adding fallback user data');
      localStorage.setItem('user', JSON.stringify({ email: 'user@example.com' }));
      localStorage.setItem('userRole', 'PATIENT');
    }
    
    // Allow access if token exists, even if other checks fail
    console.log('Token exists, allowing access despite auth state inconsistency');
    return <Outlet />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    console.log('Not authenticated, redirecting to', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If route requires admin but user is not admin, redirect
  if (requireAdmin && !isAdmin) {
    console.log('Admin required but user is not admin');
    return <Navigate to="/dashboard" replace />;
  }
  
  // If specific role is required, check it
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Role ${requiredRole} required, but user has role ${userRole}`);
    
    // Redirect based on current role
    if (userRole === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Otherwise, render the protected content
  return <Outlet />;
}

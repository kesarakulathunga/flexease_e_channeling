// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

// Create context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      try {
        console.log('AuthContext - Initializing auth state');
        
        // Log all auth-related localStorage entries for debugging
        console.log('AuthContext - Current localStorage:', {
          authToken: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
          user: localStorage.getItem('user') ? 'User exists' : 'No user',
          currentProfile: localStorage.getItem('currentProfile') ? 'Profile exists' : 'No profile',
          userRole: localStorage.getItem('userRole'),
          isAdmin: localStorage.getItem('isAdmin')
        });
        
        // First check if we have a valid token
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('AuthContext - No authentication token found');
          setLoading(false);
          return;
        }
        
        // Check if user is already logged in via authService
        if (authService.isAuthenticated()) {
          console.log('AuthContext - User is authenticated');
          
          // Get user info from localStorage
          const currentUser = authService.getCurrentUser();
          if (!currentUser) {
            console.warn('AuthContext - No user data found but token exists, creating basic user');
            // Create minimal user data if token exists but no user data
            const basicUser = { email: 'user@example.com' };
            localStorage.setItem('user', JSON.stringify(basicUser));
            setUser(basicUser);
          } else {
            setUser(currentUser);
          }
          
          // Get role and admin status
          const role = localStorage.getItem('userRole') || (authService.isAdmin() ? 'ADMIN' : 'PATIENT');
          setIsAdmin(authService.isAdmin());
          setUserRole(role);
            // Get profile if available
          const profileData = localStorage.getItem('currentProfile');
          if (profileData) {
            try {
              const parsedProfile = JSON.parse(profileData);
              
              // Normalize profile data to ensure it has a name property
              if (!parsedProfile.name && parsedProfile.fullName) {
                console.log('AuthContext - Normalizing loaded profile: setting name from fullName');
                parsedProfile.name = parsedProfile.fullName;
              }
              
              setCurrentProfile(parsedProfile);
              console.log('AuthContext - Profile loaded:', parsedProfile);
            } catch (err) {
              console.error('AuthContext - Error parsing profile:', err);
            }
          }
        } else {
          console.log('AuthContext - Token exists but authentication check failed');
          // This could happen if token is invalid or expired
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially corrupted auth data
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);// Login function
  const login = async (userData, isAdminLogin = false) => {
    console.log('AuthContext - Login called with:', { userData, isAdminLogin });
    
    setUser(userData);
    setIsAdmin(isAdminLogin);
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // If admin login, set isAdmin flag
    if (isAdminLogin) {
      localStorage.setItem('isAdmin', 'true');
    }
    
    // Set user role
    const role = isAdminLogin ? 'ADMIN' : 'PATIENT';
    setUserRole(role);
    localStorage.setItem('userRole', role);
    
    console.log('AuthContext - Login complete, localStorage updated');
  };  // Set current patient profile
  const setProfile = (profileData) => {
    if (profileData) {
      // Log profile data for debugging
      console.log('AuthContext - setProfile called with:', JSON.stringify(profileData));
      
      // Normalize profile data to ensure it has a name property
      const normalizedProfile = { ...profileData };
      
      // Some APIs might use fullName instead of name
      if (!normalizedProfile.name && normalizedProfile.fullName) {
        console.log('AuthContext - Normalizing profile: setting name from fullName');
        normalizedProfile.name = normalizedProfile.fullName;
      }
      
      // Debug: print all profile fields
      console.log('AuthContext - Setting profile with fields:', Object.keys(normalizedProfile).join(', '));
      
      setCurrentProfile(normalizedProfile);
      localStorage.setItem('currentProfile', JSON.stringify(normalizedProfile));
    } else {
      setCurrentProfile(null);
      localStorage.removeItem('currentProfile');
    }
  };  // Logout function
  const logout = async (options = {}) => {
    console.log('AuthContext - Logout called with options:', options);
    
    try {
      // Set the global flag to prevent redirects during logout
      window.isPerformingLogout = true;
      
      // First, clear auth state from context
      setUser(null);
      setIsAdmin(false);
      setUserRole(null);
      setCurrentProfile(null);
      
      // Clear all auth-related items from localStorage immediately
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRole');
      localStorage.removeItem('currentProfile');
      
      // Then attempt the API call - if it fails, we've already cleaned up locally
      await authService.logout({
        ...options,
        isAdmin: options.isAdmin || isAdmin // Pass current isAdmin state
      });
    } catch (err) {
      console.error('Error during logout API call:', err);
      // We've already cleared localStorage, so no further action needed
      
      // If redirect was requested but the API call failed,
      // still perform the redirect to home page for consistency
      if (options.redirect) {
        console.log(`AuthContext - Redirecting to ${options.redirectUrl || '/'} despite API error`);
        window.location.href = options.redirectUrl || '/';
      }
    } finally {
      // Ensure the flag is cleared
      window.isPerformingLogout = false;
    }
    
    console.log('AuthContext - Logout complete, all auth data cleared');
  };

  // Context value
  const value = {
    user,
    isAdmin,
    loading,
    userRole,
    currentProfile,
    login,
    logout,
    setProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

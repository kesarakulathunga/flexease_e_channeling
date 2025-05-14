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
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Initialize auth state
  useEffect(() => {
    console.log('AuthContext - Initializing auth state');
    
    // Log current localStorage state
    const localStorageState = {
      authToken: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
      user: localStorage.getItem('user') ? 'User exists' : 'No user',
      currentProfile: localStorage.getItem('currentProfile') ? 'Profile exists' : 'No profile',
      userRole: localStorage.getItem('userRole'),
      isAdmin: localStorage.getItem('isAdmin')
    };
    console.log('AuthContext - Current localStorage:', localStorageState);
    
    // Function to load auth state from localStorage
    const loadAuthState = () => {
      const token = localStorage.getItem('authToken');
      const userString = localStorage.getItem('user');
      const profileString = localStorage.getItem('currentProfile');
      const role = localStorage.getItem('userRole');
      const adminFlag = localStorage.getItem('isAdmin');
      
      if (token && token !== 'null') {
        setIsAuthenticated(true);
        
        if (userString) {
          try {
            const userData = JSON.parse(userString);
            setUser(userData);
            console.log('AuthContext - User loaded from localStorage:', userData);
          } catch (e) {
            console.error('Error parsing user data:', e);
            // Create a basic user object if parsing fails
            const basicUser = { email: 'user@example.com' };
            localStorage.setItem('user', JSON.stringify(basicUser));
            setUser(basicUser);
          }
        }
        
        if (profileString) {
          try {
            const profileData = JSON.parse(profileString);
            setCurrentProfile(profileData);
            console.log('AuthContext - Profile loaded from localStorage:', profileData);
          } catch (e) {
            console.error('Error parsing profile data:', e);
            setCurrentProfile(null);
          }
        } else {
          setCurrentProfile(null);
        }
        
        setUserRole(role || 'PATIENT');
        setIsAdmin(adminFlag === 'true');
      } else {
        console.log('AuthContext - No authentication token found');
        setIsAuthenticated(false);
        setUser(null);
        setCurrentProfile(null);
        setUserRole(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    };
    
    // Initial load
    loadAuthState();
    
    // Event listener for auth state changes
    const handleAuthChange = () => {
      console.log('AuthContext - Auth state change detected');
      loadAuthState();
    };
    
    window.addEventListener('storage:authchange', handleAuthChange);
    
    // Listen for cross-tab localStorage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'authToken' || e.key === 'user' || e.key === 'currentProfile' || e.key === 'userRole') {
        console.log('AuthContext - Cross-tab storage change detected:', e.key);
        handleAuthChange();
      }
    });
    
    return () => {
      window.removeEventListener('storage:authchange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);// Login function
  const login = async (userData, isAdminLogin = false) => {
    console.log('AuthContext - Login called with:', { userData, isAdminLogin });
    
    setUser(userData);
    setIsAdmin(isAdminLogin);
    setIsAuthenticated(true);
    
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
    
    // Dispatch event for cross-component communication
    window.dispatchEvent(new Event('storage:authchange'));
  };

  // Set current patient profile
  const setProfile = (profileData) => {
    setCurrentProfile(profileData);
    localStorage.setItem('currentProfile', JSON.stringify(profileData));
    
    // Dispatch event for cross-component communication
    window.dispatchEvent(new Event('storage:authchange'));
  };
  
  // Logout function
  const logout = async () => {
    console.log('AuthContext - Logout called');
    
    try {
      await authService.logout();
    } catch (err) {
      console.error('Error during logout API call:', err);
    }
    
    // Clear all auth state from context
    setUser(null);
    setIsAdmin(false);
    setUserRole(null);
    setCurrentProfile(null);
    setIsAuthenticated(false);
    
    // Clear all auth-related items from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentProfile');
    
    console.log('AuthContext - Logout complete, all auth data cleared');
    
    // Dispatch event for cross-component communication
    window.dispatchEvent(new Event('storage:authchange'));
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
    isAuthenticated
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

// src/pages/patient/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { patientService } from '../../../services';
import appointmentService from '../../../services/appointmentService';
import FeedbackDisplay from '../../../components/FeedbackDisplay';
import './Dashboard.css';

export default function Dashboard() {
  const { user, currentProfile: authProfile, setProfile } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [syncStatus, setSyncStatus] = useState('unknown'); // 'synced', 'stale', 'unknown'
  const [sectionLoading, setSectionLoading] = useState({
    profile: false,
    appointments: false,
    feedbacks: false
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto refresh when coming back online
      if (syncStatus === 'stale') {
        handleRefresh();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('stale');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh data every 3 minutes if the tab is active
  useEffect(() => {
    let autoRefreshTimer;

    // Function to check if document is visible and refresh specific data
    const checkVisibilityAndRefresh = async () => {
      if (document.visibilityState === 'visible' && !refreshing) {
        console.log('Auto-refreshing dashboard data');

        try {
          // Only refresh appointments and feedbacks, not the whole page
          // Refresh feedbacks using direct API calls
          console.log('Auto-refreshing feedbacks');

          // Get reports first
          const reportsResponse = await patientService.getReports(1, 10);
          let reportsData = [];

          // Handle different possible response structures
          if (reportsResponse.data && Array.isArray(reportsResponse.data)) {
            reportsData = reportsResponse.data;
          } else if (reportsResponse.reports && Array.isArray(reportsResponse.reports)) {
            reportsData = reportsResponse.reports;
          } else if (Array.isArray(reportsResponse)) {
            reportsData = reportsResponse;
          }

          // Get feedback for each report
          const allFeedbacks = [];
          for (const report of reportsData) {
            const reportId = report.id || report._id;
            if (reportId) {
              try {
                const feedbackResponse = await patientService.getReportFeedback(reportId, 1, 5, 'desc');
                const feedbackItems = feedbackResponse?.feedback || [];

                // Add report info to each feedback item
                const processedFeedbacks = feedbackItems.map(item => ({
                  ...item,
                  reportId,
                  reportTitle: report.title || 'Unnamed Report',
                  uploadedAt: report.uploadedAt || report.createdAt || new Date().toISOString(),
                  fileName: report.filename || report.name || '',
                  fileUrl: report.fullFileUrl || report.fileUrl || report.url || ''
                }));

                allFeedbacks.push(...processedFeedbacks);
              } catch (error) {
                console.error(`Error getting feedback for report ${reportId}:`, error);
              }
            }
          }

          // Sort by date (newest first)
          allFeedbacks.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
          });

          setFeedbacks(allFeedbacks);

          // Refresh appointments using direct API calls
          console.log('Auto-refreshing appointments');

          // Use the improved getMyAppointments method that tries multiple endpoints
          try {
            const appointmentData = await appointmentService.getMyAppointments();

            // Set appointments (the method now returns an empty array on error)
            setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
          } catch (err) {
            console.error('Error fetching appointments:', err);
          }

          // Update last refreshed time
          setLastRefreshed(new Date());
          setSyncStatus('synced');

          console.log('Auto-refresh completed successfully');
        } catch (err) {
          console.error('Error during auto-refresh:', err);
          setSyncStatus('stale');
        }
      }
    };

    // Set up auto-refresh timer - every 3 minutes
    autoRefreshTimer = setInterval(checkVisibilityAndRefresh, 3 * 60 * 1000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      // If tab becomes visible and last refresh was more than 1 minute ago
      if (document.visibilityState === 'visible' && lastRefreshed && !refreshing) {
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
        if (lastRefreshed < oneMinuteAgo) {
          console.log('Tab became visible, refreshing stale data');
          checkVisibilityAndRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(autoRefreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastRefreshed, refreshing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check sync status every 5 minutes
  useEffect(() => {
    // Set initial sync status
    if (profileData) {
      setSyncStatus('synced');
    } else if (authProfile) {
      setSyncStatus('stale');
    } else {
      setSyncStatus('unknown');
    }

    // Set up timer to mark data as potentially stale after 5 minutes
    const syncTimer = setInterval(() => {
      if (lastRefreshed) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (lastRefreshed < fiveMinutesAgo) {
          setSyncStatus('stale');
        }
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(syncTimer);
  }, [lastRefreshed, profileData, authProfile]);
  // Function to reload the page
  const handleRefresh = () => {
    console.log('Reloading the page to refresh all data');
    setRefreshing(true);

    // Refresh specific sections
    const refreshData = async () => {
      try {
        if (profileData?.id) {
          // Set loading state for each section
          setSectionLoading({
            profile: true,
            appointments: true,
            feedbacks: true
          });

          // Refresh feedbacks using the direct API call from UploadReport.jsx
          try {
            console.log('Refreshing feedbacks');
            setSectionLoading(prev => ({ ...prev, feedbacks: true }));

            // Get reports first
            const reportsResponse = await patientService.getReports(1, 10);
            let reportsData = [];

            // Handle different possible response structures
            if (reportsResponse.data && Array.isArray(reportsResponse.data)) {
              reportsData = reportsResponse.data;
            } else if (reportsResponse.reports && Array.isArray(reportsResponse.reports)) {
              reportsData = reportsResponse.reports;
            } else if (Array.isArray(reportsResponse)) {
              reportsData = reportsResponse;
            }

            // Get feedback for each report
            const allFeedbacks = [];
            for (const report of reportsData) {
              const reportId = report.id || report._id;
              if (reportId) {
                try {
                  const feedbackResponse = await patientService.getReportFeedback(reportId, 1, 5, 'desc');
                  const feedbackItems = feedbackResponse?.feedback || [];

                  // Add report info to each feedback item
                  const processedFeedbacks = feedbackItems.map(item => ({
                    ...item,
                    reportId,
                    reportTitle: report.title || 'Unnamed Report',
                    uploadedAt: report.uploadedAt || report.createdAt || new Date().toISOString(),
                    fileName: report.filename || report.name || '',
                    fileUrl: report.fullFileUrl || report.fileUrl || report.url || ''
                  }));

                  allFeedbacks.push(...processedFeedbacks);
                } catch (error) {
                  console.error(`Error getting feedback for report ${reportId}:`, error);
                }
              }
            }

            // Sort by date (newest first)
            allFeedbacks.sort((a, b) => {
              const dateA = new Date(a.createdAt || a.date || 0);
              const dateB = new Date(b.createdAt || b.date || 0);
              return dateB - dateA;
            });

            setFeedbacks(allFeedbacks);
          } catch (fbErr) {
            console.error('Error refreshing feedbacks:', fbErr);
          } finally {
            setSectionLoading(prev => ({ ...prev, feedbacks: false }));
          }

          // Refresh appointments using the improved appointmentService method
          try {
            console.log('Refreshing appointments');
            setSectionLoading(prev => ({ ...prev, appointments: true }));

            // Use the improved getMyAppointments method that tries multiple endpoints
            const appointmentData = await appointmentService.getMyAppointments();

            // Set appointments (the method now returns an empty array on error)
            setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
          } catch (appErr) {
            console.error('Error refreshing appointments:', appErr);
          } finally {
            setSectionLoading(prev => ({ ...prev, appointments: false }));
          }

          // Update last refreshed time
          setLastRefreshed(new Date());
          setSyncStatus('synced');
        } else {
          // If no profile data, do a full page reload
          window.location.reload();
        }
      } catch (err) {
        console.error('Error during refresh:', err);
      } finally {
        setRefreshing(false);
      }
    };

    refreshData();
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check if token exists
        const token = localStorage.getItem('authToken');
        console.log('Dashboard - Token check:', token ? 'Token exists' : 'No token found');

        // Debug localStorage contents
        console.log('Dashboard - localStorage contents:', {
          authToken: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
          userRole: localStorage.getItem('userRole'),
          user: localStorage.getItem('user') ? 'User exists' : 'No user',
          currentProfile: localStorage.getItem('currentProfile') ? 'Profile exists' : 'No profile'
        });

        if (!token) {
          console.error('No authentication token found');
          navigate('/verify-email');
          return;
        }

        // Check if user data exists
        const userString = localStorage.getItem('user');
        if (!userString) {
          console.error('No user data found in localStorage');
          // Try to recover by creating a basic user object if we have a token
          if (token) {
            console.log('Creating fallback user data since we have a token');
            const basicUser = { email: 'user@example.com' }; // Fallback user
            localStorage.setItem('user', JSON.stringify(basicUser));
            // If context user is missing but we have localStorage, refresh to reload context
            if (!user) {
              console.log('User missing from context but token exists - reloading to reinitialize');
              window.location.reload();
              return;
            }
          } else {
            navigate('/verify-email');
            return;
          }
        }
        // First try to use the profile from context
        let profile = authProfile;
        console.log('Profile from context:', profile);

        // If not in context, try to get from localStorage
        if (!profile) {
          const savedProfile = localStorage.getItem('currentProfile');
          if (savedProfile) {
            try {
              profile = JSON.parse(savedProfile);
              console.log('Profile from localStorage:', profile);
              // Update the context with the profile
              setProfile(profile);
            } catch (e) {
              console.error('Error parsing profile from localStorage:', e);
            }
          } else {
            console.log('No profile found in localStorage');
          }
        }
        // If still no profile, try to fetch from API
        if (!profile && user?.email) {
          console.log('No profile found, trying to fetch from API with email:', user.email);
          try {
            // First try to get current profile from API (most reliable)
            console.log('Attempting to fetch current profile directly');
            try {
              const currentProfile = await patientService.getCurrentProfile();
              if (currentProfile) {
                console.log('Current profile fetched successfully:', currentProfile);
                profile = currentProfile;
                localStorage.setItem('currentProfile', JSON.stringify(profile));
                setProfile(profile);
                setProfileData(profile);
                setLastRefreshed(new Date());
                setSyncStatus('synced');
              }
            } catch (profileErr) {
              console.warn('Could not fetch current profile, falling back to profiles by email:', profileErr);
              setSyncStatus('stale');

              // Try to get patient profile from API by email
              const profiles = await patientService.getProfilesByEmail(user.email);
              console.log('API returned profiles by email:', profiles);

              if (profiles && profiles.length > 0) {
                profile = profiles[0];
                console.log('Using first profile from API:', profile);
                localStorage.setItem('currentProfile', JSON.stringify(profile));
                setProfile(profile);
                setProfileData(profile);
              } else {
                console.log('No profiles returned from API');
                // If we have a valid token but no profile, redirect to profile creation
                navigate('/patient-details-form', {
                  state: { email: user.email, verified: true }
                });
                return;
              }
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
              // Handle unauthorized - token may be invalid
              navigate('/verify-email');
              return;
            }
          }
        }
        // Fetch feedbacks if we have a profile
        if (profile?.id) {
          console.log('Fetching data for profile ID:', profile.id);
          // Keep profile data in component state
          setProfileData(profile);
          setLastRefreshed(new Date());
            try {
            console.log('Fetching feedbacks using direct API calls');

            // Get reports first
            const reportsResponse = await patientService.getReports(1, 10);
            let reportsData = [];

            // Handle different possible response structures
            if (reportsResponse.data && Array.isArray(reportsResponse.data)) {
              reportsData = reportsResponse.data;
            } else if (reportsResponse.reports && Array.isArray(reportsResponse.reports)) {
              reportsData = reportsResponse.reports;
            } else if (Array.isArray(reportsResponse)) {
              reportsData = reportsResponse;
            }

            // Get feedback for each report
            const allFeedbacks = [];
            for (const report of reportsData) {
              const reportId = report.id || report._id;
              if (reportId) {
                try {
                  const feedbackResponse = await patientService.getReportFeedback(reportId, 1, 5, 'desc');
                  const feedbackItems = feedbackResponse?.feedback || [];

                  // Add report info to each feedback item
                  const processedFeedbacks = feedbackItems.map(item => ({
                    ...item,
                    reportId,
                    reportTitle: report.title || 'Unnamed Report',
                    uploadedAt: report.uploadedAt || report.createdAt || new Date().toISOString(),
                    fileName: report.filename || report.name || '',
                    fileUrl: report.fullFileUrl || report.fileUrl || report.url || '',
                    // Ensure consistent fields
                    date: item.date || item.createdAt || new Date().toISOString(),
                    message: item.message || item.content || '',
                    doctorName: item.doctorName || item.authorName || ''
                  }));

                  allFeedbacks.push(...processedFeedbacks);
                } catch (error) {
                  console.error(`Error getting feedback for report ${reportId}:`, error);
                }
              }
            }

            // Sort by date (newest first)
            allFeedbacks.sort((a, b) => {
              const dateA = new Date(a.createdAt || a.date || 0);
              const dateB = new Date(b.createdAt || b.date || 0);
              return dateB - dateA;
            });

            setFeedbacks(allFeedbacks);
          } catch (fbErr) {
            console.error('Error fetching feedbacks:', fbErr);
            if (fbErr.message && fbErr.message.includes('Network Error')) {
              console.warn('Network error when fetching feedbacks - this might be a CORS issue');
            }
            // Non-critical error, continue loading other data
          }

          // Fetch appointments using direct API calls
          try {
            console.log('Fetching appointments using direct API calls');

            // Use the improved getMyAppointments method that tries multiple endpoints
            const appointmentData = await appointmentService.getMyAppointments();

            // Set appointments (the method now returns an empty array on error)
            setAppointments(Array.isArray(appointmentData) ? appointmentData : []);

          } catch (appErr) {
            console.error('Error fetching appointments:', appErr);
            if (appErr.message && appErr.message.includes('Network Error')) {
              console.warn('Network error when fetching appointments - this might be a CORS issue');
            }
            // Non-critical error, continue loading other data
          }
        } else {
          console.warn('No profile ID available for API calls');
          setError('Your profile information could not be loaded properly. Please try logging in again.');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load your information. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authProfile, setProfile, navigate]);

  if (loading) {
    return (
      <div className="loading">
        <div>Loading your dashboard...</div>
        <div className="loading-indicator"></div>
      </div>
    );
  }  if (error && !refreshing) {
    return (
      <div className="error">
        {error}
        <button onClick={handleRefresh} className="refresh-button" style={{ marginLeft: '1rem' }}>
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <>
      <header className="dashboard-header">
        <div className="header-container">
          <h1>Hi, {profileData?.name?.split(' ')[0] || authProfile?.name?.split(' ')[0] || 'there'}</h1>
          <div className="header-controls">
            <div className={`sync-status ${syncStatus}`}>
              {!isOnline && <span className="offline-indicator">Offline</span>}
              {isOnline && syncStatus === 'synced' && 'Data in sync'}
              {isOnline && syncStatus === 'stale' && 'Data may be outdated'}
              {isOnline && syncStatus === 'unknown' && 'Sync status unknown'}
            </div>            <button
              onClick={handleRefresh}
              className="refresh-button"
              disabled={!isOnline}
            >
              Reload Page
            </button>
          </div>
        </div>
        {lastRefreshed && (
          <div className="last-refreshed">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {!isOnline && <div className="offline-warning">You are offline. Some features may not be available.</div>}
      </header>

      <section className="dashboard-details">
        <div className="section-header">
          <h2>👤 Basic Details</h2>
          {(refreshing || sectionLoading.profile) && <div className="loading-indicator small"></div>}
        </div>
        {(profileData || authProfile) ? (
          <ul>
            <li><strong>Name:</strong> {profileData?.name || authProfile?.name}</li>
            <li><strong>Age:</strong> {profileData?.age || authProfile?.age}</li>
            <li><strong>Email:</strong> {profileData?.email || authProfile?.email}</li>
            <li><strong>Mobile:</strong> {profileData?.mobileNumber || authProfile?.mobileNumber}</li>
            <li className="profile-actions">
              <button
                onClick={() => navigate('/dashboard/edit-profile')}
                className="edit-profile-btn"
              >
                Edit Profile
              </button>
            </li>
            {profileData ? (
              <li className="data-source">
                <span className="live-data">Live data from server</span>
              </li>
            ) : authProfile ? (
              <li className="data-source">
                <span className="cached-data">Cached data</span>                <button onClick={handleRefresh} className="mini-refresh-button">
                  Reload
                </button>
              </li>
            ) : null}
          </ul>
        ) : (
          <p>No profile information found. Please create a profile.</p>
        )}
      </section>

      <section className="dashboard-appointments">
        <div className="section-header">
          <h2>📅 Upcoming Appointments</h2>
          {(refreshing || sectionLoading.appointments) && <div className="loading-indicator small"></div>}
        </div>
        <div className="simple-content-box">
          {appointments.length > 0 ? (
            <div className="appointment-summary">
              <p>You have {appointments.length} upcoming appointment{appointments.length > 1 ? 's' : ''}.</p>
              <p>Next appointment: {new Date(appointments[0].date).toLocaleDateString()} at {appointments[0].time}</p>
            </div>
          ) : (
            <div className="empty-state">
              <p>No upcoming appointments.</p>              <button
                onClick={() => navigate('/dashboard/make-appointment')}
                className="schedule-button"
              >
                Schedule Appointment
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-feedback">
        <div className="section-header">
          <h2>📋 Report Feedbacks</h2>
          {(refreshing || sectionLoading.feedbacks) && <div className="loading-indicator small"></div>}
        </div>
        <div className="simple-content-box">
          {feedbacks.length > 0 ? (
            <div className="feedback-summary">
              <p>You have {feedbacks.length} feedback{feedbacks.length > 1 ? 's' : ''} from your reports.</p>
              <p>Latest feedback: {new Date(feedbacks[0].createdAt || feedbacks[0].date || new Date()).toLocaleDateString()} for {feedbacks[0].reportTitle || 'Report'}</p>
            </div>
          ) : (
            <div className="empty-state">
              <p>No feedbacks available.</p>
              <p className="empty-state-hint">Feedbacks will appear here after your reports are reviewed</p>
              <button
                onClick={() => navigate('/dashboard/upload-report')}
                className="upload-button"
              >
                Upload Report
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

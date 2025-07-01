// src/pages/verify-details/ProfileSelection.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../../services';
import './ProfileSelection.css';
import physioIllustration from '../../../assets/physio-illustration.png';

export default function ProfileSelection() {
  const navigate = useNavigate();
  // retrieve the verified email and profiles passed via location.state
  const { email, profiles } = useLocation().state || { email: '', profiles: [] };
  const [profileList, setProfileList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // on mount, use profiles from state or fetch if needed
  useEffect(() => {
    if (!email) {
      setLoading(false);
      setError('No email provided. Please go back and verify your email.');
      return;
    }

    if (profiles && profiles.length > 0) {
      // If profiles were passed directly in state, use them
      // Make sure each profile has an id field (might be _id in MongoDB)
      const processedProfiles = profiles.map(profile => ({
        ...profile,
        id: profile.id || profile._id
      }));
      setProfileList(processedProfiles);
      setLoading(false);
    } else {
      // Otherwise, we need to redirect back to email verification
      navigate('/verify-email');
    }
  }, [email, profiles, navigate]);
  // Use an existing profile
  const handleUseProfile = async (profileId) => {
    setLoading(true);
    try {
      console.log(`ProfileSelection - Selecting profile with ID: ${profileId}`);

      // Select the account using the authService with updated endpoint
      const response = await authService.selectAccount(profileId);
      console.log('Profile selection response:', response);

      // Get the profile from the response
      const profile = response.profile || response.patient;

      if (profile) {
        // Log localStorage state
        console.log('Post-selection localStorage state:', {
          authToken: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
          user: localStorage.getItem('user') ? 'User exists' : 'No user',
          currentProfile: localStorage.getItem('currentProfile') ? 'Profile exists' : 'No profile',
          userRole: localStorage.getItem('userRole')
        });

        // On success, navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Failed to select profile. Please try again.');
      }
    } catch (err) {
      console.error('Profile selection error:', err);

      // More detailed error message based on the error type
      if (err.response && err.response.status === 404) {
        setError('The profile selection endpoint was not found. Please contact support.');
      } else if (err.response && err.response.status === 400) {
        setError('Invalid profile data. Please try again or create a new profile.');
      } else {
        setError('Failed to select profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create a new profile
  const createNew = () => {
    navigate('/patient-details-form', { state: { email, verified: true } });
  };

  // Define inline styles for the background
  const pageStyle = {
    position: 'relative',
    backgroundColor: '#f5f7fa',
    backgroundImage: `url(${physioIllustration})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundBlendMode: 'soft-light',
    opacity: 0.95,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: "'Poppins', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
  };

  return (
    <div className="selection-page" style={pageStyle}>
      <div className="selection-card">
        <h2>Welcome back</h2>
        <p>
          {loading
            ? `Looking up profiles for ${email}…`
            : profileList.length
            ? `Select one of your existing profiles for ${email}:`
            : `No previous records found under ${email}.`}
        </p>

        {error && <div className="error">{error}</div>}        {loading ? (
          <div className="loader">Loading...</div>
        ) : profileList.length > 0 ? (
          <div className="profile-list">
            {profileList.map((p) => (
              <div key={p.id} className="profile-item">
                <div className="profile-info">
                  <strong>{p.name}</strong>, {p.age} yrs<br/>
                  {p.nic && <span>NIC: {p.nic}</span>}
                </div>
                <button
                  className="btn-primary"
                  onClick={() => handleUseProfile(p.id)}
                >
                  Use This Profile
                </button>
              </div>
            ))}
            <button className="btn-outline" onClick={createNew}>
              Create New Profile
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={createNew}>
            Create New Profile
          </button>
        )}
      </div>
    </div>
  );
}

// src/pages/verify-details/ProfileSelection.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ProfileSelection.css';

export default function ProfileSelection() {
  const navigate = useNavigate();
  // retrieve the verified email passed via location.state
  const { email } = useLocation().state || { email: '' };

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // on mount, fetch existing profiles for this email
  useEffect(() => {
    setLoading(true);
    // TODO: replace setTimeout with real API call:
    // profileService.listByEmail(email)
    setTimeout(() => {
      if (email.toLowerCase().includes('existing')) {
        // simulate two existing records
        setProfiles([
          { id: 1, name: 'John Doe', age: 45, nic: '123456789V' },
          { id: 2, name: 'Jane Smith', age: 32, nic: 'V987654321' },
        ]);
      } else {
        setProfiles([]); // no records
      }
      setLoading(false);
    }, 800);
  }, [email]);

  // Use an existing profile
  const useProfile = (profile) => {
    navigate('/patient-details', { state: { email, profile } });
  };

  // Create a new profile
  const createNew = () => {
    navigate('/patient-details', { state: { email, profile: null } });
  };

  return (
    <div className="selection-page">
      <div className="selection-card">
        <h2>Welcome back</h2>
        <p>
          {loading
            ? `Looking up profiles for ${email}…`
            : profiles.length
            ? `Select one of your existing profiles for ${email}:`
            : `No previous records found under ${email}.`}
        </p>

        {loading ? (
          <div className="loader">Loading...</div>
        ) : profiles.length > 0 ? (
          <div className="profile-list">
            {profiles.map((p) => (
              <div key={p.id} className="profile-item">
                <div className="profile-info">
                  <strong>{p.name}</strong>, {p.age} yrs<br/>
                  NIC: {p.nic}
                </div>
                <button
                  className="btn-primary"
                  onClick={() => useProfile(p)}
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

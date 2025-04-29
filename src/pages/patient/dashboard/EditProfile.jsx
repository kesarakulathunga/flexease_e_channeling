import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css'; // Uncommented CSS import

export default function EditProfile() {
  const navigate = useNavigate();
  // Simulated fetch from database
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    mobile: '',
    email: '',
  });
  const [editEmail, setEditEmail] = useState(false);
  const [originalEmail, setOriginalEmail] = useState('');

  useEffect(() => {
    // Simulate fetching data from database
    const fetchProfile = async () => {
      // Replace with real API call
      const data = {
        name: 'John Doe',
        age: '30',
        mobile: '1234567890',
        email: 'john@example.com',
      };
      setProfile(data);
      setOriginalEmail(data.email);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleEditEmail = () => {
    setEditEmail(true);
  };

  const handleSave = () => {
    if (editEmail && profile.email !== originalEmail) {
      // Redirect to new email verification page for profile email change
      navigate('/dashboard/edit-profile-email', { state: { email: profile.email } });
      return;
    }
    // TODO: Save other profile changes to backend
    console.log('Profile saved:', profile);
  };

  const handleCancel = () => {
    // Optionally reset form or navigate away
    navigate(-1);
  };

  return (
    <div className="edit-profile-container">
      <h2>Edit Profile</h2>
      <form className="edit-profile-form">
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" value={profile.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="age">Age:</label>
          <input type="number" id="age" name="age" value={profile.age} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="mobile">Mobile Number:</label>
          <input type="text" id="mobile" name="mobile" value={profile.mobile} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address:</label>
          {editEmail ? (
            <input type="email" id="email" name="email" value={profile.email} onChange={handleChange} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{profile.email}</span>
              <button type="button" className="btn-edit-email" onClick={handleEditEmail}>Edit</button>
            </div>
          )}
        </div>
        <div className="edit-actions">
          <button type="button" className="btn-edit-cancel" onClick={handleCancel}>Cancel</button>
          <button type="button" className="btn-edit-save" onClick={handleSave}>Save Changes</button>
        </div>
      </form>
    </div>
  );
}

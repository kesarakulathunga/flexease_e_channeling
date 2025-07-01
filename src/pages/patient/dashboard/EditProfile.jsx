import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { patientService } from '../../../services';
import './EditProfile.css';

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentProfile, setProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile state
  const [profile, setProfileState] = useState({
    name: '',
    age: '',
    mobileNumber: '',
    email: '',
    // gender: '', // ← UNCOMMENT TO ADD GENDER FIELD
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Email editing functionality temporarily disabled
  const [editEmail, setEditEmail] = useState(false);
  const [originalEmail, setOriginalEmail] = useState('');
    useEffect(() => {
    // Fetch profile data from the API
    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // First try to get current profile from context        console.log('Loading profile from context');
        
        if (currentProfile) {
          
          // Try to get name from either name or fullName property
          const profileName = currentProfile.name || currentProfile.fullName || '';
          
          setProfileState({
            name: profileName,
            age: currentProfile.age || '',
            mobileNumber: currentProfile.mobileNumber || '',
            email: currentProfile.email || '',
            // gender: currentProfile.gender || '' // ← UNCOMMENT TO ADD GENDER FIELD
          });
          setOriginalEmail(currentProfile.email || '');
          setIsLoading(false);
          return;
        }
        
        // If not in context, fetch from API
        console.log('Fetching profile from API...');
        const profileData = await patientService.getCurrentProfile();        console.log('Received profile data from API');
          if (profileData) {
          
          // Try to get name from either name or fullName property
          const profileName = profileData.name || profileData.fullName || '';
          
          setProfileState({
            name: profileName,
            age: profileData.age || '',
            mobileNumber: profileData.mobileNumber || '',
            email: profileData.email || '',
            // gender: profileData.gender || '' // ← UNCOMMENT TO ADD GENDER FIELD
          });
          setOriginalEmail(profileData.email || '');
        } else {
          setError('Could not retrieve your profile. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }    };
    
    fetchProfile();
  }, [currentProfile]);
    const handleChange = (e) => {
    setProfileState({ ...profile, [e.target.name]: e.target.value });
  };

  // Email editing functionality temporarily disabled
  // const handleEditEmail = () => {
  //   setEditEmail(true);
  // };
    const handleSave = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }
    
    // Email editing functionality temporarily disabled
    // If email changed, redirect to email verification
    // if (editEmail && profile.email !== originalEmail) {
    //   navigate('/dashboard/edit-profile-email', { state: { email: profile.email } });
    //   return;
    // }
    
    if (!currentProfile?.id) {
      setError('No profile ID found. Cannot update profile.');
      return;
    }
    
    setIsSaving(true);
    setError('');    try {      // Save profile changes to backend
      console.log('Attempting to update profile with ID:', currentProfile.id);
      const updateData = {
        name: profile.name,
        age: parseInt(profile.age),
        mobileNumber: profile.mobileNumber,
        email: profile.email, // Include email even though we're not editing it
        // gender: profile.gender // ← UNCOMMENT TO ADD GENDER FIELD
      };
      
      let updatedProfile = await patientService.updateProfile(currentProfile.id, updateData);
      
      // Print the response to check what fields we got back
      console.log('Server response:', updatedProfile);
      
      // Check if response has all required fields
      const requiredFields = ['name', 'age', 'mobileNumber', 'email', 'id'];
      const missingFields = requiredFields.filter(field => {
        const fieldExists = updatedProfile && (updatedProfile[field] !== undefined && updatedProfile[field] !== null);
        if (!fieldExists) {
          console.warn(`Response missing field: ${field}`);
        }
        return !fieldExists;
      });
      
      // If any required fields are missing, merge with current profile and update data
      if (missingFields.length > 0) {
        console.warn(`API response missing required fields: ${missingFields.join(', ')}`);
        console.warn('Creating a complete profile object by merging data');
        
        updatedProfile = {
          ...currentProfile,        // Start with all current profile data
          ...updateData,            // Apply our updates
          ...updatedProfile,        // Apply any fields returned by the server
          id: currentProfile.id     // Ensure ID is preserved
        };
        
        console.log('Merged profile:', updatedProfile);
      }      // Always force our updated values regardless of server response
      // This ensures the data shown in the UI matches what the user entered
      updatedProfile.name = profile.name;
      updatedProfile.age = parseInt(profile.age);
      updatedProfile.mobileNumber = profile.mobileNumber;
      
      // Add mobile number variants to improve backend matching
      updatedProfile.mobile = profile.mobileNumber;
      updatedProfile.phoneNumber = profile.mobileNumber;
      updatedProfile.contact = profile.mobileNumber;
      
      console.log('Final profile before saving to context:', updatedProfile);
      
      // Update context with the new profile
      setProfile(updatedProfile);
      
      // Store in localStorage to persist changes
      localStorage.setItem('currentProfile', JSON.stringify(updatedProfile));
      
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
      
      // Provide more specific error messages based on response status
      if (err.response) {
        if (err.response.status === 404) {
          setError('Profile update endpoint not found. This might be due to a server configuration issue. Please try again later.');
        } else if (err.response.status === 401 || err.response.status === 403) {
          setError('Your session has expired. Please log in again.');
          // Redirect to login after a delay
          setTimeout(() => navigate('/verify-email'), 2000);
        } else {
          setError(`Failed to save profile changes: ${err.response.data?.message || err.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Request was made but no response was received
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        setError(`Failed to save profile changes: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    // Navigate back to dashboard
    navigate('/dashboard');
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Validate name
    if (!profile.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (profile.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
      isValid = false;
    }

    // Validate age
    if (!profile.age) {
      errors.age = 'Age is required';
      isValid = false;
    } else if (parseInt(profile.age) < 6 || parseInt(profile.age) > 100) {
      errors.age = 'Age must be between 6 and 100';
      isValid = false;
    }

    // Validate mobile number
    if (!profile.mobileNumber) {
      errors.mobileNumber = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(profile.mobileNumber)) {      errors.mobileNumber = 'Mobile number must be 10 digits';
      isValid = false;
    }

    // ← UNCOMMENT BELOW TO ADD GENDER VALIDATION
    // // Validate gender
    // if (!profile.gender) {
    //   errors.gender = 'Gender is required';
    //   isValid = false;
    // }

    // Email editing functionality temporarily disabled
    // Validate email if in edit mode
    // if (editEmail) {
    //   if (!profile.email) {
    //     errors.email = 'Email is required';
    //     isValid = false;
    //   } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
    //     errors.email = 'Email address is invalid';
    //     isValid = false;
    //   }
    // }

    setFormErrors(errors);
    return isValid;
  };
    return (
    <div className="edit-profile-container">
      <h2>Edit Profile</h2>
      
      {isLoading ? (
        <div className="loading-indicator">Loading your profile information...</div>
      ) : error ? (
        <div className="error-message">
          {error}
          <button onClick={() => navigate(-1)} className="btn-back">Back to Dashboard</button>
        </div>
      ) : (
        <form className="edit-profile-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={profile.name} 
              onChange={handleChange}
              className={formErrors.name ? 'input-error' : ''}
              required 
            />
            {formErrors.name && <div className="error-text">{formErrors.name}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="age">Age:</label>
            <input 
              type="number" 
              id="age" 
              name="age" 
              value={profile.age} 
              onChange={handleChange}
              className={formErrors.age ? 'input-error' : ''}
              min="6"
              max="100"
              required
            />
            {formErrors.age && <div className="error-text">{formErrors.age}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="mobileNumber">Mobile Numbers:</label>
            <input 
              type="text" 
              id="mobileNumber" 
              name="mobileNumber" 
              value={profile.mobileNumber} 
              onChange={(e) => setProfileState({ 
                ...profile, 
                mobileNumber: e.target.value.replace(/\D/g, '') 
              })}
              className={formErrors.mobileNumber ? 'input-error' : ''}
              maxLength="10"
              required
            />
            {formErrors.mobileNumber && <div className="error-text">{formErrors.mobileNumber}</div>}          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address:</label>
            {/* Email editing functionality temporarily disabled */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{profile.email}</span>
              {/* <button type="button" className="btn-edit-email" onClick={handleEditEmail}>Edit</button> */}
            </div>
            {/* {editEmail ? (
              <>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={profile.email} 
                  onChange={handleChange} 
                  className={formErrors.email ? 'input-error' : ''}
                  required
                />
                {formErrors.email && <div className="error-text">{formErrors.email}</div>}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{profile.email}</span>
                <button type="button" className="btn-edit-email" onClick={handleEditEmail}>Edit</button>
              </div>
            )} */}
          </div>

          {/* ← UNCOMMENT BELOW TO ADD GENDER FIELD */}
          {/*
          <div className="form-group">
            <label htmlFor="gender">Gender:</label>
            <select
              id="gender"
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              className={formErrors.gender ? 'input-error' : ''}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {formErrors.gender && <div className="error-text">{formErrors.gender}</div>}
          </div>
          */}

          <div className="edit-actions">
            <button type="button" className="btn-edit-cancel" onClick={handleCancel}>Cancel</button>
            <button 
              type="button" 
              className="btn-edit-save" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        )}
      </div>
    );
}

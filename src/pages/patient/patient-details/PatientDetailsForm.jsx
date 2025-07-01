// src/pages/patient-details/PatientDetailsForm.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import aiStock2 from '../../../assets/aiStock2.jpg';
import './PatientDetailsForm.css';

export default function PatientDetailsForm() {
  const navigate = useNavigate();
  const { email, verified, profile } = useLocation().state || { email: '', verified: false, profile: null };
  const { login, setProfile } = useAuth();

  // If editing an existing profile, pre-fill; otherwise start blank
  const [form, setForm] = useState({
    fullName: profile?.name || '',
    age: profile?.age || '',
    mobileNumber: profile?.mobileNumber || '',
    email: email || '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate fields before submission
  const validate = () => {
    const e = {};
    if (!/^\S+\s+\S+/.test(form.fullName))
      e.fullName = 'Full name must be at least two words.';
    if (!(+form.age >= 6 && +form.age <= 100))
      e.age = 'Age must be between 6 and 100.';
    if (!/^[0-9]{10}$/.test(form.mobileNumber))
      e.mobileNumber = 'Mobile number must be 10 digits.';
    return e;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) {
      setErrors(ve);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
      try {
      // Format data for API
      const profileData = {
        name: form.fullName,
        age: parseInt(form.age, 10),
        mobileNumber: form.mobileNumber,
        email: form.email
      };
        if (verified) {        // For pre-verified email, use registerVerifiedPatient
        console.log('Registering verified user with data:', profileData);
        const result = await authService.registerVerifiedPatient(profileData);
        console.log('Registration result:', result);

        // Update auth context with user info and role
        const userData = { email: form.email, name: form.fullName };
        await login(userData, false);

        // Make sure the token is properly set in localStorage
        if (result.token && !localStorage.getItem('authToken')) {
          console.log('Setting auth token manually:', result.token);
          localStorage.setItem('authToken', result.token);
        }

        // Set the profile in auth context and localStorage
        if (result.profile || result.patient) {
          const profileData = result.profile || result.patient;
          setProfile(profileData);
          console.log('Profile set in context and localStorage:', profileData);

          // Ensure profile has an ID
          if (!profileData.id && (profileData._id || profileData.patientId)) {
            profileData.id = profileData._id || profileData.patientId;
          }

          // Make sure currentProfile is set in localStorage
          localStorage.setItem('currentProfile', JSON.stringify(profileData));
        }

        // Delay navigation slightly to ensure localStorage updates are complete
        setTimeout(() => {
          // Double-check localStorage before navigation
          console.log('Pre-navigation check:', {
            authToken: localStorage.getItem('authToken'),
            user: localStorage.getItem('user'),
            currentProfile: localStorage.getItem('currentProfile'),
            userRole: localStorage.getItem('userRole')
          });

          console.log('Navigating to dashboard with token:', localStorage.getItem('authToken'));
          navigate('/dashboard');
        }, 300);
      } else {
        // This path is for updating existing profiles or legacy registration
        // This shouldn't be used in the new flow, but keeping as fallback
        console.log('Redirecting to email verification first');
        setErrors({ submit: 'Please verify your email first.' });
        navigate('/verify-email', { state: { email: form.email } });
      }}catch (error) {
      console.error('Profile save error:', error);

      // Provide more specific error messages based on the error
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 400) {
          setErrors({
            submit: error.response.data.message || 'Invalid profile data. Please check your inputs.'
          });
        } else if (error.response.status === 409) {
          setErrors({
            submit: error.response.data.message || 'A profile with this email or mobile number already exists.'
          });
        } else {
          setErrors({ submit: 'Failed to save profile. Server error.' });
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        setErrors({ submit: 'Network error. Please check your connection and try again.' });
      } else {
        setErrors({ submit: 'Failed to save profile. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // We'll use the CSS-based background instead of inline styles
  // This will allow the animations to work properly
  return (
    <div className="details-page">
      <div className="details-card">
        <h2>{profile ? 'Update Profile' : 'Create Profile'}</h2>
        <p>Email: {form.email}</p>

        <form onSubmit={handleSubmit}>          <div className="field">
            <label>Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className={errors.fullName ? 'error-input' : ''}
            />
            {errors.fullName && <small className="error">{errors.fullName}</small>}
          </div>

          <div className="field">
            <label>Age</label>
            <input
              type="number"
              value={form.age}
              onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
              className={errors.age ? 'error-input' : ''}
            />
            {errors.age && <small className="error">{errors.age}</small>}
          </div>          <div className="field">
            <label>Mobile Number</label>
            <input
              type="text"
              value={form.mobileNumber}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  mobileNumber: e.target.value.replace(/\D/g, ''),
                }))
              }
              className={errors.mobileNumber ? 'error-input' : ''}
            />
            {errors.mobileNumber && <small className="error">{errors.mobileNumber}</small>}          </div>

          {errors.submit && <div className="submit-error">{errors.submit}</div>}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : profile ? 'Update & Continue' : 'Create & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

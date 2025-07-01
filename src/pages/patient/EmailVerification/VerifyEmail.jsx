// src/pages/patient/EmailVerification/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import emailIcon from '../../../assets/envelop.svg';
import physioIllustration from '../../../assets/physio-illustration.png';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(''); // State for OTP input
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // State for OTP verification
  const [resendTimer, setResendTimer] = useState(0); // Timer for resend button
  const [profiles, setProfiles] = useState([]); // Available profiles after verification
  // Three possible steps: 'email', 'otp', 'select'
  const [step, setStep] = useState('email');

  // Timer effect for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval); // Cleanup on unmount or timer change
  }, [resendTimer]);

  const startResendTimer = () => {
    setResendTimer(60); // Start a 60-second timer
  };

  const handleCheckEmail = async (isResend = false) => {
    if (!isResend) {
      // Basic email format validation on initial send
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }
    setError('');
    setIsSending(true);
    try {
      // Step 1: Check email and send OTP
      await authService.checkEmail(email, isResend);

      startResendTimer(); // Start the resend timer
      setStep('otp'); // Move to OTP step
        if (!isResend) {
        console.log("OTP Sent, showing OTP input section.");
      } else {
        console.log("OTP Resent.");
      }
      // Clear previous OTP input on send/resend
      setOtp('');
    } catch (err) {
      console.error("Email check error:", err);
      if (err.message && err.message.includes('Network Error')) {
        setError(`Connection to server failed. Please ensure the backend server is running.`);
      } else {
        setError(`Failed to ${isResend ? 'resend' : 'send'} OTP. Please try again.`);
      }
    } finally {
      setIsSending(false);
    }
  };
    const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setError('');
    setIsVerifying(true);
    try {
      // Step 2: Verify OTP with backend
      const response = await authService.verifyOTP(email, otp);

      // Store user data in context after successful verification
      if (response.user) {
        await login(response.user, false); // Set as patient (not admin)
      } else {
        // If no user data, create a basic user object with the email
        await login({ email }, false);
      }

      // Check for patient profiles in the response
      // The backend might return 'profiles' or 'patients' array
      const patientProfiles = response.profiles || response.patients || [];
      const hasExistingAccounts = response.hasExistingAccounts || patientProfiles.length > 0;

      if (hasExistingAccounts && patientProfiles.length > 0) {
        // Make sure each profile has an id field
        const processedProfiles = patientProfiles.map(profile => ({
          ...profile,
          id: profile.id || profile._id || profile.patientId
        }));
        setProfiles(processedProfiles);
        setStep('select'); // Move to profile selection step
      } else {
        // No profiles found, redirect to registration form
        navigate('/patient-details-form', {
          state: { email, verified: true }
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Invalid OTP or verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };  const handleSelectAccount = async (profileId) => {
    try {
      console.log(`Attempting to select profile with ID: ${profileId}`);

      // Step 3: Select an existing profile with proper error handling
      const response = await authService.selectAccount(profileId);
      console.log('Profile selection response:', response);

      // Get the profile from the response
      const profile = response.profile || response.patient;

      if (profile) {
        // Ensure user role is set in localStorage
        localStorage.setItem('userRole', 'PATIENT');

        // Log the localStorage state
        console.log('Post-selection localStorage state:', {
          authToken: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
          user: localStorage.getItem('user') ? 'User exists' : 'No user',
          currentProfile: localStorage.getItem('currentProfile') ? 'Profile exists' : 'No profile',
          userRole: localStorage.getItem('userRole')
        });

        // Navigate to dashboard after successful profile selection
        navigate('/dashboard');
      } else {
        setError('Failed to select account. Please try again.');
      }
    } catch (error) {
      console.error('Error selecting account:', error);

      // More detailed error message based on the error type
      if (error.response && error.response.status === 404) {
        setError('The profile selection endpoint was not found. Please contact support.');
      } else if (error.response && error.response.status === 400) {
        setError('Invalid profile data. Please try again or create a new profile.');
      } else {
        setError('Failed to select account. Please try again.');
      }
    }
  };

  const handleCreateNew = () => {
    // Navigate to patient details form for creating a new profile
    navigate('/patient-details-form', {
      state: { email, verified: true }
    });
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
    setResendTimer(0); // Reset timer
  };

  useEffect(() => {
    // Pre-fill email if provided via location state
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Define inline styles for the background
  const pageStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
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
    padding: '2rem',
    fontFamily: "'Poppins', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
  };

  return (
    <div className="verify-page" style={pageStyle}>
      <div className="verify-card">
        {/* Progress indicator */}
        <div className="progress">
          <div className={`step ${step === 'email' ? 'active' : ''}`}>Email</div>
          <div className="divider" />
          <div className={`step ${step === 'otp' ? 'active' : ''}`}>OTP</div>
          <div className="divider" />
          <div className={`step ${step === 'select' ? 'active' : ''}`}>Account</div>
        </div>

        {step === 'email' ? (
          <>
            {/* Header */}
            <h2>Step 1: Verify Your Email</h2>
            <p>We'll send a one‑time code to confirm your address.</p>

            {/* Email input */}
            <div className="input-group">
              <img src={emailIcon} alt="" className="icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSending}
                aria-label="Email Address"
              />
            </div>
            {error && <div className="error">{error}</div>}

            {/* Primary action */}
            <button
              className="btn-primary"
              onClick={() => handleCheckEmail(false)}
              disabled={isSending || !email}
            >
              {isSending ? 'Sending…' : 'Send OTP'}
            </button>

            {/* Secondary action */}
            <button
              className="btn-link"
              onClick={() => { setEmail(''); setError(''); }}
              disabled={isSending}
            >
              Clear Email
            </button>
          </>
        ) : step === 'otp' ? (
          <>
            {/* Header */}
            <h2>Step 2: Enter OTP</h2>
            <p>Enter the 6-digit code sent to <strong>{email}</strong>.</p>

            {/* OTP input */}
            <div className="input-group">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isVerifying || isSending}
                aria-label="One-Time Password"
              />
            </div>
            {error && <div className="error">{error}</div>}

            {/* Primary action */}
            <button
              className="btn-primary"
              onClick={handleVerifyOtp}
              disabled={isVerifying || isSending || otp.length !== 6}
            >
              {isVerifying ? 'Verifying…' : 'Verify OTP'}
            </button>

            {/* Resend OTP & Change Email Actions */}
            <div className="verify-actions">
                 <button
                    className="btn-link"
                    onClick={() => handleCheckEmail(true)}
                    disabled={isSending || isVerifying || resendTimer > 0}
                 >
                    {isSending ? 'Resending...' : (resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP')}
                 </button>
                 <button
                    className="btn-link"
                    onClick={handleBackToEmail}
                    disabled={isSending || isVerifying}
                 >
                    Change Email
                 </button>
            </div>
          </>
        ) : step === 'select' ? (
          <>
            <h2>Step 3: Select Account</h2>
            <p>You have the following accounts under <strong>{email}</strong>:</p>

            {error && <div className="error">{error}</div>}

            <div className="profile-list">
              {profiles.map(profile => (
                <div key={profile.id} className="profile-item">
                  <div className="profile-info">
                    <strong>{profile.name}</strong>, {profile.age} yrs
                    {profile.nic && <span><br/>NIC: {profile.nic}</span>}
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => handleSelectAccount(profile.id)}
                  >
                    Use This Profile
                  </button>
                </div>
              ))}
            </div>

            <button className="btn-outline" onClick={handleCreateNew}>
              Create New Profile
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

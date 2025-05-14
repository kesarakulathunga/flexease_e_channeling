// src/pages/patient/profile/ViewProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import emailIcon from '../../../assets/envelop.svg';
import '../../patient/EmailVerification/VerifyEmail.css';
import './ViewProfile.css';

export default function ViewProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [step, setStep] = useState('email');
  const [isSelecting, setIsSelecting] = useState(false);
  
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
    return () => clearInterval(interval);
  }, [resendTimer]);
  const startResendTimer = () => {
    setResendTimer(60);
  };

  useEffect(() => {
    // Pre-fill email if provided via location state
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleCheckEmail = async (isResend = false) => {
    if (!isResend) {
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }
    setError('');
    setIsSending(true);
    try {
      console.log(`Attempting to ${isResend ? 'resend' : 'send'} OTP to ${email} for profile viewing`);
      // Use the purpose parameter to indicate this is for viewing profile
      const response = await authService.checkEmail(email, isResend, 'view_profile');
      console.log('checkEmail response:', response);

      // Check if the email exists
      if (response.exists === false) {
        setError('This email is not registered. Please make an appointment first to create an account.');
        setIsSending(false);
        return;
      }

      startResendTimer();
      setStep('otp');
      if (!isResend) {
        console.log("OTP Sent, showing OTP input section.");
      } else {
        console.log("OTP Resent.");
      }
      setOtp('');
    } catch (err) {
      console.error("Email check error:", err);
      
      // Specific error handling for different backend responses
      if (err.response && err.response.status === 404) {
        setError('Email not found. Please make an appointment first to create an account.');
      } else if (err.response && err.response.status === 400) {
        setError('Invalid email format. Please check and try again.');
      } else if (err.message && err.message.includes('Network Error')) {
        setError(`Connection to server failed. Please ensure the backend server is running.`);
      } else {
        setError(`Failed to ${isResend ? 'resend' : 'send'} OTP. Please try again.`);
      }
    } finally {
      setIsSending(false);
    }
  };  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setError('');
    setIsVerifying(true);
    try {
      console.log(`Verifying OTP for ${email} for profile viewing`);
      // Pass 'view_profile' as the purpose parameter
      const response = await authService.verifyOTP(email, otp, 'view_profile');
      console.log('OTP verification response:', response);
      
      // Store user data in context after successful verification
      if (response.user) {
        await login(response.user, false); // Set as patient (not admin)
        console.log('User data stored in context after verification');
      } else {
        // If no user data, create a basic user object with the email
        await login({ email }, false);
        console.log('Basic user data created with email:', email);
      }

      // Check for profiles in the response
      const patientProfiles = response.profiles || response.patients || [];
      const hasExistingAccounts = response.hasExistingAccounts || patientProfiles.length > 0;

      if (hasExistingAccounts && patientProfiles.length > 0) {
        const processedProfiles = patientProfiles.map(profile => ({
          ...profile,
          id: profile.id || profile._id || profile.patientId
        }));
        console.log('Found profiles for user:', processedProfiles);
        setProfiles(processedProfiles);
        setStep('select');
      } else {
        // No profiles found, show an error - for view profile, we don't offer creating a new profile
        setError('No profiles found for this email. Please make an appointment first to create a profile.');
        console.log('No profiles found for email:', email);
      }
    } catch (err) {
      console.error('Verification error:', err);
      
      // Enhanced error handling with detailed messages
      if (err.response && err.response.status === 401) {
        setError('Invalid or expired OTP. Please try again or request a new OTP.');
      } else if (err.response && err.response.status === 404) {
        setError('Email not registered. Please make an appointment first to create an account.');
      } else if (err.response && err.response.status === 400) {
        setError('Invalid request. Please check your email and OTP.');
      } else if (err.response && err.response.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Invalid OTP or verification failed. Please try again.');
      }
      
      if (err.response && err.response.data && err.response.data.message) {
        console.error('Server message:', err.response.data.message);
      }
    } finally {
      setIsVerifying(false);
    }
  };
  const handleSelectAccount = async (profileId) => {
    try {
      setIsSelecting(true);
      setError('');
      console.log(`Attempting to select profile with ID: ${profileId}`);
      
      const response = await authService.selectAccount(profileId);
      console.log('Profile selection response:', response);
      
      const profile = response.profile || response.patient;
      
      if (profile) {
        localStorage.setItem('userRole', 'PATIENT');
        
        console.log('Post-selection localStorage state:', {
          authToken: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
          user: localStorage.getItem('user') ? 'User exists' : 'No user',
          currentProfile: localStorage.getItem('currentProfile') ? 'Profile exists' : 'No profile',
          userRole: localStorage.getItem('userRole')
        });
        
        // Add a small delay to ensure auth state updates propagate correctly
        // before navigating to the dashboard
        setTimeout(() => {
          // Force trigger a manual auth state reload across components
          window.dispatchEvent(new Event('storage:authchange'));
          
          // Navigate to dashboard with a slight delay to ensure state is updated
          navigate('/dashboard');
        }, 500);
      } else {
        setError('Failed to select account. Please try again.');
      }
    } catch (error) {
      console.error('Error selecting account:', error);
      
      if (error.response && error.response.status === 404) {
        setError('The profile selection endpoint was not found. Please contact support.');
      } else if (error.response && error.response.status === 400) {
        setError('Invalid profile data. Please try again.');
      } else if (error.message && error.message.includes('Network Error')) {
        setError('Connection to server failed. Please try again later.');
      } else {
        setError('Failed to select account. Please try again.');
      }
    } finally {
      setIsSelecting(false);
    }
  };
  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
    setResendTimer(0);
  };

  return (
    <div className="verify-page">
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
            <h2>View Your Profile</h2>
            <p>Enter your email to access your profile</p>

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

            <button
              className="btn-primary"
              onClick={() => handleCheckEmail(false)}
              disabled={isSending || !email}
            >
              {isSending ? 'Sending…' : 'Send OTP'}
            </button>

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
            <h2>Enter OTP</h2>
            <p>Enter the 6-digit code sent to <strong>{email}</strong></p>

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

            <button
              className="btn-primary"
              onClick={handleVerifyOtp}
              disabled={isVerifying || isSending || otp.length !== 6}
            >
              {isVerifying ? 'Verifying…' : 'Verify OTP'}
            </button>

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
            <h2>Select Your Account</h2>
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
                    disabled={isSelecting}
                  >
                    {isSelecting ? 'Loading...' : 'View This Profile'}
                  </button>
                </div>
              ))}
            </div>
            
            <button
              className="btn-link"
              onClick={handleBackToEmail}
              disabled={isSelecting}
            >
              Back to Email
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

// src/pages/patient/verify-details/ViewProfileCheck.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import emailIcon from '../../../assets/envelop.svg';
import physioIllustration from '../../../assets/physio-illustration.png';
import './ViewProfileCheck.css';

export default function ViewProfileCheck() {
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
  const [emailExists, setEmailExists] = useState(false);

  // Timer effect for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = () => {
    setResendTimer(60);
  };

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
      const response = await authService.checkEmail(email, isResend);
      console.log('Email check response:', response);

      // Check if the email exists in the database
      if (response.exists || response.emailExists) {
        setEmailExists(true);
        startResendTimer();
        setStep('otp');
        setOtp('');
      } else {
        // If email doesn't exist, show message and provide option to make appointment
        setError('No profile found with this email. You need to make an appointment first to create a profile.');
        setEmailExists(false);
      }
    } catch (err) {
      console.error("Email check error:", err);
      if (err.message && err.message.includes('Network Error')) {
        setError('Connection to server failed. Please ensure the backend server is running.');
      } else {
        setError(`Failed to check email. Please try again.`);
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
      const response = await authService.verifyOTP(email, otp);

      // Store user data in context
      if (response.user) {
        await login(response.user, false);
      } else {
        await login({ email }, false);
      }

      // Check for patient profiles
      const patientProfiles = response.profiles || response.patients || [];

      if (patientProfiles.length > 0) {
        const processedProfiles = patientProfiles.map(profile => ({
          ...profile,
          id: profile.id || profile._id || profile.patientId
        }));
        setProfiles(processedProfiles);
        setStep('select');
      } else {
        // This shouldn't happen since we confirmed the email exists earlier
        setError('No profiles found for this email. Please make an appointment to create a profile.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Invalid OTP or verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectAccount = async (profileId) => {
    try {
      const response = await authService.selectAccount(profileId);

      const profile = response.profile || response.patient;

      if (profile) {
        localStorage.setItem('userRole', 'PATIENT');
        navigate('/dashboard');
      } else {
        setError('Failed to select account. Please try again.');
      }
    } catch (error) {
      console.error('Error selecting account:', error);

      if (error.response && error.response.status === 404) {
        setError('The profile was not found. Please try again.');
      } else {
        setError('Failed to select account. Please try again.');
      }
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
    setResendTimer(0);
  };

  const goToMakeAppointment = () => {
    navigate('/verify-email', { state: { email } });
  };

  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

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
    <div className="verify-page" id="view-profile-page" style={pageStyle}>
      <div className="verify-card">
        {/* Progress indicator for multi-step flow */}
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
            <p>Enter your email address to access your profile.</p>

            {/* Email input field */}
            <div className="input-group">
              <img src={emailIcon} alt="" className="icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSending}
              />
            </div>

            {/* Error message - only rendered when there's an error */}
            {error && (
              <div className="message-container">
                <div className="error">{error}</div>
              </div>
            )}

            {/* Actions - primary action always first */}
            <button
              className="btn-primary"
              onClick={() => handleCheckEmail(false)}
              disabled={isSending || !email}
            >
              {isSending ? 'Checking...' : 'Continue'}
            </button>

            {/* Secondary actions - consistently positioned */}
            <div className="secondary-actions">
              {/* Make Appointment button only shows when email doesn't exist */}
              {error && !emailExists && (
                <button className="btn-secondary" onClick={goToMakeAppointment}>
                  Make Appointment Now
                </button>
              )}

              <button
                className="btn-link"
                onClick={() => { setEmail(''); setError(''); }}
                disabled={isSending}
              >
                Clear Email
              </button>
            </div>
          </>
        ) : step === 'otp' ? (
          <>
            <h2>Enter OTP</h2>
            <p>Enter the 6-digit code sent to <strong>{email}</strong>.</p>

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
              />
            </div>

            {/* Error message - only rendered when there's an error */}
            {error && (
              <div className="message-container">
                <div className="error">{error}</div>
              </div>
            )}

            {/* Primary action */}
            <button
              className="btn-primary"
              onClick={handleVerifyOtp}
              disabled={isVerifying || isSending || otp.length !== 6}
            >
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>

            {/* Secondary actions */}
            <div className="secondary-actions">
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
            <h2>Select Profile</h2>
            <p className="profile-subtitle">You have the following profiles with <strong>{email}</strong>:</p>

            {/* Error message - only rendered when there's an error */}
            {error && (
              <div className="message-container">
                <div className="error">{error}</div>
              </div>
            )}

            <div className="profile-list compact">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className="profile-item"
                  onClick={() => handleSelectAccount(profile.id)}
                >
                  <div className="profile-name">{profile.name}</div>
                  <div className="profile-select-arrow">›</div>
                </div>
              ))}
            </div>

            {/* Secondary actions */}
            <div className="secondary-actions">
              <button
                className="btn-link"
                onClick={handleBackToEmail}
                disabled={isSending || isVerifying}
              >
                Change Email
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

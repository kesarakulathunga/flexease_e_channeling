import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import emailIcon from '../../../assets/envelop.svg';
import './EditProfileEmail.css';
import PatientSidebar from '../../../components/Sidebar/Sidebar';

export default function EditProfileEmail() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Try to get email from state or query string
    let emailFromState = location.state?.email;
    let emailFromQuery = new URLSearchParams(location.search).get('email');
    if (emailFromState) setEmail(emailFromState);
    else if (emailFromQuery) setEmail(emailFromQuery);
  }, [location]);

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

  const handleSendOtp = async (isResend = false) => {
    setError('');
    setIsSending(true);
    try {
      // TODO: Call backend to send OTP to email
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOtpSent(true);
      startResendTimer();
      setOtp('');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      setOtpSent(false);
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
      // TODO: Call backend to verify OTP and update email
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (err) {
      setError('Invalid OTP or verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Fallback UI if email is missing
  if (!email) {
    return (
      <div className="verify-page">
        <div className="verify-card">
          <h2>No Email Provided</h2>
          <p>Please access this page from the Edit Profile flow or provide an email in the URL (e.g. /dashboard/edit-profile-email?email=your@email.com).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="progress">
          <div className={`step ${!otpSent ? 'active' : ''}`}>Email</div>
          <div className="divider" />
          <div className={`step ${otpSent ? 'active' : ''}`}>OTP</div>
        </div>
        {success ? (
          <>
            <h2>Email Verified!</h2>
            <p>Your new email address has been verified and updated successfully.</p>
          </>
        ) : !otpSent ? (
          <>
            <h2>Verify New Email</h2>
            <p>We’ll send a one‑time code to your new email address to confirm the change.</p>
            <div className="input-group">
              <img src={emailIcon} alt="" className="icon" />
              <input
                type="email"
                value={email}
                disabled
                aria-label="Email Address"
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button
              className="btn-primary"
              onClick={() => handleSendOtp(false)}
              disabled={isSending || !email}
            >
              {isSending ? 'Sending…' : 'Send OTP'}
            </button>
          </>
        ) : (
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
                onClick={() => handleSendOtp(true)}
                disabled={isSending || isVerifying || resendTimer > 0}
              >
                {isSending ? 'Resending...' : (resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

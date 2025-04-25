import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import envelopIcon from '../../../assets/envelop.svg'; // Changed from email.svg
import './AdminLogin.css';

// TODO: replace with real API call
async function sendAdminOtp(email, isResend = false) {
  console.log(`${isResend ? 'Resending' : 'Sending'} admin OTP to`, email);
  return new Promise(res => setTimeout(res, 800));
}

// TODO: replace with real API call
async function verifyAdminOtp(email, code) {
  console.log('Verifying admin OTP', code, 'for', email);
  // simulate 123456 as valid code - Temporarily bypassed
  // if (code !== '123456') throw new Error('Invalid OTP');
  return new Promise(res => setTimeout(res, 800));
}

export default function AdminVerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [failCount, setFailCount] = useState(0);

  // Resend timer effect
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const startResendTimer = () => setResendTimer(60);

  const handleSendOtp = async (isResend = false) => {
    if (!isResend) {
      // basic email format
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      // // pre-check admin - Temporarily disabled
      // setError('');
      // const isAdmin = await checkAdminEmail(email);
      // if (!isAdmin) {
      //   setError('This email is not registered as an admin.');
      //   setTimeout(() => navigate('/'), 2000);
      //   return;
      // }
    }

    setError('');
    setIsSending(true);
    try {
      await sendAdminOtp(email, isResend);
      setOtpSent(true);
      startResendTimer();
      setOtp('');
    } catch {
      setError(`Failed to ${isResend ? 'resend' : 'send'} OTP. Please try again.`);
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
      await verifyAdminOtp(email, otp);
      navigate('/admin/dashboard');
    } catch {
      const fails = failCount + 1;
      setFailCount(fails);
      setError('Invalid OTP. Please try again.');
      if (fails >= 5) {
        setError('Too many failed attempts. Returning to login.');
        setTimeout(() => navigate('/'), 2000);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearEmail = () => {
    setEmail('');
    setError('');
  };

  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
    setResendTimer(0);
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        {/* 2-step progress bar */}
        <div className="progress">
          <div className={`step ${!otpSent ? 'active' : ''}`}>Email</div>
          <div className="divider" />
          <div className={`step ${otpSent ? 'active' : ''}`}>OTP</div>
        </div>

        {/* Step titles */}
        {!otpSent ? (
          <>
            <h2>Admin Login</h2>
            <p>Enter your registered admin email to receive a code.</p>

            {/* Email input */}
            <div className="input-group">
              <img src={envelopIcon} alt="" className="icon" /> {/* Changed from emailIcon */}
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSending}
              />
            </div>
            {error && <div className="error">{error}</div>}

            {/* Actions */}
            <button
              className="btn-primary"
              onClick={() => handleSendOtp(false)}
              disabled={!email || isSending}
            >
              {isSending ? 'Sending…' : 'Send OTP'}
            </button>
            <button
              className="btn-link"
              onClick={handleClearEmail}
              disabled={isSending}
            >
              Clear Email
            </button>
          </>
        ) : (
          <>
            <h2>Step 2: Enter OTP</h2>
            <p>Enter the 6-digit code sent to <strong>{email}</strong>.</p>

            {/* OTP input */}
            <div className="input-group">
              <input
                type="text"
                maxLength="6"
                inputMode="numeric"
                pattern="\d{6}"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={isVerifying}
              />
            </div>
            {error && <div className="error">{error}</div>}

            {/* Actions */}
            <button
              className="btn-primary"
              onClick={handleVerifyOtp}
              disabled={isVerifying || otp.length < 6}
            >
              {isVerifying ? 'Verifying…' : 'Verify & Login'}
            </button>

            <div className="verify-actions">
              <button
                className="btn-link"
                onClick={() => handleSendOtp(true)}
                disabled={resendTimer > 0}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
              <button
                className="btn-link"
                onClick={handleChangeEmail}
                disabled={isVerifying}
              >
                Change Email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

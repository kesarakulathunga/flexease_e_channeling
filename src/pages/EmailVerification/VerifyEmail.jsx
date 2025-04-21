import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emailIcon from '../../assets/envelop.svg'; 
import './VerifyEmail.css';

export default function VerifyEmail() {

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(''); // State for OTP input
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // State for OTP verification
  const [otpSent, setOtpSent] = useState(false); // State to track if OTP has been sent
  const [resendTimer, setResendTimer] = useState(0); // Timer for resend button

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

  const handleSendOtp = async (isResend = false) => {
    if (!isResend) {
      // basic email format check only on initial send
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }
    setError('');
    setIsSending(true);
    try {
      // TODO: call your backend: await otpService.send(email);
      console.log(`Simulating OTP ${isResend ? 'resend' : 'send'} to ${email}`);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOtpSent(true); // Mark OTP as sent to show OTP input
      startResendTimer(); // Start the resend timer
      if (!isResend) {
        // Don't navigate, just show OTP section
        console.log("OTP Sent, showing OTP input section.");
      } else {
         console.log("OTP Resent.");
      }
      // Clear previous OTP input on send/resend
      setOtp('');

    } catch (err) {
      console.error("OTP Send Error:", err);
      setError(`Failed to ${isResend ? 'resend' : 'send'} OTP. Please try again.`);
      setOtpSent(false); // Stay on email input if initial send fails
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { // Basic OTP length check (adjust if needed)
        setError('Please enter a valid 6-digit OTP.');
        return;
    }
    setError('');
    setIsVerifying(true);
    try {
        // TODO: call your backend: await otpService.verify(email, otp);
        console.log(`Simulating OTP verification for ${email} with OTP ${otp}`);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // On success, navigate to the next step (Details page)
        console.log("OTP Verified Successfully!");
        navigate('/verify/details', { state: { email } }); // Navigate to details page

    } catch (err) {
        console.error("OTP Verification Error:", err);
        setError('Invalid OTP or verification failed. Please try again.');
    } finally {
        setIsVerifying(false);
    }
  };

  const handleBackToEmail = () => {
    setOtpSent(false);
    setEmail(''); // Optionally clear email
    setOtp('');
    setError('');
    setResendTimer(0); // Reset timer
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        {/* Progress indicator */}
        <div className="progress">
          <div className={`step ${!otpSent ? 'active' : ''}`}>Email</div>
          <div className="divider" />
          <div className={`step ${otpSent ? 'active' : ''}`}>OTP</div>
          <div className="divider" />
          <div className="step">Details</div>
        </div>

        {!otpSent ? (
          <>
            {/* Header */}
            <h2>Step 1: Verify Your Email</h2>
            <p>We’ll send a one‑time code to confirm your address.</p>

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
              onClick={() => handleSendOtp(false)}
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
        ) : (
          <>
            {/* Header */}
            <h2>Step 2: Enter OTP</h2>
            <p>Enter the 6-digit code sent to <strong>{email}</strong>.</p>

            {/* OTP input */}
            <div className="input-group">
              {/* Consider adding an icon for OTP */}
              <input
                type="text" // Use text for easier input on mobile, consider "tel" or "number" with pattern
                inputMode="numeric" // Hint for numeric keyboard
                pattern="\d{6}" // Pattern for validation (optional)
                maxLength="6" // Limit input length
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Allow only digits
                disabled={isVerifying || isSending} // Disable while verifying or resending
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
                    onClick={() => handleSendOtp(true)} // Call handleSendOtp with resend flag
                    disabled={isSending || isVerifying || resendTimer > 0}
                 >
                    {isSending ? 'Resending...' : (resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP')}
                 </button>
                 {/* Moved Change Email button here */}
                 <button
                    className="btn-link"
                    onClick={handleBackToEmail}
                    disabled={isSending || isVerifying}
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

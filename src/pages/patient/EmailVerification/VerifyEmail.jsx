import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import emailIcon from '../../../assets/envelop.svg';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(''); // State for OTP input
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // State for OTP verification
  const [otpSent, setOtpSent] = useState(false); // State to track if OTP has been sent
  const [resendTimer, setResendTimer] = useState(0); // Timer for resend button
  const [step, setStep] = useState('otp'); // 'otp', 'select', 'new'
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({ name: '', age: '', phone: '' });

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
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setError('');
    setIsVerifying(true);
    try {
      // TODO: call your backend: await otpService.verify(email, otp);
      console.log(`Simulating OTP verification for ${email} with OTP ${otp}`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // After OTP verification, check for existing accounts
      // TODO: Replace with real API call:
      // const res = await fetch(`/api/patient/accounts?email=${email}`);
      // const data = await res.json();
      const data = [];
      // Simulate: [] for no accounts, or [{id, name, age}] for existing
      if (data.length > 0) {
        setAccounts(data);
        setStep('select');
      } else {
        setStep('new');
      }
    } catch (err) {
      setError('Invalid OTP or verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectAccount = async (accountId) => {
    // TODO: Optionally notify backend of account selection
    // await fetch('/api/patient/select-account', { method: 'POST', body: JSON.stringify({ accountId }) });
    navigate('/dashboard'); // Or appointment page
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    // Validation
    const nameParts = newAccount.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setError('Full name must have at least two parts.');
      return;
    }
    const ageNum = parseInt(newAccount.age, 10);
    if (!(ageNum >= 6 && ageNum <= 100)) {
      setError('Age must be between 6 and 100 years.');
      return;
    }
    // Phone validation: must be 9 digits, only numbers
    const phone = newAccount.phone.replace(/\D/g, '');
    if (phone.length !== 9) {
      setError('Phone number must have exactly 9 digits (excluding +94).');
      return;
    }
    setError('');
    // TODO: Call backend to create new account
    // await fetch('/api/patient/create', { method: 'POST', body: JSON.stringify({ ...newAccount, email }) });
    navigate('/dashboard'); // Or appointment page
  };

  const handleBackToEmail = () => {
    setOtpSent(false);
    setEmail(''); // Optionally clear email
    setOtp('');
    setError('');
    setResendTimer(0); // Reset timer
  };

  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

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

        {step === 'otp' && !otpSent ? (
          <>
            {/* Header */}
            <h2>Step 1: Verify Your Email</h2>
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
        ) : step === 'otp' && otpSent ? (
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
        ) : step === 'select' ? (
          <>
            <h2>Select Account</h2>
            <p>You have the following accounts under <strong>{email}</strong>:</p>
            <ul>
              {accounts.map(acc => (
                <li key={acc.id}>
                  <button onClick={() => handleSelectAccount(acc.id)}>
                    {acc.name} (Age: {acc.age})
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setStep('new')}>Create New Account</button>
          </>
        ) : step === 'new' ? (
          <>
            <h2>Create New Account</h2>
            {error && <div className="error">{error}</div>}
            <form className="create-account-form" onSubmit={handleCreateAccount}>
              <input
                type="text"
                placeholder="Full Name"
                value={newAccount.name}
                onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                required
              />
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Age (years)"
                  value={newAccount.age}
                  onChange={e => setNewAccount({ ...newAccount, age: e.target.value.replace(/\D/g, '') })}
                  required
                  style={{ width: '100%' }}
                />
                {error && error.toLowerCase().includes('age') && (
                  <div className="error" style={{ position: 'absolute', left: 0, top: '100%' }}>
                    {error}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  background: '#f0f0f0',
                  border: '1px solid #cce0f7',
                  borderRadius: '4px 0 0 4px',
                  padding: '0.75rem 0.75rem',
                  fontSize: '1rem',
                  color: '#555',
                  borderRight: 'none'
                }}>+94</span>
                <input
                  type="text"
                  placeholder="Phone (9 digits)"
                  value={newAccount.phone}
                  onChange={e => {
                    // Only allow numbers, max 9 digits
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setNewAccount({ ...newAccount, phone: val });
                  }}
                  required
                  maxLength={9}
                  style={{
                    borderRadius: '0 4px 4px 0',
                    borderLeft: 'none',
                    flex: 1
                  }}
                />
              </div>
              <button type="submit">Create Account</button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}

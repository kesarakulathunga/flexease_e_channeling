import React, { useState } from 'react';
import Navbar from '../../components/NavBar/Navbar'; // Import the Navbar

import './VerifyEmail.css';

const EmailVerification = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [tries, setTries] = useState(0);

  const sendOtp = () => {
    if (!email) return alert('Enter a valid email');
    setStep(2);
    // TODO: call backend /otp/send
  };

  const verifyOtp = () => {
    if (otp === '1234') {
      // success path
      window.location.href = '/patient-details';
    } else {
      setTries(t => t + 1);
      alert('Incorrect OTP');
      if (tries + 1 >= 5) window.location.href = '/';
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <main className="verify-main">
        {step === 1 ? (
          <>
            <h2>Enter Your Email</h2>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button className="btn" onClick={sendOtp}>
              Send OTP
            </button>
          </>
        ) : (
          <>
            <h2>Enter OTP</h2>
            <input
              type="text"
              className="input-field"
              placeholder="4‑digit code"
              value={otp}
              onChange={e => setOtp(e.target.value)}
            />
            <div className="otp-buttons">
              <button className="btn" onClick={verifyOtp}>
                Confirm
              </button>
              <button
                className="btn secondary"
                onClick={() => setStep(1)}
              >
                Change Email
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default EmailVerification;

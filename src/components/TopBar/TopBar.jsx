import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/Flexeaselogo.png';
import phoneIcon from '../../assets/phone.svg'; // Corrected path
import './TopBar.css';

export default function TopBar({ mobileNumber: propMobileNumber }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNumber, setMobileNumber] = useState(propMobileNumber || '123‑456‑7890');

  // Load mobile number from localStorage on component mount
  useEffect(() => {
    const storedNumber = localStorage.getItem('contactMobileNumber');
    if (storedNumber) {
      setMobileNumber(storedNumber);
    }

    // Listen for mobile number updates
    const handleMobileNumberUpdate = (event) => {
      const { mobileNumber: updatedNumber } = event.detail;
      setMobileNumber(updatedNumber);
    };

    // Add event listener
    window.addEventListener('mobileNumberUpdated', handleMobileNumberUpdate);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('mobileNumberUpdated', handleMobileNumberUpdate);
    };
  }, [propMobileNumber]);

  const handleLogoClick = () => {
    if (location.pathname === '/') window.location.reload();
    else navigate('/');
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <img
          src={logo}
          alt="Flexease Logo"
          className="topbar__logo"
          onClick={handleLogoClick} // Move click handler to logo
        />
      </div>
      <div className="topbar__center">
        <span className="topbar__title" style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '0.03em', fontFamily: 'Montserrat, Verdana, Geneva, Tahoma, sans-serif' }}>
          Welcome to Flexease Physiotherapy Center
        </span>
      </div>
      <div className="topbar__right">
        <a
          href={`tel:${mobileNumber.replace(/\D/g, '')}`}
          className="topbar__contact"
        >
          <img src={phoneIcon} alt="Call us" className="topbar__icon" />
          <span className="topbar__number">{mobileNumber}</span>
        </a>
      </div>
    </header>
  );
}

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/Flexeaselogo.png';
import phoneIcon from '../../assets/phone.svg'; // Corrected path
import './TopBar.css';

export default function TopBar({ mobileNumber = '123‑456‑7890' }) {
  const navigate = useNavigate();
  const location = useLocation();

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

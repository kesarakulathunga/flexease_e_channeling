import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/Flexeaselogo.png'; // your logo path
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    if (location.pathname === '/') window.location.reload();
    else navigate('/');
  };

  const handleAdminLoginClick = () => {
    navigate('/admin/login'); // Navigate to admin login page
  };

  return (
    <header className="navbar">
      {/* Logo on the left */}
      <div className="navbar__logo" onClick={handleLogoClick}>
        <img src={logo} alt="Flexease Logo" />
      </div>

      {/* Centered welcome text */}
      <div className="navbar__title">
        Welcome to Flexease Physiotherapy Center
      </div>

      {/* Admin Login Button */}
      <nav className="navbar__menu">
        <button className="navbar__admin-login-button" onClick={handleAdminLoginClick}>Admin Login</button>
      </nav>
    </header>
  );
}

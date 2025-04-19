// src/components/Navbar/Navbar.jsx
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logoSrc from '../../assets/logo.png'; // your logo path
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.location.reload();
    } else {
      navigate('/');
    }
  };

  return (
    <header className="navbar">
      {/* Logo on the left */}
      <div className="navbar__logo" onClick={handleLogoClick}>
        <img
          src={logoSrc}
          alt="Flexease Physio Logo"
          className="navbar__logo-image"
        />
      </div>

      {/* Centered welcome text */}
      <div className="navbar__title">
        Welcome to Flexease Physio Channeling Center
      </div>

      {/* Admin Login button on the right */}
      <nav className="navbar__menu">
        <Link to="/admin" className="navbar__admin-button">
          Admin Login
        </Link>
      </nav>
    </header>
  );
};

export default Navbar;

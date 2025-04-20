import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/Flexeaselogo.png'; // your logo path
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    if (location.pathname === '/') window.location.reload();
    else navigate('/');
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

      {/* Admin Login button on the right */}
      <nav className="navbar__menu">
        <Link to="/admin" className="navbar__admin-button">
          Admin Login
        </Link>
      </nav>
    </header>
  );
}

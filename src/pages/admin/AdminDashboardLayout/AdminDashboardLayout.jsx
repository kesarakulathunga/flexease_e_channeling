import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../assets/Flexeaselogo.png';
import phoneIcon from '../../../assets/phone.svg';
import slotsIcon      from '../../../assets/calendar.svg';
import reportsIcon    from '../../../assets/file-text.svg';
import viewAdminsIcon from '../../../assets/users.svg';
import deleteIcon     from '../../../assets/trash.svg';
import logoutIcon     from '../../../assets/log-out.svg';
import homeIcon       from '../../../assets/home.svg';
import settingsIcon   from '../../../assets/settings.svg';
import './AdminDashboardLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNumber, setMobileNumber] = useState('123-456-7890');

  // Load mobile number from localStorage on component mount
  useEffect(() => {
    // Function to load the mobile number from localStorage
    const loadMobileNumber = () => {
      const storedNumber = localStorage.getItem('contactMobileNumber');
      if (storedNumber) {
        console.log('AdminDashboardLayout loading mobile number from localStorage:', storedNumber);
        setMobileNumber(storedNumber);
      }
    };

    // Initial load
    loadMobileNumber();

    // Listen for mobile number updates
    const handleMobileNumberUpdate = (event) => {
      const { mobileNumber: updatedNumber } = event.detail;
      console.log('AdminDashboardLayout received mobileNumberUpdated event with number:', updatedNumber);
      setMobileNumber(updatedNumber);
    };

    // Add event listener
    window.addEventListener('mobileNumberUpdated', handleMobileNumberUpdate);

    // Also listen for storage events (in case localStorage is updated in another tab/window)
    const handleStorageChange = (e) => {
      if (e.key === 'contactMobileNumber') {
        console.log('AdminDashboardLayout detected localStorage change:', e.newValue);
        setMobileNumber(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('mobileNumberUpdated', handleMobileNumberUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogoClick = () => {
    if (location.pathname === '/') window.location.reload();
    else navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* TopBar */}
      <header className="topbar">
        <div className="topbar__left">
          <img
            src={logo}
            alt="Flexease Logo"
            className="topbar__logo"
            onClick={handleLogoClick}
          />
        </div>
        <div className="topbar__center">
          <span className="topbar__title" style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '0.03em', fontFamily: 'Montserrat, Verdana, Geneva, Tahoma, sans-serif' }}>
            Welcome to Flexease Physiotherapy Center
          </span>
        </div>
        <div className="topbar__right">
          <a href={`tel:${mobileNumber.replace(/\D/g, '')}`} className="topbar__contact">
            <img src={phoneIcon} alt="Call us" className="topbar__icon" />
            <span className="topbar__number">{mobileNumber}</span>
          </a>
        </div>
      </header>      {/* Sidebar */}
      <aside className="admin-sidebar">        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''} end>
          <img src={homeIcon} alt="Home" />
          Home
        </NavLink>

        <NavLink to="/admin/dashboard/update-slots" className={({ isActive }) => isActive ? 'active' : ''}>
          <img src={slotsIcon} alt="Update Slots" />
          Update Slots
        </NavLink>

        <NavLink to="/admin/dashboard/view-reports" className={({ isActive }) => isActive ? 'active' : ''}>
          <img src={reportsIcon} alt="View Reports" />
          View Reports
        </NavLink>

        <NavLink to="/admin/dashboard/view-admins" className={({ isActive }) => isActive ? 'active' : ''}>
          <img src={viewAdminsIcon} alt="View Admins" />
          View Admins
        </NavLink>

        <NavLink to="/admin/dashboard/delete-profile" className={({ isActive }) => isActive ? 'active' : ''}>
          <img src={deleteIcon} alt="Delete Profile" />
          Delete Profile
        </NavLink>

        <NavLink to="/admin/dashboard/settings" className={({ isActive }) => isActive ? 'active' : ''}>
          <img src={settingsIcon} alt="Settings" />
          Settings
        </NavLink>

        <NavLink to="/admin/dashboard/logout" className={({ isActive }) => isActive ? 'active' : ''}>
          <img src={logoutIcon} alt="Logout" />
          Logout
        </NavLink>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

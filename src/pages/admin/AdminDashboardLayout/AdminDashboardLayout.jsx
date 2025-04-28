import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../assets/Flexeaselogo.png';
import phoneIcon from '../../../assets/phone.svg';
import slotsIcon      from '../../../assets/calendar.svg';
import reportsIcon    from '../../../assets/file-text.svg';
import viewAdminsIcon from '../../../assets/users.svg';
import deleteIcon     from '../../../assets/trash.svg';
import logoutIcon     from '../../../assets/log-out.svg';
import homeIcon     from '../../../assets/home.svg';
import './AdminDashboardLayout.css';

export default function AdminLayout({ mobileNumber = '123-456-7890' }) {
  const navigate = useNavigate();
  const location = useLocation();

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
          <a
            href={`tel:${mobileNumber.replace(/\D/g, '')}`}
            className="topbar__contact"
          >
            <img src={phoneIcon} alt="Call us" className="topbar__icon" />
            <span className="topbar__number">{mobileNumber}</span>
          </a>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <nav className="admin-sidebar__nav">
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) =>
              `admin-sidebar__link${isActive ? ' active' : ''}`
            }
          >
            <img src={homeIcon} className="admin-sidebar__icon" alt="" />
            Home
          </NavLink>
          <NavLink to="/admin/dashboard/view-admins"    className="admin-sidebar__link"> 
            <img src={viewAdminsIcon} className="admin-sidebar__icon" alt="" />
            View Admins
          </NavLink>
          <NavLink to="/admin/dashboard/update-slots"   className="admin-sidebar__link">
            <img src={slotsIcon}      className="admin-sidebar__icon" alt="" />
            Update Time Slots
          </NavLink>
          <NavLink to="/admin/dashboard/view-reports"   className="admin-sidebar__link">
            <img src={reportsIcon}    className="admin-sidebar__icon" alt="" />
            View Reports
          </NavLink>
          <NavLink to="/admin/dashboard/delete-profile" className="admin-sidebar__link">
            <img src={deleteIcon}     className="admin-sidebar__icon" alt="" />
            Delete Profile
          </NavLink>
          <NavLink to="/admin/dashboard/logout"         className="admin-sidebar__link">
            <img src={logoutIcon}     className="admin-sidebar__icon" alt="" />
            Log Out
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

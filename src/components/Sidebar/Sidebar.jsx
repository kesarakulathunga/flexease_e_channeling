import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

// Import icons
import homeIcon from '../../assets/home.svg';
import makeAppointmentIcon from '../../assets/calendar-plus.svg';
import uploadReportIcon from '../../assets/upload-report.svg';
import viewAppointmentsIcon from '../../assets/calendar-check.svg';
import editDataIcon from '../../assets/edit.svg';
import deleteProfileIcon from '../../assets/trash.svg';
import logoutIcon from '../../assets/log-out.svg';

export default function Sidebar({ name }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h3>Hi, {name}</h3>
      </div>
      <nav className="sidebar__nav">
        <NavLink to="/dashboard" end className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}>
          <img src={homeIcon} alt="Home" className="sidebar__link-icon" />
          <span className="sidebar__link-text">Home</span>
        </NavLink>
        <NavLink to="/dashboard/make-appointment" className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}>
          <img src={makeAppointmentIcon} alt="Make Appointment" className="sidebar__link-icon" />
          <span className="sidebar__link-text">Make Appointment</span>
        </NavLink>
        <NavLink to="/dashboard/upload-report" className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}>
          <img src={uploadReportIcon} alt="Upload Report" className="sidebar__link-icon" />
          <span className="sidebar__link-text">Upload Report</span>
        </NavLink>
        <NavLink to="/dashboard/appointments" className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}>
          <img src={viewAppointmentsIcon} alt="View Appointments" className="sidebar__link-icon" />
          <span className="sidebar__link-text">View Appointments</span>
        </NavLink>
        <NavLink to="/dashboard/edit-profile" className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}>
          <img src={editDataIcon} alt="Edit Your Data" className="sidebar__link-icon" />
          <span className="sidebar__link-text">Edit Your Data</span>
        </NavLink>
        <NavLink to="/dashboard/delete-profile" className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}>
          <img src={deleteProfileIcon} alt="Delete Profile" className="sidebar__link-icon" />
          <span className="sidebar__link-text">Delete Profile</span>
        </NavLink>
        <NavLink to="/dashboard/logout" className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}>
          <img src={logoutIcon} alt="Log Out" className="sidebar__link-icon" />
          <span className="sidebar__link-text">Log Out</span>
        </NavLink>
      </nav>
    </aside>
  );
}

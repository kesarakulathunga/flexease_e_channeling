import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({ name }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h3>Hi, {name}</h3>
      </div>
      <nav className="sidebar__nav">
        <NavLink to="/dashboard"    className="sidebar__link" activeclassname="active">Home</NavLink>
        <NavLink to="/verify"       className="sidebar__link" activeclassname="active">Make Appointment</NavLink>
        <NavLink to="/upload-report"className="sidebar__link" activeclassname="active">Upload Report</NavLink>
        <NavLink to="/appointments" className="sidebar__link" activeclassname="active">View Appointments</NavLink>
        <NavLink to="/patient-details" className="sidebar__link" activeclassname="active">Edit Your Data</NavLink>
        <NavLink to="/delete-profile"   className="sidebar__link" activeclassname="active">Delete Profile</NavLink>
        <NavLink to="/logout"        className="sidebar__link" activeclassname="active">Log Out</NavLink>
      </nav>    
    </aside>
);
}

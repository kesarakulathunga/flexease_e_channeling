// src/pages/admin/AdminSidebar/AdminSidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
// Corrected icon paths based on workspace structure
import addAdminIcon   from '../../../assets/user-plus.svg';
import slotsIcon      from '../../../assets/calendar.svg';
import reportsIcon    from '../../../assets/file-text.svg';
import deleteIcon     from '../../../assets/trash.svg';
import logoutIcon     from '../../../assets/log-out.svg';
import './AdminSidebar.css';

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar__nav">
        <NavLink to="add-admin"     className="admin-sidebar__link"> 
          <img src={addAdminIcon} className="admin-sidebar__icon" alt="" />
          Add New Admin
        </NavLink>
        <NavLink to="update-slots"  className="admin-sidebar__link">
          <img src={slotsIcon} className="admin-sidebar__icon" alt="" />
          Update Time Slots
        </NavLink>
        <NavLink to="view-reports"  className="admin-sidebar__link">
          <img src={reportsIcon} className="admin-sidebar__icon" alt="" />
          View Reports
        </NavLink>
        <NavLink to="delete-profile" className="admin-sidebar__link">
          <img src={deleteIcon} className="admin-sidebar__icon" alt="" />
          Delete Profile
        </NavLink>
        <NavLink to="logout"        className="admin-sidebar__link">
          <img src={logoutIcon} className="admin-sidebar__icon" alt="" />
          Log Out
        </NavLink>
      </nav>
    </aside>
  );
}

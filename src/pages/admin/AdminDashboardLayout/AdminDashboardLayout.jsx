// src/pages/admin/AdminDashboardLayout/AdminDashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
// TopBar lives under components/TopBar
import TopBar from '../../../components/TopBar/TopBar';
// Sidebar is right next door under pages/admin/AdminSidebar
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import './AdminDashboardLayout.css';

export default function AdminDashboardLayout() {
  return (
    <div className="admin-dashboard-layout">
      <TopBar />
      <AdminSidebar />
      <main className="admin-dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

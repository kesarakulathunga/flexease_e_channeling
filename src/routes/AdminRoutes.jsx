import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '../pages/admin/Login/AdminLogin';
import AdminDashboardLayout from '../pages/admin/AdminDashboardLayout/AdminDashboardLayout';

// Import all admin dashboard components
import ViewAdmins from '../pages/admin/admin-dashboard/ViewAdmins';
import UpdateSlots from '../pages/admin/admin-dashboard/UpdateSlots';
import ViewReports from '../pages/admin/admin-dashboard/ViewReports';
import DeleteProfile from '../pages/admin/admin-dashboard/DeleteProfile';
import Logout from '../pages/admin/admin-dashboard/Logout';
import DummyPage from '../pages/admin/admin-dashboard/DummyPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="dashboard/*" element={<AdminDashboardLayout />}>
        {/* Default route redirects to dummy page */}
        <Route index element={<Navigate to="dummy-page" replace />} />
        
        {/* Add routes matching sidebar navigation */}
        <Route path="view-admins" element={<ViewAdmins />} />
        <Route path="update-slots" element={<UpdateSlots />} />
        <Route path="view-reports" element={<ViewReports />} />
        <Route path="delete-profile" element={<DeleteProfile />} />
        <Route path="logout" element={<Logout />} />
        <Route path="dummy-page" element={<DummyPage />} />
      </Route>
    </Routes>
  );
}
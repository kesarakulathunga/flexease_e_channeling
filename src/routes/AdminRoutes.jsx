import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLogin from '../pages/admin/Login/AdminLogin';
import AdminDashboardLayout from '../pages/admin/AdminDashboardLayout/AdminDashboardLayout';
import ViewAdmins from '../pages/admin/admin-dashboard/ViewAdmins';
import UpdateSlots from '../pages/admin/admin-dashboard/UpdateSlots';
import ViewReports from '../pages/admin/admin-dashboard/ViewReports';
import DeleteProfile from '../pages/admin/admin-dashboard/DeleteProfile';
import Settings from '../pages/admin/admin-dashboard/Settings';
import Logout from '../pages/admin/admin-dashboard/Logout';
import AdminHome from '../pages/admin/admin-dashboard/AdminHome';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
        {/* Protected admin routes */}
      <Route element={<ProtectedRoute requireAdmin={true} requiredRole="ADMIN" redirectTo="/admin/login" />}>
        <Route path="dashboard/*" element={<AdminDashboardLayout />}>
          {/* Default route redirects to admin home */}
          <Route index element={<AdminHome />} />
          {/* Add routes matching sidebar navigation */}          <Route path="view-admins" element={<ViewAdmins />} />
          <Route path="update-slots" element={<UpdateSlots />} />
          <Route path="view-reports" element={<ViewReports />} />
          <Route path="delete-profile" element={<DeleteProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="logout" element={<Logout />} />
        </Route>
      </Route>

      {/* Catch-all admin route */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
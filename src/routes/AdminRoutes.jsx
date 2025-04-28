import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '../pages/admin/Login/AdminLogin';
import AdminDashboardLayout from '../pages/admin/AdminDashboardLayout/AdminDashboardLayout';
import ViewAdmins from '../pages/admin/admin-dashboard/ViewAdmins';
import UpdateSlots from '../pages/admin/admin-dashboard/UpdateSlots';
import ViewReports from '../pages/admin/admin-dashboard/ViewReports';
import DeleteProfile from '../pages/admin/admin-dashboard/DeleteProfile';
import Logout from '../pages/admin/admin-dashboard/Logout';
import AdminHome from '../pages/admin/admin-dashboard/AdminHome';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="dashboard/*" element={<AdminDashboardLayout />}>
        {/* Default route redirects to admin home */}
        <Route index element={<AdminHome />} />
        {/* Add routes matching sidebar navigation */}
        <Route path="view-admins" element={<ViewAdmins />} />
        <Route path="update-slots" element={<UpdateSlots />} />
        <Route path="view-reports" element={<ViewReports />} />
        <Route path="delete-profile" element={<DeleteProfile />} />
        <Route path="logout" element={<Logout />} />
      </Route>
    </Routes>
  );
}
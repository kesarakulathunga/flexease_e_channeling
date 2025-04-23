import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboardLayout from '../pages/admin/AdminDashboardLayout/AdminDashboardLayout';

export default function withAdminLayout(PageComponent) {
  return function Wrapped(props) {
    const isVerified = Boolean(localStorage.getItem('isAdminVerified'));
    if (!isVerified) return <Navigate to="/admin/login" replace />;
    return (
      <AdminDashboardLayout>
        <PageComponent {...props} />
      </AdminDashboardLayout>
    );
  };
}
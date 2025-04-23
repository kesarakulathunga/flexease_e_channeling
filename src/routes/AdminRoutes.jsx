import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLogin from '../pages/admin/Login/AdminLogin';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
    </Routes>
  );
}
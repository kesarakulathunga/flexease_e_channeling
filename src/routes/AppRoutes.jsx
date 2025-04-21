import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from '../pages/home/HomePage';
import VerifyEmail from '../pages/EmailVerification/VerifyEmail';
// …



export default function AppRoutes() {
  return (
    <Routes>
      {/* Only Home for now */}
      <Route path="/" element={<HomePage />} />
      <Route path="/verify" element={<VerifyEmail />} />
    </Routes>
  );
}

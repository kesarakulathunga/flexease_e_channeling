import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from '../pages/home/HomePage';
import VerifyEmail from '../pages/EmailVerification/VerifyEmail';
// …
import ProfileSelection from '../pages/verify-details/ProfileSelection';
import PatientDetailsForm from '../pages/patient-details/PatientDetailsForm';
import Dashboard from '../pages/dashboard/Dashboard';

// … inside <Routes> …




export default function AppRoutes() {
  return (
    <Routes>
      {/* Only Home for now */}
      <Route path="/" element={<HomePage />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/verify/details" element={<ProfileSelection />} />
      <Route path="/patient-details" element={<PatientDetailsForm />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

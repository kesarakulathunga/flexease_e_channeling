import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/home/HomePage';
// …other imports…

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* …other routes… */}
    </Routes>
  );
}

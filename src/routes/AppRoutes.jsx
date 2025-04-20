import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from '../pages/home/HomePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Only Home for now */}
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

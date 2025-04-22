import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import Sidebar from '../../components/Sidebar/Sidebar'; // Corrected path
import TopBar from '../../components/TopBar/TopBar'; // Import TopBar
import './DashboardLayout.css';

export default function DashboardLayout({ name }) { // Assuming name is passed down or fetched
  const userName = name || 'User'; // Use passed name or default

  return (
    <div className="dashboard-layout">
      <TopBar />
      <Sidebar name={userName} />
      <main className="dashboard-content">
        <Outlet /> {/* Render nested routes here */}
      </main>
    </div>
  );
}

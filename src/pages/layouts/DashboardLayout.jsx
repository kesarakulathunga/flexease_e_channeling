import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar'; // Corrected path
import './DashboardLayout.css';

export default function DashboardLayout({ children, name }) {
  return (
    <div className="dashboard-layout">
      <Sidebar name={name} />
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}

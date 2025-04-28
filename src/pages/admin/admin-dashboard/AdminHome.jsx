import React from 'react';
import './AdminHome.css';

export default function AdminHome() {
  return (
    <div className="dashboard-home">
      <h2>Admin Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>--</h3>
          <p>Total Patients</p>
        </div>
        <div className="stat-card">
          <h3>--</h3>
          <p>Total Admins</p>
        </div>
        <div className="stat-card">
          <h3>--</h3>
          <p>Today's Appointments</p>
        </div>
        <div className="stat-card">
          <h3>--</h3>
          <p>Pending Reports</p>
        </div>
      </div>
      <p style={{marginTop: '2rem', color: '#888', textAlign: 'center'}}>Dashboard stats are currently unavailable.</p>
    </div>
  );
}

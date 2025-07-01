import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import Sidebar from '../../../components/Sidebar/Sidebar'; // Corrected path
import TopBar from '../../../components/TopBar/TopBar'; // Corrected path
import './DashboardLayout.css';

export default function DashboardLayout({ name }) { // Assuming name is passed down or fetched
  const userName = name || 'User'; // Use passed name or default
  const [mobileNumber, setMobileNumber] = useState('');

  // Load mobile number from localStorage on component mount
  useEffect(() => {
    const storedNumber = localStorage.getItem('contactMobileNumber');
    if (storedNumber) {
      setMobileNumber(storedNumber);
    }

    // Listen for mobile number updates
    const handleMobileNumberUpdate = (event) => {
      const { mobileNumber: updatedNumber } = event.detail;
      setMobileNumber(updatedNumber);
    };

    // Add event listener
    window.addEventListener('mobileNumberUpdated', handleMobileNumberUpdate);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('mobileNumberUpdated', handleMobileNumberUpdate);
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <TopBar mobileNumber={mobileNumber} />
      <Sidebar name={userName} />
      <main className="dashboard-content">
        <Outlet /> {/* Render nested routes here */}
      </main>
    </div>
  );
}

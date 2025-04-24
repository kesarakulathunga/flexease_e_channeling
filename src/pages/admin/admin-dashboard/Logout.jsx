import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Logout.css'; // Assuming you have or will create this CSS file

// Add default export
export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear user session/token here (e.g., localStorage.removeItem('adminToken'))
    console.log("Admin logging out...");
    // Redirect to login page after logout
    navigate('/admin/login');
  }, [navigate]);

  return (
    <div className="logout-page">
      <h2>Logging Out...</h2>
      <p>You are being redirected to the login page.</p>
    </div>
  );
}
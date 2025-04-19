// src/pages/home/HomePage.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';

import Navbar from '../../components/NavBar/Navbar'; // Import the Navbar

import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleMakeAppointment = () => {
    try {
      navigate('/verify');
    } catch (error) {
      console.error('Navigation error to Verify page:', error);
    }
  };

  const handleViewProfile = () => {
    try {
      navigate('/dashboard');
    } catch (error) {
      console.error('Navigation error to Dashboard:', error);
    }
  };

  return (
    <div className="page-container">
      {/* Use the Navbar component */}
      <Navbar />

      <div className="home-container">
        <main className="home-main">
          <h2>Welcome to Flexease Physio Channeling Center</h2>
          <div className="button-group">
            <button className="btn" onClick={handleMakeAppointment}>
              Make Appointment
            </button>
            <button className="btn" onClick={handleViewProfile}>
              View Profile
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;

import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="page-container">
      {/* 1. Always render your Navbar */}
      <Navbar />

      {/* 2. Placeholder content so you know it's the Home page */}
      <div className="home-placeholder">
        <p>Home Page Content Goes Here</p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AppointmentReceipt from '../../../components/AppointmentReceipt';
import './AppointmentReceiptPage.css';

export default function AppointmentReceiptPage() {
  const location = useLocation();
  const { currentProfile } = useAuth();
  const [appointmentData, setAppointmentData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get appointment data from URL params, location state, or localStorage
    const getAppointmentData = () => {
      // First try to get from URL parameters
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.has('date') && searchParams.has('time')) {
        return {
          date: searchParams.get('date'),
          time: searchParams.get('time'),
          paymentMethod: searchParams.get('payment') || 'later'
        };
      }

      // Then try location state
      if (location.state && location.state.appointment) {
        return location.state.appointment;
      }

      // Finally try localStorage as fallback
      const storedData = localStorage.getItem('lastAppointment');
      if (storedData) {
        try {
          return JSON.parse(storedData);
        } catch (err) {
          console.error('Error parsing stored appointment data:', err);
          return null;
        }
      }
      return null;
    };

    const data = getAppointmentData();

    if (data) {
      // Add patient info from current profile
      const appointmentWithPatientInfo = {
        ...data,
        patientName: currentProfile?.name || 'Patient',
        patientEmail: currentProfile?.email || 'patient@example.com'
      };

      setAppointmentData(appointmentWithPatientInfo);
    } else {
      setError('No appointment data found. Please book an appointment first.');
    }
  }, [location.state, currentProfile]);

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!appointmentData) {
    return (
      <div className="loading-container">
        <h2>Loading appointment data...</h2>
      </div>
    );
  }

  return (
    <div className="appointment-receipt-page">
      <AppointmentReceipt appointment={appointmentData} />
    </div>
  );
}

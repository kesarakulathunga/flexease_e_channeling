// src/pages/patient/dashboard/Payment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { appointmentService } from '../../../services';
import './MakeAppointment.css';  // Reuse styles

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedSlot = location.state;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // If no slot was selected, redirect back to appointment selection
  useEffect(() => {
    if (!selectedSlot) {
      navigate('/dashboard/make-appointment');
    }
  }, [selectedSlot, navigate]);

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Attempt to book the appointment
      await appointmentService.bookAppointment({
        slotId: selectedSlot.slotId,
        date: selectedSlot.date,
        time: selectedSlot.time
      });
      
      setSuccess(true);
      
      // Redirect to appointments view after short delay
      setTimeout(() => {
        navigate('/dashboard/appointments');
      }, 2000);
    } catch (err) {
      console.error('Error booking appointment:', err);
      
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please login again.');
        // Force verification using the verifyAppointmentOTP function with purpose='registration'
        navigate('/verify-email');
      } else {
        setError('Failed to book appointment. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (!selectedSlot) {
    return <div className="loading">Redirecting to appointment selection...</div>;
  }
  
  return (
    <div className="payment-container">
      <h2>Confirm Your Appointment</h2>
      
      <div className="appointment-summary">
        <h3>Appointment Details</h3>
        <p><strong>Date:</strong> {new Date(selectedSlot.date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> {selectedSlot.time}</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {success ? (
        <div className="success-message">
          <h3>Appointment Booked Successfully!</h3>
          <p>Redirecting to your appointments...</p>
        </div>
      ) : (
        <div className="action-buttons">
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/dashboard/make-appointment')}
            disabled={loading}
          >
            Back
          </button>
          <button 
            className="btn-primary" 
            onClick={handleConfirmPayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Appointment'}
          </button>
        </div>
      )}
    </div>
  );
}

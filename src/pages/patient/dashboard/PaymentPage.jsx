// src/pages/patient/dashboard/PaymentPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { appointmentService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import './PaymentPage.css';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    nameOnCard: '',
    expiryDate: '',
    cvv: ''
  });
  // Get the selected appointment details from navigation state
  const selectedSlot = location.state;

  if (!selectedSlot) {
    // If no appointment details were passed, redirect back to make appointment
    return (
      <div className="payment-error">
        <h2>Error</h2>
        <p>No appointment details found. Please select an appointment slot first.</p>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/dashboard/make-appointment')}
        >
          Go Back to Appointments
        </button>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleConfirmPayment = async () => {
    if (!currentProfile?.id) {
      setError('User profile not found. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create appointment data object
      const appointmentData = {
        patientId: currentProfile.id,
        slotId: selectedSlot.slotId,
        date: selectedSlot.date,
        time: selectedSlot.time,
        paymentMethod: paymentMethod,
        // Add any other data needed for appointment
      };

      // Call the API to book the appointment
      const response = await appointmentService.bookAppointment(appointmentData);
      
      // Navigate to confirmation page or back to dashboard
      navigate('/dashboard/appointments', { 
        state: { 
          success: true, 
          message: 'Appointment booked successfully!',
          appointmentId: response.id
        }
      });
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="payment-page">
      <h2>Payment for Appointment</h2>
      
      <div className="appointment-summary">
        <h3>Appointment Details</h3>
        <p><strong>Date:</strong> {new Date(selectedSlot.date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> {selectedSlot.time}</p>
        <p><strong>Fee:</strong> $75.00</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="payment-methods">
        <h3>Select Payment Method</h3>
        
        <div className="payment-method-options">
          <label className={`payment-method-option ${paymentMethod === 'credit-card' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="credit-card"
              checked={paymentMethod === 'credit-card'}
              onChange={handlePaymentMethodChange}
            />
            <span className="payment-method-name">Credit/Debit Card</span>
          </label>
          
          <label className={`payment-method-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={handlePaymentMethodChange}
            />
            <span className="payment-method-name">PayPal</span>
          </label>
        </div>
      </div>

      {paymentMethod === 'credit-card' && (
        <div className="card-payment-form">
          <div className="form-group">
            <label htmlFor="cardNumber">Card Number</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.cardNumber}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="nameOnCard">Name on Card</label>
            <input
              type="text"
              id="nameOnCard"
              name="nameOnCard"
              placeholder="John Doe"
              value={cardDetails.nameOnCard}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                placeholder="MM/YY"
                value={cardDetails.expiryDate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'paypal' && (
        <div className="paypal-info">
          <p>You will be redirected to PayPal to complete your payment.</p>
        </div>
      )}

      <div className="payment-actions">
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
          {loading ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </div>
    </div>
  );
}

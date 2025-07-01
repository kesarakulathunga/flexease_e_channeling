import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services';
import settingsIcon from '../../../assets/settings.svg';
import './Settings.css';

export default function Settings() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [originalNumber, setOriginalNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load the current mobile number on component mount
  useEffect(() => {
    const storedNumber = localStorage.getItem('contactMobileNumber') || '123-456-7890';
    setMobileNumber(storedNumber);
    setOriginalNumber(storedNumber);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!mobileNumber.trim()) {
      setMessage({ text: 'Please enter a valid mobile number', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      // Save to localStorage
      localStorage.setItem('contactMobileNumber', mobileNumber);
      console.log('Saved mobile number to localStorage:', mobileNumber);

      // Force a small delay to ensure localStorage is updated before dispatching the event
      setTimeout(() => {
        // Dispatch a custom event to notify other components
        const event = new CustomEvent('mobileNumberUpdated', {
          detail: { mobileNumber }
        });
        console.log('Dispatching mobileNumberUpdated event with number:', mobileNumber);
        window.dispatchEvent(event);
      }, 50);

      // Show success message
      setMessage({
        text: 'Mobile number updated successfully! The changes will be visible throughout the website.',
        type: 'success'
      });

      // Update original number to match current
      setOriginalNumber(mobileNumber);
    } catch (error) {
      console.error('Error updating mobile number:', error);
      setMessage({
        text: 'Failed to update mobile number. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMobileNumber(originalNumber);
    setMessage({ text: '', type: '' });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <img src={settingsIcon} alt="Settings" className="settings-icon" />
        <h2>Website Settings</h2>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-section">
        <h3>Contact Information</h3>
        <p className="settings-description">
          Update the contact information displayed in the website header.
          This number will be visible to all users.
        </p>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="mobileNumber">Mobile Number</label>
            <input
              type="text"
              id="mobileNumber"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="e.g., 123-456-7890"
              disabled={isSubmitting}
            />
            <small>Format: Use hyphens or spaces for better readability (e.g., 123-456-7890)</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting || mobileNumber === originalNumber}
              className="reset-button"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mobileNumber === originalNumber}
              className="save-button"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

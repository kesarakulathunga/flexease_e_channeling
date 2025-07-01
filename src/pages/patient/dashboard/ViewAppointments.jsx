// src/pages/patient/dashboard/ViewAppointments.jsx
import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../../services';
import './ViewAppointments.css';

export default function ViewAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await appointmentService.getMyAppointments();
      setAppointments(response);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load your appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading your appointments...</div>;
  }
  return (
    <div className="view-appointments">
      <h2>Your Appointments</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {appointments.length === 0 ? (
        <div className="no-appointments">
          <p>You don't have any appointments scheduled.</p>
        </div>
      ) : (
          <div className="appointments-list">
            {appointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-date">
                    {new Date(appointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="appointment-time">{appointment.time}</div>
                </div>
                
                {appointment.reason && (
                  <div className="appointment-reason">
                    <strong>Reason:</strong> {appointment.reason}
                  </div>
                )}
                
                <div className="appointment-status">
                  Status: <span className={appointment.status.toLowerCase()}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

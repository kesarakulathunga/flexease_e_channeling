import React, { useState } from 'react';
import './ViewAppointments.css';

export default function ViewAppointments() {
  const [appointments] = useState([
    { id:1, date:'2025-04-26', time:'9:00 AM', therapist:'Dr. Smith', status:'Confirmed' },
    { id:2, date:'2025-05-01', time:'11:00 AM', therapist:'Dr. Lee', status:'Pending' },
  ]);

  const handleReschedule = id => {
    // TODO: open reschedule flow
    alert(`Reschedule appointment ${id}`);
  };

  return (
    <>
      <h2>Your Appointments</h2>
      <table className="appt-table">
        <thead>
          <tr>
            <th>Date</th><th>Time</th><th>Therapist</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(a=>(
            <tr key={a.id}>
              <td>{a.date}</td>
              <td>{a.time}</td>
              <td>{a.therapist}</td>
              <td>{a.status}</td>
              <td>
                <button
                  className="btn-link"
                  disabled={false}
                  onClick={()=>handleReschedule(a.id)}
                >
                  Reschedule
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

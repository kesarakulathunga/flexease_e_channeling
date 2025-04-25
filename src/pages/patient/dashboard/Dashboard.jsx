import React from 'react';
import './Dashboard.css';

export default function Dashboard() {
  // These would normally come from context/API
  const userName = 'User'; // Placeholder - get from props or context
  const userDetails = { age: 45, email: 'john.doe@example.com', nic: '123456789V' };
  const feedbacks = [
    { id: 1, date: '2025-03-20', message: 'Great progress on your shoulder mobility!' },
    { id: 2, date: '2025-02-10', message: 'MRI report normal—no further action needed.' },
  ];

  return (
    <>
      <header className="dashboard-header">
        <h1>Hi, {userName}</h1>
      </header>

      <section className="dashboard-details">
        <h2>Basic Details</h2>
        <ul>
          <li><strong>Age:</strong> {userDetails.age}</li>
          <li><strong>Email:</strong> {userDetails.email}</li>
          <li><strong>NIC:</strong> {userDetails.nic}</li>
        </ul>
      </section>

      <section className="dashboard-feedback">
        <h2>Report Feedbacks</h2>
        <div className="feedback-list">
          {feedbacks.map(fb => (
            <div key={fb.id} className="feedback-item">
              <div className="feedback-date">{fb.date}</div>
              <div className="feedback-message">{fb.message}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

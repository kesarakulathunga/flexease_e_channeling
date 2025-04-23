import React, { useState, useEffect } from 'react';
import './ViewAdmins.css';

export default function ViewAdmins() {
  const [admins, setAdmins] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  // Stub: load existing admins
  useEffect(() => {
    // TODO: replace with real API fetch
    setAdmins([
      { email: 'alice@clinic.com' },
      { email: 'bob@clinic.com' },
    ]);
  }, []);

  const handleAdd = () => {
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setError('Please enter a valid email.');
      return;
    }
    if (admins.some(a => a.email === newEmail)) {
      setError('That email is already an admin.');
      return;
    }
    setAdmins([{ email: newEmail }, ...admins]);
    setNewEmail('');
    setError('');
    // TODO: POST to backend
  };

  const handleRemove = email => {
    setAdmins(admins.filter(a => a.email !== email));
    // TODO: DELETE to backend
  };

  return (
    <div className="view-admins-page">
      <h2>Manage Admins</h2>

      <div className="view-admin-form">
        <input
          type="email"
          placeholder="newadmin@clinic.com"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
        />
        <button onClick={handleAdd}>Add Admin</button>
      </div>
      {error && <div className="error">{error}</div>}

      <h3>Current Admins</h3>
      {admins.length === 0 ? (
        <p>No admins found.</p>
      ) : (
        <ul className="admin-list">
          {admins.map(({ email }) => (
            <li key={email}>
              <span>{email}</span>
              <button onClick={() => handleRemove(email)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

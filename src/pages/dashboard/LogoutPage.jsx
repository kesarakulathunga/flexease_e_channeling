import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LogoutPage.css';

export default function LogoutPage() {
  const nav = useNavigate();
  const confirm = () => { /* TODO: clear auth */ nav('/'); };
  const cancel = () => nav('/dashboard');

  return (
    <div className="logout-page">
      <h2>Log Out</h2>
      <p>Are you sure you want to log out?</p>
      <div className="actions">
        <button className="btn-logout-cancel" onClick={cancel}>Cancel</button>
        <button className="btn-logout-confirm" onClick={confirm}>Log Out</button>
      </div>
    </div>
  );
}

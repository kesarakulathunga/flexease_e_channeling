import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DeleteProfile.css';

export default function DeleteProfile() {
  const nav = useNavigate();
  const confirm = () => { /* TODO: delete */ nav('/'); };
  const cancel = () => nav('/dashboard');

  return (
    <div className="delete-profile">
      <h2>Delete Profile</h2>
      <p>Are you sure you want to delete your profile?</p>
      <div className="actions">
        <button className="btn-delete-cancel" onClick={cancel}>Cancel</button>
        <button className="btn-delete-confirm" onClick={confirm}>Confirm</button>
      </div>
    </div>
  );
}

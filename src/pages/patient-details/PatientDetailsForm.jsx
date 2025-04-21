// src/pages/patient-details/PatientDetailsForm.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PatientDetailsForm.css';

export default function PatientDetailsForm() {
  const navigate = useNavigate();
  const { email, profile } = useLocation().state || { email: '', profile: null };

  // If editing an existing profile, pre-fill; otherwise start blank
  const [form, setForm] = useState({
    fullName: profile?.name || '',
    age: profile?.age || '',
    nic: profile?.nic || '',
    email: email || '',
  });
  const [errors, setErrors] = useState({});

  // Validate fields before submission
  const validate = () => {
    const e = {};
    if (!/^\S+\s+\S+/.test(form.fullName))
      e.fullName = 'Full name must be at least two words.';
    if (!(+form.age >= 6 && +form.age <= 100))
      e.age = 'Age must be between 6 and 100.';
    if (!/^[A-Za-z0-9]{1,11}[A-Za-z]?$/.test(form.nic))
      e.nic = 'NIC must be alphanumeric (max 12, one letter).';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) {
      setErrors(ve);
      return;
    }
    setErrors({});
    // TODO: call backend to create/update profile
    // await patientService.save(form);
    navigate('/dashboard'); // go to dashboard on success
  };

  return (
    <div className="details-page">
      <div className="details-card">
        <h2>{profile ? 'Update Profile' : 'Create Profile'}</h2>
        <p>Email: <strong>{form.email}</strong></p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            />
            {errors.fullName && <small className="error">{errors.fullName}</small>}
          </div>

          <div className="field">
            <label>Age</label>
            <input
              type="number"
              value={form.age}
              onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
            />
            {errors.age && <small className="error">{errors.age}</small>}
          </div>

          <div className="field">
            <label>NIC Number</label>
            <input
              type="text"
              value={form.nic}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  nic: e.target.value.toUpperCase().replace(/\s/g, ''),
                }))
              }
            />
            {errors.nic && <small className="error">{errors.nic}</small>}
          </div>

          <button type="submit" className="btn-primary">
            {profile ? 'Update & Continue' : 'Create & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

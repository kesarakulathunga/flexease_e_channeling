import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MakeAppointment.css';

export default function MakeAppointment() {
  const navigate = useNavigate();
  const dates = ['2025-04-26','2025-04-27','2025-04-28','2025-04-29','2025-04-30'];
  const times = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM'];
  const [selected, setSelected] = useState(null);

  const handleSelect = (date, time) => {
    setSelected({ date, time });
  };

  const handleNext = () => {
    // stub for payment navigation
    navigate('/dashboard/payment', { state: selected });
  };

  return (
    <div className="make-appointment">
      <h2>Make Appointment</h2>
      <div className="grid-container">
        <div className="grid-header slot-header"></div>
        {dates.map(d => <div key={d} className="grid-header">{d}</div>)}
        {times.map(t => (
          <React.Fragment key={t}>
            <div className="grid-header">{t}</div>
            {dates.map(d => {
              const isSelected = selected?.date === d && selected?.time === t;
              return (
                <div
                  key={`${d}-${t}`}
                  className={`slot ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(d, t)}
                >
                  {isSelected ? '✓' : ''}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <button className="btn-primary" onClick={handleNext} disabled={!selected}>
        Next
      </button>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import './UpdateSlots.css';

export default function UpdateSlots() {
  const dates = ['2025-05-01','2025-05-02','2025-05-03','2025-05-04','2025-05-05'];
  const times = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM'];

  const [availSlots, setAvailSlots] = useState([]);       // admin’s picks
  const [reservedSlots, setReservedSlots] = useState([]); // patient‐booked slots

  // On mount: fetch reserved slots (stubbed)
  useEffect(() => {
    // TODO: replace with real API call
    setReservedSlots([
      { date: '2025-05-02', time: '9:00 AM' },
      { date: '2025-05-04', time: '1:00 PM' }
    ]);
    // Also load existing availSlots from server if needed
  }, []);

  const toggleSlot = (date, time) => {
    // If reserved by patient, do nothing
    if (reservedSlots.some(s => s.date===date && s.time===time)) return;

    setAvailSlots(prev => {
      const exists = prev.some(s => s.date===date && s.time===time);
      if (exists) {
        // remove
        return prev.filter(s => !(s.date===date && s.time===time));
      } else {
        // add
        return [...prev, { date, time }];
      }
    });
  };

  const isSelected = (date, time) =>
    availSlots.some(s => s.date===date && s.time===time);

  const isReserved = (date, time) =>
    reservedSlots.some(s => s.date===date && s.time===time);

  return (
    <div className="update-slots-page">
      <h2>Update Your Available Time Slots</h2>

      <div className="grid-container">
        <div className="grid-header slot-header"></div>
        {dates.map(d => <div key={d} className="grid-header">{d}</div>)}

        {times.map(t => (
          <React.Fragment key={t}>
            <div className="grid-header">{t}</div>
            {dates.map(d => {
              const selected = isSelected(d,t);
              const reserved = isReserved(d,t);
              return (
                <div
                  key={`${d}|${t}`}
                  className={
                    `slot-cell 
                      ${reserved ? 'reserved' : selected ? 'selected' : ''}`
                      .replace(/\s+/g,' ')
                  }
                  onClick={() => toggleSlot(d, t)}
                >
                  {reserved ? '🔒' : selected ? '✓' : ''}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <section className="selected-slots">
        <h3>Your Selected Slots ({availSlots.length})</h3>
        {availSlots.length === 0 ? (
          <p>No slots selected yet.</p>
        ) : (
          <ul>
            {availSlots.map(({date,time}) => (
              <li key={`${date}|${time}`}>
                <strong>{date}</strong> at <em>{time}</em>
                <button className="remove-btn"
                        onClick={() => toggleSlot(date,time)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

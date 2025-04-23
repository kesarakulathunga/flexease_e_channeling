import React, { useState, useEffect } from 'react';
import './UploadReport.css';

export default function UploadReport() {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // stub existing
    setReports([
      { id: 1, name: 'Report1.pdf', date: '2025-03-01' },
      { id: 2, name: 'Report2.jpg', date: '2025-03-15' },
    ]);
  }, []);

  const handleUpload = e => {
    e.preventDefault();
    if (!title || !file) return;
    const newReport = { id: Date.now(), name: file.name, date: new Date().toISOString().slice(0,10) };
    setReports([newReport, ...reports]);
    setTitle(''); setNotes(''); setFile(null);
  };

  const handleRemove = id => setReports(reports.filter(r => r.id !== id));

  return (
    <>
      <h2>Upload Report</h2>
      <form className="upload-form" onSubmit={handleUpload}>
        <div className="field">
          <label>Report Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Additional Notes</label>
          <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="field">
          <label>Choose File</label>
          <input type="file" onChange={e => setFile(e.target.files[0])} />
        </div>
        <button type="submit" className="btn-primary" disabled={!title || !file}>
          Save Changes
        </button>
      </form>

      <section className="reports-section">
        <h2>Previously Uploaded Reports</h2>
        <div className="reports-list">
          {reports.map(r => (
            <div key={r.id} className="report-item">
              <div><strong>{r.name}</strong> ({r.date})</div>
              <button className="btn-outline" onClick={() => handleRemove(r.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import './ViewReports.css';

export default function ViewReports({ adminEmail = 'admin@example.com' }) {
  // Signature derived from email before the “@”
  const signature = adminEmail.split('@')[0];

  // Stubbed report data
  const [reports, setReports] = useState([]);

  // Active tab: 'unreviewed' or 'reviewed'
  const [activeTab, setActiveTab] = useState('unreviewed');

  useEffect(() => {
    // TODO: Fetch from backend instead
    setReports([
      {
        id: 1,
        fileName: 'MRI_Scan_Report.pdf',
        fileUrl: '/reports/MRI_Scan_Report.pdf',
        status: 'unreviewed',
        patient: {
          name: 'John Doe',
          age: 45,
          nic: '123456789V',
          tp: '0771234567'
        },
        feedbacks: []
      },
      {
        id: 2,
        fileName: 'Xray_Report.jpg',
        fileUrl: '/reports/Xray_Report.jpg',
        status: 'reviewed',
        patient: {
          name: 'Jane Smith',
          age: 52,
          nic: '987654321V',
          tp: '0777654321'
        },
        feedbacks: [
          { id: 1, author: 'alice', content: 'Looks normal. No issues.' }
        ]
      }
    ]);
  }, []);

  const addFeedback = (reportId, text) => {
    setReports(rs =>
      rs.map(r => {
        if (r.id !== reportId) return r;
        const fb = { id: Date.now(), author: signature, content: text.trim() };
        const newFb = [...r.feedbacks, fb];
        return { ...r, feedbacks: newFb, status: 'reviewed' };
      })
    );
  };

  const deleteFeedback = (reportId, fbId) => {
    setReports(rs =>
      rs.map(r => {
        if (r.id !== reportId) return r;
        const newFb = r.feedbacks.filter(fb => fb.id !== fbId);
        return {
          ...r,
          feedbacks: newFb,
          status: newFb.length ? 'reviewed' : 'unreviewed'
        };
      })
    );
  };

  const reportsToShow = reports.filter(r => r.status === activeTab);

  return (
    <div className="view-reports-page">
      <h2>View Reports</h2>

      {/* Tabs */}
      <div className="tabs">
        {['unreviewed','reviewed'].map(tab => (
          <button
            key={tab}
            className={tab === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'unreviewed' ? 'Unreviewed' : 'Reviewed'} ({reports.filter(r=>r.status===tab).length})
          </button>
        ))}
      </div>

      {/* Report list */}
      {reportsToShow.length === 0 ? (
        <p className="no-reports">No {activeTab} reports.</p>
      ) : (
        reportsToShow.map(report => (
          <div key={report.id} className="report-card">
            {/* Download & patient info */}
            <div className="report-header">
              <a href={report.fileUrl} download className="download-link">
                📥 {report.fileName}
              </a>
              <div className="patient-info">
                <div><strong>Name:</strong> {report.patient.name}</div>
                <div><strong>Age:</strong> {report.patient.age}</div>
                <div><strong>NIC:</strong> {report.patient.nic}</div>
                <div><strong>TP:</strong> {report.patient.tp}</div>
              </div>
            </div>

            {/* Existing feedbacks */}
            <div className="feedback-list">
              {report.feedbacks.map(fb => (
                <div key={fb.id} className="feedback-item">
                  <div className="fb-content">{fb.content}</div>
                  <div className="fb-footer">
                    — {fb.author}
                    {fb.author === signature && (
                      <button
                        className="fb-delete"
                        onClick={() => deleteFeedback(report.id, fb.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add new feedback */}
            <FeedbackInput
              onSave={text => addFeedback(report.id, text)}
              disabled={false}
            />
          </div>
        ))
      )}
    </div>
  );
}

// Sub-component for feedback input
function FeedbackInput({ onSave, disabled }) {
  const [text, setText] = useState('');
  return (
    <div className="feedback-input">
      <textarea
        rows="3"
        placeholder="Write your feedback here..."
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={disabled}
      />
      <button
        onClick={() => { onSave(text); setText(''); }}
        disabled={text.trim().length === 0}
      >
        Save Feedback
      </button>
    </div>
  );
}

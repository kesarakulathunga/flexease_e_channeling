import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services';
import './ViewReports.css';

export default function ViewReports() {
  const { user } = useAuth();
  const signature = user?.email ? user.email.split('@')[0] : 'admin';
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // Default tab is 'pending'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1
  });
  
  const fetchReports = async (page = pagination.page) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // Get reports that need feedback
      response = await adminService.getReportsWithoutFeedback(page, pagination.limit);
      
      // Handle different possible response formats
      let reportData = [];
      let paginationInfo = {
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages,
        totalReports: pagination.totalReports || 0
      };
      
      if (Array.isArray(response)) {
        reportData = response;
      } else if (response.data && Array.isArray(response.data)) {
        reportData = response.data;
        if (response.pagination) {
          paginationInfo = {
            ...paginationInfo,
            ...response.pagination
          };
        }
      } else if (response.reports && Array.isArray(response.reports)) {
        reportData = response.reports;
        if (response.pagination) {
          paginationInfo = {
            ...paginationInfo,
            ...response.pagination
          };
        }
      }
          // Process each report to ensure consistent structure
        const processedReports = reportData.map(report => ({
          id: report.id || report._id,
          fileName: report.fileName || report.title || 'Unnamed Report',
          fileUrl: report.fullFileUrl || report.fileUrl || report.url || '#',
          status: report.status || (report.feedbacks?.length > 0 ? 'reviewed' : 'unreviewed'),
          uploadedAt: report.uploadedAt || report.createdAt || new Date().toISOString(),
          patient: {
            name: report.patientName || report.patient?.name || report.patient?.fullName || 'Unknown Patient',
            age: report.patientAge || report.patient?.age || '',
            nic: report.patientNIC || report.patient?.nic || '',
            email: report.patient?.email || '',
            tp: report.patientContact || report.patientPhone || report.patient?.phone || report.patient?.tp || ''
          },
          feedbacks: Array.isArray(report.feedbacks) ? report.feedbacks.map(fb => ({
            id: fb.id || fb._id,
            content: fb.content || fb.message || '',
            author: fb.author || fb.adminId || '',
            authorName: fb.authorName || fb.adminName || '',
            createdAt: fb.createdAt || fb.date || new Date().toISOString(),
            authorId: fb.authorId || fb.adminId || ''
          })) : []
        }));
        
        setReports(processedReports);
        setPagination(paginationInfo);      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again later.');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    fetchReports();
  }, []);
    const addFeedback = async (reportId, text) => {
    if (!text.trim()) return;
    
    try {
      const feedbackData = {
        content: text.trim()
      };
      
      console.log(`Adding feedback to report ${reportId}:`, feedbackData);
      const response = await adminService.addReportFeedback(reportId, feedbackData);      // Process the response based on expected API format
      let newFeedback;
      
      if (response && response.success && response.feedback) {
        // This matches the expected API response format
        newFeedback = response.feedback;
      } else if (response && response.data && response.data.success && response.data.feedback) {
        // Handle axios wrapping in data property
        newFeedback = response.data.feedback;
      } else if (response && typeof response === 'object') {
        // Fallback: Try to use response directly if it looks like a feedback object
        newFeedback = response;
      } else {
        // Create a fallback feedback object if we can't find it in the response
        newFeedback = { 
          id: Date.now(), 
          content: text.trim(),
          author: signature,
          createdAt: new Date().toISOString()
        };
      }
      
      console.log('Added feedback:', newFeedback);
        // Normalize feedback structure to match our frontend expectations
      const normalizedFeedback = {
        id: newFeedback.id || newFeedback._id || Date.now(),
        content: newFeedback.content || newFeedback.message || text.trim(),
        author: newFeedback.author || newFeedback.authorId || signature,
        authorName: newFeedback.authorName || newFeedback.adminName || signature,
        createdAt: newFeedback.createdAt || newFeedback.date || new Date().toISOString(),
        authorId: newFeedback.authorId || newFeedback.adminId || user?.id
      };
        // Update reports with the new feedback
      setReports(rs =>
        rs.map(r => {
          if (r.id !== reportId) return r;
          const updatedReport = { 
            ...r, 
            feedbacks: [...r.feedbacks, normalizedFeedback],
            status: 'reviewed' 
          };
          return updatedReport;
        })
      );      // If we're on the pending tab, delay a refresh to update the UI
      // Only if activeTab is defined (if it's not, don't do anything)
      if (typeof activeTab !== 'undefined' && activeTab === 'pending') {
        setTimeout(() => fetchReports(activeTab), 500);
      }
    } catch (err) {
      console.error('Error adding feedback:', err);
      setError(`Failed to add feedback: ${err.message}`);
      
      // Only fallback in development mode
      if (process.env.NODE_ENV === 'development') {
        setReports(rs =>
          rs.map(r => {
            if (r.id !== reportId) return r;
            const fb = { id: Date.now(), author: signature, content: text.trim() };
            return { ...r, feedbacks: [...r.feedbacks, fb], status: 'reviewed' };
          })
        );
      }
    }
  };  const deleteFeedback = async (reportId, feedbackId) => {
    try {
      console.log(`Deleting feedback ${feedbackId} from report ${reportId}`);
      await adminService.deleteReportFeedback(reportId, feedbackId);
      console.log('Feedback deleted successfully');
      
      // Update reports by removing the feedback
      setReports(rs =>
        rs.map(r => {
          if (r.id !== reportId) return r;
          const newFb = r.feedbacks.filter(fb => fb.id !== feedbackId);
          return {
            ...r,
            feedbacks: newFb,
            status: newFb.length ? 'reviewed' : 'unreviewed'
          };
        })
      );      // If we're on a filtered tab and the deletion affects visibility, refresh
      if (reportsToShow.length === 1) {
        setTimeout(() => fetchReports(), 500);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError(`Failed to delete feedback: ${err.message}`);
      
      // Only fallback in development mode
      if (process.env.NODE_ENV === 'development') {
        setReports(rs =>
          rs.map(r => {
            if (r.id !== reportId) return r;
            const newFb = r.feedbacks.filter(fb => fb.id !== feedbackId);
            return {
              ...r,
              feedbacks: newFb,
              status: newFb.length ? 'reviewed' : 'unreviewed'
            };
          })
        );
      }
    }
  };
    const reportsToShow = reports.filter(r => !r.feedbacks?.length);

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="view-reports-page">
      <h2>View Reports</h2>      {error && <div className="error">{error}</div>}
      
      {/* Report list */}
      {reportsToShow.length === 0 ? (
        <p className="no-reports">
          No reports needing feedback found.
        </p>
      ) : (
        reportsToShow.map(report => (          <div key={report.id} className={`report-card ${!report.feedbacks?.length ? 'needs-feedback' : ''}`}>
            {/* Download & patient info */}
            <div className="report-header">
              <div className="report-info">
                <a href={report.fileUrl} download className="download-link">
                  📥 {report.fileName || report.title}
                </a>
                <div className="report-meta">
                  <span className="report-date">
                    Uploaded: {formatDate(report.uploadedAt)}
                  </span>
                  <span className="feedback-count">
                    Feedback: {report.feedbacks.length}
                  </span>
                </div>
              </div>
              <div className="patient-info">
                <div><strong>Name:</strong> {report.patient.name}</div>
                {report.patient.age && <div><strong>Age:</strong> {report.patient.age}</div>}
                {report.patient.nic && <div><strong>NIC:</strong> {report.patient.nic}</div>}
                {report.patient.tp && <div><strong>Contact:</strong> {report.patient.tp}</div>}
                {report.patient.email && <div><strong>Email:</strong> {report.patient.email}</div>}
              </div>
            </div>

            {/* Existing feedbacks */}            <div className="feedback-list">
              <h3 className="feedback-section-title">
                {report.feedbacks.length > 0 ? 'Feedback' : 'No feedback yet'}
              </h3>              {report.feedbacks.map(fb => {
                // Format date if available
                const formattedDate = formatDate(fb.createdAt);
                
                return (
                  <div key={fb.id} className="feedback-item">
                    <div className="fb-content">{fb.content}</div>
                    <div className="fb-footer">
                      <div className="fb-author">
                        <span>{fb.authorName || fb.author || signature}</span>
                        {formattedDate && <span className="fb-date"> — {formattedDate}</span>}
                      </div>
                      {(fb.authorId === user?.id || fb.author === signature) && (
                        <button
                          className="fb-delete"
                          onClick={() => deleteFeedback(report.id, fb.id)}
                          title="Delete feedback"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add new feedback */}
            <FeedbackInput
              onSave={text => addFeedback(report.id, text)}
              disabled={false}
            />          </div>
        ))
      )}
        {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => fetchReports(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.page} of {pagination.totalPages}
            {pagination.totalReports ? ` (${pagination.totalReports} total)` : ''}
          </span>
          <button 
            onClick={() => fetchReports(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-component for feedback input
function FeedbackInput({ onSave, disabled }) {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const handleSave = async () => {
    if (!text.trim() || disabled || isSaving) return;
    
    // Clear previous errors
    setError('');
    
    // Validate feedback length
    if (text.trim().length < 3) {
      setError('Feedback must be at least 3 characters long');
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(text);
      setText('');
    } catch (err) {
      setError(err.message || 'Failed to save feedback');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="feedback-input">
      <textarea
        rows="3"
        placeholder="Write your feedback here..."
        value={text}
        onChange={e => {
          setText(e.target.value);
          if (error) setError('');
        }}
        disabled={disabled || isSaving}
      />
      {error && <div className="feedback-error">{error}</div>}
      <div className="feedback-actions">
        <button
          className={`feedback-submit-btn ${text.trim().length === 0 ? 'disabled' : ''}`}
          onClick={handleSave}
          disabled={text.trim().length === 0 || disabled || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Feedback'}
        </button>
        <small className="feedback-char-count">
          {text.length} characters
        </small>
      </div>
    </div>
  );
}

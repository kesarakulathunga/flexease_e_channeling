import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../../services';
import FeedbackDisplay from '../../../components/FeedbackDisplay';
import './UploadReport.css';

export default function UploadReport() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({
    title: '',
    notes: '',
    file: ''
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    reportId: null,
    reportTitle: ''
  });const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Reset file validation error
    setValidationErrors(prev => ({ ...prev, file: '' }));
    
    if (selectedFile) {
      // Check file size - 5MB maximum (5 * 1024 * 1024 bytes)
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      
      if (selectedFile.size > maxSizeInBytes) {
        setValidationErrors(prev => ({ 
          ...prev, 
          file: 'File size exceeds the 5MB limit. Please select a smaller file.' 
        }));
        setFile(null);
        e.target.value = null; // Reset the file input
      } else {
        setFile(selectedFile);
      }
    } else {
      setFile(null);
    }
  };
  
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Reset title validation error
    setValidationErrors(prev => ({ ...prev, title: '' }));
    
    // Validate title length (1-50 characters)
    if (newTitle.length > 50) {
      setValidationErrors(prev => ({ 
        ...prev, 
        title: 'Title must be less than 50 characters.' 
      }));
    } else if (newTitle.trim().length === 0) {
      setValidationErrors(prev => ({ 
        ...prev, 
        title: 'Title is required and must contain at least one word.' 
      }));
    }
  };
  
  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    
    // Reset notes validation error
    setValidationErrors(prev => ({ ...prev, notes: '' }));
    
    // Count words in notes
    const wordCount = newNotes ? newNotes.trim().split(/\s+/).length : 0;
    
    // Validate notes (maximum 500 words)
    if (wordCount > 500) {
      setValidationErrors(prev => ({ 
        ...prev, 
        notes: `Notes exceed the maximum of 500 words (current: ${wordCount} words).` 
      }));
    }
  };
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [page, limit]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const timeoutId = setTimeout(() => {
      fetchReports();
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeoutId);
    
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [search]);  const fetchReports = async () => {
    setLoading(true);
    try {
      console.log(`Attempting to fetch reports with page=${page}, limit=${limit}, search=${search}`);
      const response = await patientService.getReports(page, limit, search);
      console.log('Reports API Response:', response);
      
      let reportsData = [];
      
      // Handle different possible response structures
      if (response.data && Array.isArray(response.data)) {
        console.log(`Found ${response.data.length} reports in response.data`);
        reportsData = response.data;
      } else if (response.reports && Array.isArray(response.reports)) {
        console.log(`Found ${response.reports.length} reports in response.reports`);
        reportsData = response.reports;
      } else if (Array.isArray(response)) {
        console.log(`Found ${response.length} reports in direct array response`);
        reportsData = response;
      } else {
        console.warn('Unexpected response format:', response);
        reportsData = [];
      }
        // Initialize empty feedbacks array for each report
      const processedReports = reportsData.map(report => {
        return { ...report, feedbackCount: 0 };
      });
      
      setReports(processedReports);      // Fetch feedback counts separately to avoid multiple API calls
      const getFeedbackCounts = async () => {
        try {
          const updatedReports = [...processedReports];
          
          // Process reports in batches to avoid too many simultaneous requests
          const batchSize = 3; // Process 3 reports at a time
          
          for (let i = 0; i < updatedReports.length; i += batchSize) {
            // Get the current batch of reports
            const batch = updatedReports.slice(i, i + batchSize);
            
            // Process this batch in parallel
            const promises = batch.map(async (report, index) => {
              const reportId = report.id || report._id || '';
              
              if (reportId) {
                try {
                  // Use the updated service method that follows the API documentation
                  const count = await patientService.getReportFeedbackCount(reportId);
                  return { index: i + index, count };
                } catch (error) {
                  console.error(`Failed to get feedback count for report ${reportId}:`, error);
                  return { index: i + index, count: 0 };
                }
              }
              return { index: i + index, count: 0 };
            });
            
            // Wait for all promises in the current batch to resolve
            const results = await Promise.all(promises);
            
            // Update the reports with their counts
            results.forEach(({ index, count }) => {
              if (index < updatedReports.length) {
                updatedReports[index].feedbackCount = count;
              }
            });
            
            // Small delay between batches to reduce server load
            if (i + batchSize < updatedReports.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          // Update the state with all feedback counts
          setReports(updatedReports);
        } catch (error) {
          console.error('Error updating feedback counts:', error);
          // If the entire process fails, at least we still have the basic reports showing
        }
      };
      
      // Start fetching feedback counts in background
      getFeedbackCounts();
      
      // Handle pagination data if available
      if (response.pagination) {
        console.log('Pagination data:', response.pagination);
        setTotalPages(response.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
          headers: err.config?.headers
        }
      });
      setError(`Failed to load reports: ${err.message}. Status: ${err.response?.status || 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };const handleUpload = async (e) => {
    e.preventDefault();
    
    // Reset error states
    setError(null);
    setValidationErrors({
      title: '',
      notes: '',
      file: ''
    });
    
    // Perform validations
    let hasErrors = false;
    
    // Validate title
    if (!title || title.trim().length === 0) {
      setValidationErrors(prev => ({ ...prev, title: 'Title is required and must contain at least one word.' }));
      hasErrors = true;
    } else if (title.length > 50) {
      setValidationErrors(prev => ({ ...prev, title: 'Title must be less than 50 characters.' }));
      hasErrors = true;
    }
    
    // Validate notes (if provided)
    if (notes) {
      const wordCount = notes.trim().split(/\s+/).length;
      if (wordCount > 500) {
        setValidationErrors(prev => ({ ...prev, notes: `Notes exceed the maximum of 500 words (current: ${wordCount} words).` }));
        hasErrors = true;
      }
    }
    
    // Validate file
    if (!file) {
      setValidationErrors(prev => ({ ...prev, file: 'Please select a file to upload.' }));
      hasErrors = true;
    } else if (file.size > 5 * 1024 * 1024) { // 5MB in bytes
      setValidationErrors(prev => ({ ...prev, file: 'File size exceeds the 5MB limit. Please select a smaller file.' }));
      hasErrors = true;
    }
    
    // If any validation errors, don't proceed
    if (hasErrors) {
      return;
    }
    
    setUploading(true);
    
    try {
      // Prepare report metadata
      const reportData = {
        title,
        notes: notes || ''
      };
      
      // Upload report
      const response = await patientService.uploadReport(reportData, file);
      
      // Handle different possible response structures
      let newReport = null;
      if (response && response.data) {
        newReport = response.data;
      } else if (response && response.report) {
        newReport = response.report;
      } else if (response && response.success && typeof response !== 'boolean') {
        // If we got a success response but no clear data structure, use the whole response
        newReport = response;
      }      if (newReport) {
        // No need to initialize feedbacks here as we're loading them on demand now
        setReports([newReport, ...reports]);
        setTitle('');
        setNotes('');
        setFile(null);
        
        // Reset the file input
        const fileInput = document.querySelector('input[type=file]');
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Refresh the first page to show the new report
        setPage(1);
        await fetchReports();
      } else {
        console.warn('Uploaded successfully but received unexpected response format:', response);
      }
    } catch (err) {
      console.error('Report upload error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to upload report. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };
  const showDeleteConfirmation = (id, title) => {
    setDeleteModal({
      show: true,
      reportId: id,
      reportTitle: title || 'this report'
    });
  };
  
  const hideDeleteConfirmation = () => {
    setDeleteModal({
      show: false,
      reportId: null,
      reportTitle: ''
    });
  };
  
  const handleRemove = async (id) => {
    try {
      const response = await patientService.deleteReport(id);
      
      if (response && response.success) {
        // Remove from local state
        setReports(reports.filter(r => r.id !== id));
        // Hide the modal
        hideDeleteConfirmation();
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete report. Please try again.';
      setError(errorMessage);
      hideDeleteConfirmation();
    }
  };
  return (
    <>
      <h2>Upload Report</h2>      <form className="upload-form" onSubmit={handleUpload}>
        <div className="field">
          <label>Report Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={handleTitleChange} 
            minLength="1"
            maxLength="50"
            required
          />
          {validationErrors.title && <div className="error-text">{validationErrors.title}</div>}
          <small>Maximum 50 characters, at least one word.</small>
        </div>
        <div className="field">
          <label>Additional Notes (Optional)</label>
          <textarea 
            rows="3" 
            value={notes} 
            onChange={handleNotesChange}
          />
          {validationErrors.notes && <div className="error-text">{validationErrors.notes}</div>}
          <small>Maximum 500 words.</small>
        </div>
        <div className="field">
          <label>Choose File</label>
          <input 
            type="file" 
            onChange={handleFileChange} 
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
          />
          {validationErrors.file && <div className="error-text">{validationErrors.file}</div>}
          <small>Accepted formats: PDF, JPG, PNG, DOC, DOCX, TXT. Max size: 5MB.</small>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={
            !title || 
            !file || 
            uploading || 
            validationErrors.title || 
            validationErrors.notes || 
            validationErrors.file
          }
        >
          {uploading ? 'Uploading...' : 'Upload Report'}
        </button>
      </form>

      <section className="reports-section">
        <h2>Previously Uploaded Reports</h2>
        
        <div className="reports-search">
          <input
            type="text"
            placeholder="Search reports by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        
        {loading ? (
          <div className="loading">Loading your reports...</div>
        ) : reports.length > 0 ? (
          <>
            <div className="reports-list">              {reports.map(report => {
                // Handle different date field possibilities
                const reportDate = report.uploadedAt || report.createdAt || report.date || new Date().toISOString();
                // Handle different file URL possibilities
                const fileUrl = report.fullFileUrl || report.fileUrl || report.url || '';
                // Handle different ID field possibilities 
                const reportId = report.id || report._id || '';
                
                return (
                  <div key={reportId} className="report-item">
                    <div>
                      <strong>{report.title}</strong> ({new Date(reportDate).toLocaleDateString()})                      <div className="report-filename">{report.filename || report.name || ''}</div>
                      {report.notes && <div className="report-notes">{report.notes}</div>}
                      {/* Add feedback display component with view more option */}                      <div style={{marginTop: '10px'}}>
                        {/* Just show a summary with number of feedbacks */}                        <div className="feedback-summary">
                          <button 
                            className="btn-link" 
                            onClick={() => navigate(`/reports/${reportId}/feedback`)}
                          >
                            View Feedback ({report.feedbackCount || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="report-actions">
                      {fileUrl && (
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-link"
                        >
                          View
                        </a>
                      )}<button className="btn-outline" onClick={() => showDeleteConfirmation(reportId, report.title)}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {page} of {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>        ) : (
          <p>No reports have been uploaded yet.</p>
        )}
      </section>
      
      {/* Custom Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>"{deleteModal.reportTitle}"</strong>?</p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-outline modal-cancel" 
                onClick={hideDeleteConfirmation}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={() => handleRemove(deleteModal.reportId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

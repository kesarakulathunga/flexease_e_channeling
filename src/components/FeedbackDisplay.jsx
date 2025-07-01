// Common feedback component for displaying report feedback
import React, { useState, useEffect } from 'react';
import { patientService } from '../services';
import './FeedbackDisplay.css';

export default function FeedbackDisplay({ 
  feedbacks = [], 
  showReportTitle = false, 
  reportId = null,
  initialPage = 1 
}) {
  const [currentFeedbacks, setCurrentFeedbacks] = useState(feedbacks);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [reportInfo, setReportInfo] = useState({
    title: '',
    uploadedAt: ''
  });  // If reportId is provided, we'll use pagination and fetch from API directly
  const usePaginatedFeedback = !!reportId;

  useEffect(() => {
    if (!usePaginatedFeedback) {
      // If we're not using pagination, just use the feedbacks passed as props
      setCurrentFeedbacks(feedbacks);
    } else {
      // If we have a reportId, fetch paginated feedbacks
      fetchPaginatedFeedback(initialPage);
    }
    // Only run this effect when these dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, usePaginatedFeedback]);

  // Separate effect to handle page changes
  useEffect(() => {
    // Only fetch if we're in paginated mode and not on the initial render
    if (usePaginatedFeedback && reportId && pagination.page !== initialPage) {
      fetchPaginatedFeedback(pagination.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, reportId, usePaginatedFeedback]);
  const fetchPaginatedFeedback = async (page) => {
    if (!reportId) return;
    
    setLoading(true);
    try {
      // Include sort parameter as per the API documentation
      const response = await patientService.getReportFeedback(reportId, page, 5, 'desc');
      
      setCurrentFeedbacks(response.feedback || []);
      setPagination({
        page: response.pagination?.page || 1,
        totalPages: response.pagination?.totalPages || 1,
        hasNextPage: response.pagination?.hasNextPage || false,
        hasPrevPage: response.pagination?.hasPrevPage || false
      });
      
      setReportInfo({
        title: response.reportTitle || '',
        uploadedAt: response.uploadedAt || ''
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      // Set empty feedbacks to avoid showing stale data
      setCurrentFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };  const changePage = (newPage) => {
    // Update pagination state instead of directly calling the fetch function
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Format date nicely, handling invalid dates gracefully
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date format error';
    }
  };

  return (
    <div className="feedback-list">
      {usePaginatedFeedback && reportInfo.title && (
        <div className="feedback-report-header">
          <h3>Feedback for: {reportInfo.title}</h3>
          {reportInfo.uploadedAt && (
            <p>Report uploaded on: {formatDate(reportInfo.uploadedAt)}</p>
          )}
        </div>
      )}
        {loading ? (
        <div className="feedback-loading">Loading feedback...</div>
      ) : currentFeedbacks.length > 0 ? (
        <>
          {currentFeedbacks.map((feedback, index) => {
            // Extract data from feedback item, handling different possible structures
            const feedbackId = feedback.id || feedback._id || index;
            const messageContent = feedback.message || feedback.content || 'No feedback content';
            const createdDate = feedback.createdAt || feedback.date || new Date();
            const doctorName = feedback.doctorName || feedback.authorName || '';
            const adminId = feedback.adminId || feedback.author || '';
            
            return (
              <div key={feedbackId} className="feedback-item">
                <div className="feedback-date">
                  {formatDate(createdDate)}
                  {doctorName && 
                    <span className="feedback-doctor">
                      {doctorName.toLowerCase().includes('dr') ? doctorName : `Dr. ${doctorName}`}
                    </span>
                  }
                </div>
                <div className="feedback-message">{messageContent}</div>
                {showReportTitle && feedback.reportTitle && (
                  <div className="feedback-report-title">
                    Report: {feedback.reportTitle}
                  </div>
                )}
                <div className="feedback-meta">
                  <span>ID: {feedbackId}</span>
                  {adminId && <span>Admin: {adminId}</span>}
                </div>
              </div>
            );
          })}
          
          {/* Pagination controls - only show if we're using paginated feedback */}
          {usePaginatedFeedback && pagination.totalPages > 1 && (
            <div className="feedback-pagination">
              <button 
                className="pagination-btn" 
                onClick={() => changePage(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button 
                className="pagination-btn"
                onClick={() => changePage(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p>No feedbacks available.</p>
          <p className="empty-state-hint">Feedbacks will appear here after your reports are reviewed.</p>
        </div>
      )}
    </div>
  );
}

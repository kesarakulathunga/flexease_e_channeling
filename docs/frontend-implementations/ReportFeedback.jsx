import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// Styling
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  feedbackItem: {
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '5px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
  },
  feedbackMessage: {
    fontSize: '16px',
    marginBottom: '10px',
  },
  meta: {
    color: '#6c757d',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  error: {
    color: 'red',
    padding: '10px',
    border: '1px solid red',
    borderRadius: '5px',
    backgroundColor: '#ffeeee',
  },
  loadingSpinner: {
    textAlign: 'center',
    padding: '20px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px 0',
    gap: '10px',
  },
  pageButton: {
    padding: '5px 10px',
    cursor: 'pointer',
    border: '1px solid #dee2e6',
    borderRadius: '3px',
    backgroundColor: 'white',
  },
  activePageButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: '1px solid #007bff',
  }
};

const ReportFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [uploadedAt, setUploadedAt] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Get reportId from URL parameters (assuming React Router is used)
  const { reportId } = useParams();
  
  // Function to format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Function to change page
  const changePage = (newPage) => {
    fetchFeedback(newPage);
  };
  
  const fetchFeedback = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    // Get the token from localStorage (you need to implement the login functionality to store the token)
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('You need to be logged in to view feedback');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/patients/reports/${reportId}/feedback?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setFeedback(response.data.feedback);
      setReportTitle(response.data.reportTitle);
      setUploadedAt(response.data.uploadedAt);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err.response?.data?.error || 'Failed to fetch feedback');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFeedback();
  }, [reportId]); // Fetch when report ID changes
  
  if (loading) {
    return <div style={styles.loadingSpinner}>Loading feedback...</div>;
  }
  
  if (error) {
    return <div style={styles.error}>{error}</div>;
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Feedback for: {reportTitle}</h1>
        <p>Report uploaded on: {formatDate(uploadedAt)}</p>
      </div>
      
      {feedback.length === 0 ? (
        <p>No feedback has been provided for this report yet.</p>
      ) : (
        <div>
          {feedback.map((item) => (
            <div key={item.id} style={styles.feedbackItem}>
              <p style={styles.feedbackMessage}>{item.message}</p>
              <div style={styles.meta}>
                <span>Feedback ID: {item.id}</span>
                <span>Date: {formatDate(item.createdAt)}</span>
                {item.adminId && <span>Admin ID: {item.adminId}</span>}
              </div>
            </div>
          ))}
          
          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button 
                style={{
                  ...styles.pageButton,
                  visibility: pagination.hasPrevPage ? 'visible' : 'hidden'
                }}
                onClick={() => changePage(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </button>
              
              {[...Array(pagination.totalPages).keys()].map(pageNum => (
                <button
                  key={pageNum + 1}
                  style={{
                    ...styles.pageButton,
                    ...(pageNum + 1 === pagination.page ? styles.activePageButton : {})
                  }}
                  onClick={() => changePage(pageNum + 1)}
                >
                  {pageNum + 1}
                </button>
              ))}
              
              <button
                style={{
                  ...styles.pageButton,
                  visibility: pagination.hasNextPage ? 'visible' : 'hidden'
                }}
                onClick={() => changePage(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportFeedback;

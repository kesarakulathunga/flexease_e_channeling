// src/pages/debug/DebugApi.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { adminService } from '../../services';
import axios from 'axios';

export default function DebugApi() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResponse, setTestResponse] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('/admin/reports/pending-feedback');
  const [apiMethod, setApiMethod] = useState('get');
  const [authEnabled, setAuthEnabled] = useState(true);
  const [requestPayload, setRequestPayload] = useState('{}');
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  
  // Report API test states
  const [activeTestTab, setActiveTestTab] = useState('api-diagnostic');
  const [reportStatus, setReportStatus] = useState('unreviewed');
  const [reportPage, setReportPage] = useState(1);
  const [reportLimit, setReportLimit] = useState(5);
  const [reportId, setReportId] = useState('');
  const [feedbackId, setFeedbackId] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('Test feedback from debug tool');
  useEffect(() => {
    // Get the base URL from the api configuration
    setBaseUrl(api.defaults.baseURL || 'Unknown');
    
    // Run initial diagnostics
    collectDiagnosticInfo();
    
    // Try to fetch a list of available endpoints if the server supports it
    fetchEndpoints();
  }, []);

  const collectDiagnosticInfo = () => {
    // Collect environment, auth, and API configuration information
    const diagnostics = {
      environment: {
        apiBaseUrl: api.defaults.baseURL,
        nodeEnv: import.meta.env.MODE,
        browserInfo: navigator.userAgent
      },
      authentication: {
        hasAuthToken: !!localStorage.getItem('authToken'),
        tokenFirstChars: localStorage.getItem('authToken') ? 
          `${localStorage.getItem('authToken').substring(0, 10)}...` : 'No token',
        isAdmin: localStorage.getItem('isAdmin') === 'true',
        userRole: localStorage.getItem('userRole') || 'Not set',
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
      },
      apiTesting: {
        recommendedEndpointsToTest: [
          '/admin/reports/pending-feedback',
          '/admin/reports',
          '/admin-reports',
          '/reports/admin'
        ]
      }
    };
    
    setDiagnosticInfo(diagnostics);
  };

  const fetchEndpoints = async () => {
    setLoading(true);
    try {
      // This will only work if your backend has a route that returns available endpoints
      const response = await api.get('/debug/routes');
      setEndpoints(response.data || []);
    } catch (err) {
      console.error('Error fetching endpoints:', err);
      setError('Server does not support endpoint discovery');
      // If that fails, we'll just use some common patterns to try
      setEndpoints([
        '/patients/reports',
        '/reports',
        '/patient/reports',
        '/api/patients/reports',
        '/api/reports',
        '/api/patient/reports'
      ]);
    } finally {
      setLoading(false);
    }
  };
  const testEndpoint = async (endpoint) => {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await api.get(endpoint);
      console.log('Response:', response);
      setTestResponse({
        endpoint,
        success: true,
        data: response
      });
    } catch (err) {
      console.error(`Error with endpoint ${endpoint}:`, err);
      setTestResponse({
        endpoint,
        success: false,
        error: err.message,
        status: err.response?.status
      });
    }
  };
  // Test report API functions
  const testGetReports = async () => {
    try {
      console.log(`Testing getReports API with status=${reportStatus}, page=${reportPage}, limit=${reportLimit}`);
      const response = await adminService.getReports(reportStatus, reportPage, reportLimit);
      console.log('Response:', response);
      setTestResponse({
        endpoint: `/admin/reports/status?status=${reportStatus}&page=${reportPage}&limit=${reportLimit}`,
        success: true,
        data: response
      });
    } catch (err) {
      console.error(`Error with getReports API:`, err);
      setTestResponse({
        endpoint: `/admin/reports/status?status=${reportStatus}&page=${reportPage}&limit=${reportLimit}`,
        success: false,
        error: err.message,
        status: err.response?.status
      });
    }
  };
  const testGetAllReports = async () => {
    try {
      console.log(`Testing getAllReports API with page=${reportPage}, limit=${reportLimit}`);
      const response = await adminService.getAllReports(reportPage, reportLimit);
      console.log('Response:', response);
      setTestResponse({
        endpoint: `/admin/reports/all?page=${reportPage}&limit=${reportLimit}`,
        success: true,
        data: response
      });
    } catch (err) {
      console.error(`Error with getAllReports API:`, err);
      setTestResponse({
        endpoint: `/admin/reports/all?page=${reportPage}&limit=${reportLimit}`,
        success: false,
        error: err.message,
        status: err.response?.status
      });
    }
  };

  const testGetReportsWithoutFeedback = async () => {
    try {
      console.log(`Testing getReportsWithoutFeedback API with page=${reportPage}, limit=${reportLimit}`);
      const response = await adminService.getReportsWithoutFeedback(reportPage, reportLimit);
      console.log('Response:', response);
      setTestResponse({
        endpoint: `/admin/reports/pending-feedback?page=${reportPage}&limit=${reportLimit}`,
        success: true,
        data: response
      });
    } catch (err) {
      console.error(`Error with getReportsWithoutFeedback API:`, err);
      setTestResponse({
        endpoint: `/admin/reports/pending-feedback?page=${reportPage}&limit=${reportLimit}`,
        success: false,
        error: err.message,
        status: err.response?.status
      });
    }
  };

  const testAddReportFeedback = async () => {
    if (!reportId) {
      setTestResponse({
        endpoint: `/admin/reports/${reportId}/feedback`,
        success: false,
        error: "Report ID is required"
      });
      return;
    }

    try {      console.log(`Testing addReportFeedback API for reportId=${reportId}`);
      const feedbackData = {
        content: feedbackContent
      };
      
      const response = await adminService.addReportFeedback(reportId, feedbackData);
      console.log('Response:', response);
      
      // Extract feedback ID from response for later use
      let extractedFeedbackId = '';
      
      if (response && response.feedback) {
        extractedFeedbackId = response.feedback.id || response.feedback._id;
      } else if (response && response.data && response.data.feedback) {
        extractedFeedbackId = response.data.feedback.id || response.data.feedback._id;
      } else if (response && typeof response === 'object' && (response.id || response._id)) {
        extractedFeedbackId = response.id || response._id;
      }
      
      if (extractedFeedbackId) {
        setFeedbackId(extractedFeedbackId);
      }
      
      setTestResponse({
        endpoint: `/admin/reports/${reportId}/feedback`,
        success: true,
        data: response,
        extractedFeedbackId
      });
    } catch (err) {
      console.error(`Error with addReportFeedback API:`, err);
      setTestResponse({
        endpoint: `/admin/reports/${reportId}/feedback`,
        success: false,
        error: err.message,
        status: err.response?.status
      });
    }
  };

  const testDeleteReportFeedback = async () => {
    if (!reportId || !feedbackId) {
      setTestResponse({
        endpoint: `/admin/reports/${reportId}/feedback/${feedbackId}`,
        success: false,
        error: "Both Report ID and Feedback ID are required"
      });
      return;
    }

    try {
      console.log(`Testing deleteReportFeedback API for reportId=${reportId}, feedbackId=${feedbackId}`);
      const response = await adminService.deleteReportFeedback(reportId, feedbackId);
      console.log('Response:', response);
      setTestResponse({
        endpoint: `/admin/reports/${reportId}/feedback/${feedbackId}`,
        success: true,
        data: response
      });
    } catch (err) {
      console.error(`Error with deleteReportFeedback API:`, err);
      setTestResponse({
        endpoint: `/admin/reports/${reportId}/feedback/${feedbackId}`,
        success: false,
        error: err.message,
        status: err.response?.status
      });
    }
  };

  const handleCustomEndpointTest = () => {
    testEndpoint(customEndpoint);
  };
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>API Debug Tool</h1>
      
      {/* Tabs for different test categories */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', display: 'flex' }}>
        <button 
          onClick={() => setActiveTestTab('general')}
          style={{ 
            padding: '10px 20px', 
            background: activeTestTab === 'general' ? '#e0e0e0' : 'transparent',
            border: 'none',
            borderBottom: activeTestTab === 'general' ? '2px solid #4CAF50' : 'none',
            margin: '0 10px'
          }}
        >
          General Tests
        </button>
        <button 
          onClick={() => setActiveTestTab('reports')}
          style={{ 
            padding: '10px 20px', 
            background: activeTestTab === 'reports' ? '#e0e0e0' : 'transparent',
            border: 'none',
            borderBottom: activeTestTab === 'reports' ? '2px solid #4CAF50' : 'none',
            margin: '0 10px'
          }}
        >
          Report APIs
        </button>
      </div>
      
      {activeTestTab === 'general' && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2>API Configuration</h2>
            <p><strong>Base URL:</strong> {baseUrl}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>Test Custom Endpoint</h2>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                style={{ flex: 1, padding: '8px', marginRight: '10px' }}
              />
              <button 
                onClick={handleCustomEndpointTest}
                style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Test
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading available endpoints...</p>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <h2>Available Endpoints</h2>
              {error ? (
                <p style={{ color: 'red' }}>{error}</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {endpoints.map((endpoint, index) => (
                    <li key={index} style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '10px', flex: 1 }}>{endpoint}</span>
                      <button 
                        onClick={() => testEndpoint(endpoint)}
                        style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
                      >
                        Test
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
      
      {activeTestTab === 'reports' && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Report API Tests</h2>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Common Parameters</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Page</label>
                <input
                  type="number"
                  min="1"
                  value={reportPage}
                  onChange={(e) => setReportPage(parseInt(e.target.value))}
                  style={{ padding: '8px', width: '80px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Limit</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={reportLimit}
                  onChange={(e) => setReportLimit(parseInt(e.target.value))}
                  style={{ padding: '8px', width: '80px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Status (for getReports)</label>
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value)}
                  style={{ padding: '8px', height: '35px' }}
                >
                  <option value="unreviewed">Unreviewed</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>
            </div>
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Get Reports</h3>
            <p>Test retrieving reports with filtering by status</p>
            <button 
              onClick={testGetReports}
              style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Test getReports({reportStatus}, {reportPage}, {reportLimit})
            </button>
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Get All Reports</h3>
            <p>Test retrieving all reports regardless of status</p>
            <button 
              onClick={testGetAllReports}
              style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Test getAllReports({reportPage}, {reportLimit})
            </button>
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Get Reports Without Feedback</h3>
            <p>Test retrieving reports that need feedback</p>
            <button 
              onClick={testGetReportsWithoutFeedback}
              style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Test getReportsWithoutFeedback({reportPage}, {reportLimit})
            </button>
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Add Feedback to Report</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Report ID</label>
                <input
                  type="text"
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  style={{ padding: '8px', width: '100%' }}
                  placeholder="Enter the ID of a report from the list above"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Feedback Content</label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  style={{ padding: '8px', width: '100%', minHeight: '80px' }}
                  placeholder="Enter feedback content"
                />
              </div>
            </div>
            <button 
              onClick={testAddReportFeedback}
              style={{ 
                padding: '8px 16px', 
                background: reportId ? '#2196F3' : '#ccc', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px' 
              }}
              disabled={!reportId}
            >
              Test addReportFeedback
            </button>
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Delete Feedback</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Report ID</label>
                <input
                  type="text"
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  style={{ padding: '8px', width: '100%' }}
                  placeholder="Enter Report ID"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Feedback ID</label>
                <input
                  type="text"
                  value={feedbackId}
                  onChange={(e) => setFeedbackId(e.target.value)}
                  style={{ padding: '8px', width: '100%' }}
                  placeholder="Enter Feedback ID (available after adding feedback)"
                />
              </div>
            </div>
            <button 
              onClick={testDeleteReportFeedback}
              style={{ 
                padding: '8px 16px', 
                background: (reportId && feedbackId) ? '#f44336' : '#ccc', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px' 
              }}
              disabled={!reportId || !feedbackId}
            >
              Test deleteReportFeedback
            </button>
          </div>
        </div>
      )}

      {testResponse && (
        <div style={{ marginTop: '30px', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <h2>Test Result for: {testResponse.endpoint}</h2>
          <div style={{ 
            padding: '12px', 
            background: testResponse.success ? '#E8F5E9' : '#FFEBEE', 
            border: `1px solid ${testResponse.success ? '#4CAF50' : '#F44336'}`,
            borderRadius: '4px'
          }}>
            <p><strong>Status:</strong> {testResponse.success ? 'Success' : `Failed (${testResponse.status || 'N/A'})`}</p>
            
            {testResponse.extractedFeedbackId && (
              <div style={{ marginBottom: '10px', padding: '10px', background: '#FFFDE7', border: '1px solid #FBC02D', borderRadius: '4px' }}>
                <p><strong>Extracted Feedback ID:</strong> {testResponse.extractedFeedbackId}</p>
                <p>This ID has been copied to the Feedback ID field for deletion testing.</p>
              </div>
            )}
            
            {testResponse.success ? (
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                overflowX: 'auto',
                maxHeight: '400px',
                background: '#f8f8f8',
                padding: '10px',
                borderRadius: '4px'
              }}>
                {JSON.stringify(testResponse.data, null, 2)}
              </pre>
            ) : (
              <p><strong>Error:</strong> {testResponse.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/debug/ApiDiagnostic.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { adminService } from '../../services';
import axios from 'axios';

export default function ApiDiagnostic() {
  const [baseUrl, setBaseUrl] = useState('');
  const [testResponse, setTestResponse] = useState(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [customEndpoint, setCustomEndpoint] = useState('/admin/reports/pending-feedback');
  const [apiMethod, setApiMethod] = useState('get');
  const [authEnabled, setAuthEnabled] = useState(true);
  const [requestPayload, setRequestPayload] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [routeVariations, setRouteVariations] = useState([]);

  useEffect(() => {
    // Get the base URL from the api configuration
    setBaseUrl(api.defaults.baseURL || 'Unknown');
    
    // Run initial diagnostics
    collectDiagnosticInfo();
    
    // Generate route variations for testing
    generateRouteVariations();
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
      }
    };
    
    setDiagnosticInfo(diagnostics);
  };
  const generateRouteVariations = () => {    // Generate variations of report endpoints to test
    const baseEndpoints = [
      '/admin/reports/all',
      '/admin/reports/status',
      '/admin/reports/pending-feedback',
      '/admin/reports'  // Keep for comparison but this one fails
    ];
    
    const queryParams = [
      '',
      '?page=1&limit=5',
      '?status=unreviewed&page=1&limit=5'
    ];
    
    const variations = [];
    baseEndpoints.forEach(base => {
      queryParams.forEach(params => {
        variations.push(`${base}${params}`);
      });
      
      // Add pending-feedback variations
      variations.push(`${base}/pending-feedback`);
      variations.push(`${base}/pending-feedback?page=1&limit=5`);
      
      // Add feedback variations
      variations.push(`${base}/123/feedback`);
    });
    
    setRouteVariations(variations);
  };

  const testEndpoint = async (endpoint) => {
    setLoading(true);
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      
      let response;
      if (authEnabled) {
        // Use the api instance with auth interceptors
        response = await api.get(endpoint);
      } else {
        // Use axios directly without auth
        const fullUrl = `${api.defaults.baseURL}${endpoint}`;
        console.log(`Testing without auth token: ${fullUrl}`);
        response = await axios.get(fullUrl);
        response = response.data; // Match the format from api interceptor
      }
      
      console.log('Response:', response);
      setTestResponse({
        endpoint,
        success: true,
        data: response,
        details: {
          fullUrl: `${api.defaults.baseURL}${endpoint}`,
          withAuth: authEnabled,
          method: 'GET'
        }
      });
    } catch (err) {
      console.error(`Error with endpoint ${endpoint}:`, err);
      setTestResponse({
        endpoint,
        success: false,
        error: err.message,
        status: err.response?.status,
        details: {
          fullUrl: `${api.defaults.baseURL}${endpoint}`,
          withAuth: authEnabled,
          method: 'GET',
          responseData: err.response?.data
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const testCustomRequest = async () => {
    setLoading(true);
    try {
      let payload = {};
      try {
        if (requestPayload && requestPayload.trim() !== '{}') {
          payload = JSON.parse(requestPayload);
        }
      } catch (jsonErr) {
        console.error('Invalid JSON payload:', jsonErr);
        setTestResponse({
          endpoint: customEndpoint,
          success: false,
          error: `Invalid JSON payload: ${jsonErr.message}`
        });
        setLoading(false);
        return;
      }

      console.log(`Testing custom request: ${apiMethod.toUpperCase()} ${customEndpoint}`);
      console.log('Payload:', payload);
      
      let response;
      if (authEnabled) {
        // Use the api instance with auth interceptors
        switch (apiMethod.toLowerCase()) {
          case 'get':
            response = await api.get(customEndpoint);
            break;
          case 'post':
            response = await api.post(customEndpoint, payload);
            break;
          case 'put':
            response = await api.put(customEndpoint, payload);
            break;
          case 'delete':
            response = await api.delete(customEndpoint);
            break;
          default:
            response = await api.get(customEndpoint);
        }
      } else {
        // Use axios directly without auth
        const fullUrl = `${api.defaults.baseURL}${customEndpoint}`;
        console.log(`Testing without auth token: ${fullUrl}`);
        
        switch (apiMethod.toLowerCase()) {
          case 'get':
            response = await axios.get(fullUrl);
            break;
          case 'post':
            response = await axios.post(fullUrl, payload);
            break;
          case 'put':
            response = await axios.put(fullUrl, payload);
            break;
          case 'delete':
            response = await axios.delete(fullUrl);
            break;
          default:
            response = await axios.get(fullUrl);
        }
        response = response.data; // Match the format from api interceptor
      }
      
      console.log('Response:', response);
      setTestResponse({
        endpoint: customEndpoint,
        success: true,
        data: response,
        details: {
          fullUrl: `${api.defaults.baseURL}${customEndpoint}`,
          withAuth: authEnabled,
          method: apiMethod.toUpperCase(),
          payload
        }
      });
    } catch (err) {
      console.error(`Error with custom request:`, err);
      setTestResponse({
        endpoint: customEndpoint,
        success: false,
        error: err.message,
        status: err.response?.status,
        details: {
          fullUrl: `${api.defaults.baseURL}${customEndpoint}`,
          withAuth: authEnabled,
          method: apiMethod.toUpperCase(),
          responseData: err.response?.data
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetReportsWithoutFeedback = async () => {
    setLoading(true);
    try {
      console.log(`Testing getReportsWithoutFeedback API`);
      const response = await adminService.getReportsWithoutFeedback(1, 5);
      console.log('Response:', response);
      setTestResponse({
        endpoint: `/admin/reports/pending-feedback?page=1&limit=5`,
        success: true,
        data: response,
        details: {
          withAuth: true,
          method: 'GET',
          service: 'adminService.getReportsWithoutFeedback'
        }
      });
    } catch (err) {
      console.error(`Error with getReportsWithoutFeedback API:`, err);
      setTestResponse({
        endpoint: `/admin/reports/pending-feedback?page=1&limit=5`,
        success: false,
        error: err.message,
        status: err.response?.status,
        details: {
          withAuth: true,
          method: 'GET',
          service: 'adminService.getReportsWithoutFeedback',
          responseData: err.response?.data
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>API Diagnostic Tool</h1>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>        <h2>API Endpoint Overview</h2>
        <p>The UI has been simplified to only show two tabs:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
          <li><strong>Needs Feedback</strong> - Shows only reports waiting for feedback</li>
          <li><strong>All Reports</strong> - Shows all reports regardless of feedback status</li>
        </ul>
        <p>These tabs use the following API endpoints:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
          <li><code>getReportsWithoutFeedback</code> uses <code>/admin/reports/pending-feedback</code></li>
          <li><code>getAllReports</code> uses <code>/admin/reports/all</code></li>
        </ul>
        <p>The unused <code>/admin/reports</code> endpoint is not functional and returns 404 errors.</p>
      </div>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h2>System Information</h2>
        {diagnosticInfo ? (
          <div>
            <h3>Environment</h3>
            <div style={{ marginBottom: '10px' }}>
              <p><strong>API Base URL:</strong> {diagnosticInfo.environment.apiBaseUrl}</p>
              <p><strong>Mode:</strong> {diagnosticInfo.environment.nodeEnv}</p>
            </div>
            
            <h3>Authentication</h3>
            <div style={{ marginBottom: '10px' }}>
              <p><strong>Auth Token:</strong> {diagnosticInfo.authentication.hasAuthToken ? 'Present' : 'Not found'}</p>
              {diagnosticInfo.authentication.hasAuthToken && (
                <p><strong>Token Preview:</strong> {diagnosticInfo.authentication.tokenFirstChars}</p>
              )}
              <p><strong>User Role:</strong> {diagnosticInfo.authentication.userRole}</p>
              <p><strong>Is Admin:</strong> {diagnosticInfo.authentication.isAdmin ? 'Yes' : 'No'}</p>
            </div>
            
            {diagnosticInfo.authentication.user && (
              <div style={{ marginBottom: '10px' }}>
                <h3>User Information</h3>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  padding: '10px',
                  background: '#f8f8f8',
                  borderRadius: '4px'
                }}>
                  {JSON.stringify(diagnosticInfo.authentication.user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p>Loading diagnostic information...</p>
        )}
      </div>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h2>Test Pending-Feedback Route</h2>
        <p>This tests the route that works based on your console logs.</p>
        <button 
          onClick={testGetReportsWithoutFeedback}
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            background: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test Reports Without Feedback API'}
        </button>
      </div>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h2>Custom API Request</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Endpoint</label>
          <input
            type="text"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            placeholder="/admin/reports or /admin/reports/pending-feedback"
          />
        
          <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Method</label>
              <select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value)}
                style={{ padding: '8px', height: '35px' }}
              >
                <option value="get">GET</option>
                <option value="post">POST</option>
                <option value="put">PUT</option>
                <option value="delete">DELETE</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>With Auth Token</label>
              <input
                type="checkbox"
                checked={authEnabled}
                onChange={(e) => setAuthEnabled(e.target.checked)}
                style={{ marginTop: '10px' }}
              />
            </div>
          </div>
          
          {apiMethod === 'post' || apiMethod === 'put' ? (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Request Payload (JSON)</label>
              <textarea
                value={requestPayload}
                onChange={(e) => setRequestPayload(e.target.value)}
                style={{ width: '100%', padding: '8px', minHeight: '100px', fontFamily: 'monospace' }}
                placeholder='{"key": "value"}'
              />
            </div>
          ) : null}
        </div>
        
        <button 
          onClick={testCustomRequest}
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Sending Request...' : 'Send Request'}
        </button>
      </div>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd',
        borderRadius: '8px' 
      }}>
        <h2>Route Variations to Try</h2>
        <p>Click on any route to test it with GET request</p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '10px',
          marginTop: '15px'
        }}>
          {routeVariations.map((route, index) => (
            <button
              key={index}
              onClick={() => testEndpoint(route)}
              style={{ 
                padding: '8px', 
                textAlign: 'left',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {route}
            </button>
          ))}
        </div>
      </div>
      
      {testResponse && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          <h2>Test Result</h2>
          <div style={{ marginBottom: '10px' }}>
            <p><strong>Endpoint:</strong> {testResponse.endpoint}</p>
            {testResponse.details && (
              <>
                <p><strong>Full URL:</strong> {testResponse.details.fullUrl}</p>
                <p><strong>Method:</strong> {testResponse.details.method}</p>
                <p><strong>With Auth:</strong> {testResponse.details.withAuth ? 'Yes' : 'No'}</p>
                {testResponse.details.service && (
                  <p><strong>Service:</strong> {testResponse.details.service}</p>
                )}
              </>
            )}
          </div>
          
          <div style={{ 
            padding: '15px', 
            background: testResponse.success ? '#E8F5E9' : '#FFEBEE', 
            border: `1px solid ${testResponse.success ? '#4CAF50' : '#F44336'}`,
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <p><strong>Status:</strong> {testResponse.success ? 'Success' : `Failed (${testResponse.status || 'N/A'})`}</p>
            {!testResponse.success && <p><strong>Error:</strong> {testResponse.error}</p>}
          </div>
          
          {testResponse.details && testResponse.details.payload && (
            <div style={{ marginBottom: '15px' }}>
              <h3>Request Payload</h3>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                overflowX: 'auto',
                maxHeight: '200px',
                background: '#f8f8f8',
                padding: '10px',
                borderRadius: '4px'
              }}>
                {JSON.stringify(testResponse.details.payload, null, 2)}
              </pre>
            </div>
          )}
          
          <div>
            <h3>Response Data</h3>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              overflowX: 'auto',
              maxHeight: '400px',
              background: '#f8f8f8',
              padding: '10px',
              borderRadius: '4px'
            }}>
              {testResponse.success
                ? JSON.stringify(testResponse.data, null, 2)
                : JSON.stringify(testResponse.details?.responseData || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

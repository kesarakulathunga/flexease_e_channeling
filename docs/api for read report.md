# Patient API for Viewing Feedback on Their Reports

Based on our implementation, here's a comprehensive guide to using the patient feedback API from the frontend.

## API Endpoint Details

**Endpoint:** `GET /api/patients/reports/:id/feedback`

**Purpose:** Allows patients to view feedback on their medical reports

**Authentication:** JWT token with patient role required

## Request Details

### URL Parameters
- `:id` - The report ID for which the patient wants to view feedback

### Headers
- `Authorization: Bearer {patientToken}` - JWT token with patient role
- `Content-Type: application/json`

### Example Request (JavaScript/Axios)
```javascript
import axios from 'axios';

const fetchReportFeedback = async (reportId, patientToken) => {
  try {
    const response = await axios.get(
      `http://localhost:4000/api/patients/reports/${reportId}/feedback`,
      {
        headers: {
          Authorization: `Bearer ${patientToken}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "reportId": 7,
  "reportTitle": "Blood Test Results",
  "uploadedAt": "2025-05-18T10:51:34.383Z",
  "feedback": [
    {
      "id": 3,
      "message": "Your cholesterol levels are slightly elevated. Consider reducing intake of saturated fats.",
      "createdAt": "2025-05-18T12:35:52.238Z",
      "admin": {
        "id": 1,
        "name": "Dr. Sarah Johnson"
      }
    },
    {
      "id": 5,
      "message": "Blood pressure readings look normal. Continue with current medication.",
      "createdAt": "2025-05-18T14:22:10.456Z",
      "admin": {
        "id": 2,
        "name": "Dr. Michael Chen"
      }
    }
  ]
}
```

### Error Responses

#### Report Not Found (404)
```json
{
  "success": false,
  "message": "Report not found"
}
```

#### Unauthorized Access (403)
```json
{
  "success": false,
  "message": "You do not have permission to view this report"
}
```

#### Invalid Token (401)
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Server error while fetching feedback"
}
```

## Frontend Implementation Example

Here's a complete React component example to implement the feedback viewing functionality:

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PatientFeedback.css';

const PatientFeedback = ({ reportId, patientToken }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:4000/api/patients/reports/${reportId}/feedback`,
          {
            headers: {
              Authorization: `Bearer ${patientToken}`
            }
          }
        );
        
        setFeedbackData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError(
          err.response?.data?.message || 
          'Unable to load feedback. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (reportId && patientToken) {
      fetchFeedback();
    }
  }, [reportId, patientToken]);

  if (loading) {
    return <div className="feedback-loading">Loading feedback...</div>;
  }

  if (error) {
    return <div className="feedback-error">Error: {error}</div>;
  }

  if (!feedbackData || !feedbackData.feedback || feedbackData.feedback.length === 0) {
    return <div className="no-feedback">No feedback available yet for this report.</div>;
  }

  return (
    <div className="patient-feedback-container">
      <h3>Medical Feedback for: {feedbackData.reportTitle}</h3>
      <p className="report-date">
        Report Date: {new Date(feedbackData.uploadedAt).toLocaleDateString()}
      </p>
      
      <div className="feedback-list">
        {feedbackData.feedback.map(item => (
          <div key={item.id} className="feedback-item">
            <div className="feedback-content">{item.message}</div>
            <div className="feedback-meta">
              <span className="feedback-author">From: {item.admin.name}</span>
              <span className="feedback-date">
                {new Date(item.createdAt).toLocaleDateString()} at {' '}
                {new Date(item.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientFeedback;
```

## CSS Styling

```css
.patient-feedback-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h3 {
  color: #2c3e50;
  margin-top: 0;
}

.report-date {
  color: #7f8c8d;
  font-style: italic;
  margin-bottom: 20px;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.feedback-item {
  background-color: white;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.feedback-content {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.feedback-meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #7f8c8d;
  border-top: 1px solid #ecf0f1;
  padding-top: 10px;
}

.feedback-author {
  font-weight: 500;
}

.feedback-date {
  font-style: italic;
}

.feedback-loading,
.feedback-error,
.no-feedback {
  padding: 20px;
  text-align: center;
  border-radius: 6px;
}

.feedback-loading {
  background-color: #f8f9fa;
  color: #2c3e50;
}

.feedback-error {
  background-color: #ffebee;
  color: #c0392b;
}

.no-feedback {
  background-color: #e8f4fd;
  color: #3498db;
  font-style: italic;
}
```

## Key Security Considerations

1. **Token Management**: Store the patient token securely, preferably in an HTTP-only cookie
2. **Permission Checks**: The API verifies that patients can only access their own reports
3. **Data Validation**: Validate the report ID before making the API call
4. **Error Handling**: Display user-friendly error messages
5. **Refresh Mechanism**: Implement token refresh if tokens expire during a session

## Integration with Authentication

This API should be integrated with your existing authentication system:

```javascript
// In your authentication service
const loginPatient = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', { email, password });
    
    if (response.data.success) {
      // Store token in secure storage
      localStorage.setItem('patientToken', response.data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};

// Then use the token from storage when needed
const getPatientToken = () => localStorage.getItem('patientToken');
```

By following this guide, your frontend will correctly integrate with the patient feedback API, allowing patients to securely view feedback on their medical reports.
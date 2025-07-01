# Report Feedback Frontend Implementation Guide

This guide provides implementation details for viewing report feedback in a frontend application.

## API Endpoint

The backend provides the following endpoint to retrieve feedback for a specific report:

```
GET /api/patients/reports/{reportId}/feedback
```

### Authorization

All requests must include a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Query Parameters

The API supports the following query parameters:

- `page` (default: 1) - Page number for pagination
- `limit` (default: 10) - Number of items per page
- `format` (optional: 'simple') - Simplified response format
- `sort` (optional: 'asc' or 'desc') - Sort order for feedback items

### Response Structure

A successful response will have the following structure:

```json
{
  "success": true,
  "reportId": 8,
  "reportTitle": "test new",
  "uploadedAt": "2025-05-18T15:56:11.270Z",
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "feedback": [
    {
      "id": 4,
      "message": "goodddddd",
      "createdAt": "2025-05-18T15:56:54.407Z",
      "adminId": 1
    }
  ]
}
```

## Implementation Options

We've provided two different implementation options:

1. **React Component (ReportFeedback.jsx)** - For modern React-based applications
2. **HTML/JavaScript (report-feedback-viewer.html)** - Simple standalone implementation

## Option 1: React Component Integration

### Prerequisites
- React application
- Axios for API requests
- React Router (for URL params)

### Integration Steps

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install axios react-router-dom
   ```

2. **Environment Configuration**:
   Create or update your `.env` file with:
   ```
   REACT_APP_API_URL=http://localhost:4000/api
   ```

3. **Add the ReportFeedback Component**:
   Copy the provided `ReportFeedback.jsx` file into your components directory.

4. **Set Up Routing**:
   In your routes configuration:
   ```jsx
   import ReportFeedback from './components/ReportFeedback';
   
   // In your routes configuration
   <Route path="/reports/:reportId/feedback" element={<ReportFeedback />} />
   ```

5. **Authentication Integration**:
   Ensure your authentication system stores the JWT token in localStorage with the key 'token'

## Option 2: Standalone HTML Implementation

### Integration Steps

1. **Deployment**:
   - Copy the `report-feedback-viewer.html` file to your web server
   - Or open directly in a browser for testing

2. **API Configuration**:
   - Update the `API_BASE_URL` constant in the script if your API is hosted elsewhere

3. **Login Requirements**:
   - The implementation includes a simple login form
   - Update the login endpoint if necessary
   - Authentication token is stored in localStorage

4. **Usage**:
   - Log in with valid credentials
   - Enter a report ID and click "Load Feedback"
   - View the feedback results and use pagination if available

## Customization

Both implementations can be customized:

- **Styling**: Update the CSS/styles for your design system
- **Error Handling**: Enhance error messaging as needed
- **Authentication**: Integrate with your existing auth system
- **Additional Features**: Add search, filtering, or other features by extending the query parameters

## Testing

You can test these implementations against the same API endpoint used in the `test-feedback-api-simple.js` script.

## Common Issues and Solutions

1. **CORS Errors**: Ensure your backend allows cross-origin requests from your frontend domain
2. **Authentication Errors**: Verify the JWT token is being correctly stored and sent in the Authorization header
3. **Token Expiration**: Implement token refresh logic for longer sessions

## Sample API Requests

**Basic Request**:
```javascript
fetch('http://localhost:4000/api/patients/reports/8/feedback', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

**With Pagination and Sorting**:
```javascript
fetch('http://localhost:4000/api/patients/reports/8/feedback?page=1&limit=5&sort=desc', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

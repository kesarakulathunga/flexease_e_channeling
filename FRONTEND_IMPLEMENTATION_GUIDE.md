# Frontend Implementation Guide for Profile Editing

This guide provides instructions for integrating your existing frontend components with the new backend profile editing features.

## Overview

The backend implementation supports the following features:
1. View patient profile
2. Update basic profile information (name, age, NIC number, mobile number)
3. Change email address with OTP verification

Your existing frontend components (`EditProfile.jsx` and `EditProfileEmail.jsx`) already support these features, but need to be connected to the new backend API endpoints.

## API Endpoint Mapping

| Frontend Expected Endpoint | Backend Implementation | HTTP Method | Purpose |
|----------------------------|------------------------|-------------|---------|
| `/patients/profiles/:profileId` | `/api/profile/patient/:id` | GET | Retrieve patient profile |
| `/patients/profiles/:profileId` | `/api/profile/patient/:id` | PUT | Update basic profile info |
| `/patients/update-email/initiate` | `/api/profile/email/initiate-change` | POST | Initiate email change |
| `/patients/update-email/verify` | `/api/profile/email/verify-change` | POST | Verify email change OTP |

## Integration Options

### Option 1: Update Frontend API Calls (Recommended)

Update your API service or components to use the new endpoint structure:

```javascript
// Example API service update
const apiService = {
  // Change from:
  // getProfile: (id) => axios.get(`/patients/profiles/${id}`),
  // To:
  getProfile: (id) => axios.get(`/api/profile/patient/${id}`),

  // Change from:
  // updateProfile: (id, data) => axios.put(`/patients/profiles/${id}`, data),
  // To:
  updateProfile: (id, data) => axios.put(`/api/profile/patient/${id}`, data),

  // Change from:
  // initiateEmailChange: (data) => axios.post('/patients/update-email/initiate', data),
  // To:
  initiateEmailChange: (data) => axios.post('/api/profile/email/initiate-change', data),

  // Change from:
  // verifyEmailChange: (data) => axios.post('/patients/update-email/verify', data),
  // To:
  verifyEmailChange: (data) => axios.post('/api/profile/email/verify-change', data),
};
```



## Request/Response Format Details

### 1. Get Patient Profile

**Request:**
```
GET /api/profile/patient/:id
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": 123,
  "email": "patient@example.com",
  "fullName": "Patient Name",
  "age": 35,
  "nicNumber": "NIC12345",
  "mobileNumber": "1234567890",
  "createdAt": "2025-05-14T10:30:00Z",
  "updatedAt": "2025-05-14T11:45:00Z"
}
```

### 2. Update Basic Profile Info

**Request:**
```
PUT /api/profile/patient/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "age": 36,
  "nicNumber": "NIC54321",
  "mobileNumber": "9876543210"
}
```

**Response:**
```json
{
  "id": 123,
  "email": "patient@example.com",
  "fullName": "Updated Name",
  "age": 36,
  "nicNumber": "NIC54321",
  "mobileNumber": "9876543210",
  "createdAt": "2025-05-14T10:30:00Z",
  "updatedAt": "2025-05-14T12:15:00Z"
}
```

### 3. Initiate Email Change

**Request:**
```
POST /api/profile/email/initiate-change
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "newEmail": "new.email@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to new email address"
}
```

### 4. Verify Email Change

**Request:**
```
POST /api/profile/email/verify-change
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "newEmail": "new.email@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email updated successfully",
  "profile": {
    "id": 123,
    "email": "new.email@example.com",
    "fullName": "Updated Name",
    "age": 36,
    "nicNumber": "NIC54321",
    "mobileNumber": "9876543210",
    "createdAt": "2025-05-14T10:30:00Z",
    "updatedAt": "2025-05-14T12:45:00Z"
  },
  "token": "new.jwt.token"
}
```

## Error Response Formats

The backend returns standardized error responses:

### Validation Error
```json
{
  "error": {
    "message": "Missing required fields"
  }
}
```

### Authentication Error
```json
{
  "error": {
    "message": "Unauthorized access to profile"
  }
}
```

### OTP Verification Error
```json
{
  "error": {
    "message": "Invalid or expired verification code"
  }
}
```

### Conflict Error
```json
{
  "error": {
    "message": "Email is already in use by another account"
  }
}
```

## Frontend Component Updates

### EditProfile.jsx Updates

Your `EditProfile.jsx` component already handles:
- Loading profile data
- Allowing users to edit fields
- Saving changes or canceling the operation
- Special handling for email changes

You may need to modify the API call functions to match the new endpoints, but the component logic should remain the same.

### EditProfileEmail.jsx Updates

Your `EditProfileEmail.jsx` component already handles:
- Receiving new email address from main edit profile component
- Managing the two-step OTP verification process
- Showing success message after verification
- Returning to dashboard after successful email change

You may need to update:
1. The endpoints for initiating email change and verifying OTP
2. The handling of the new JWT token returned after email change

## AuthContext Updates

After successful email change, you'll receive a new JWT token. Make sure your AuthContext properly updates:

```javascript
// In your AuthContext
const updateUserEmailAndToken = (newEmail, newToken) => {
  // Update user email
  setUser(prevUser => ({
    ...prevUser,
    email: newEmail
  }));
  
  // Update token
  setToken(newToken);
  localStorage.setItem('token', newToken);
  
  // Update axios default headers if using global configuration
  if (axios.defaults) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }
};
```

## Testing Integration

To validate the integration:

1. Test the profile viewing functionality:
   - Navigate to profile page
   - Verify all fields are correctly displayed

2. Test basic profile updates:
   - Edit non-email fields
   - Save changes
   - Verify updates appear in the profile view

3. Test email change process:
   - Start email change from the profile page
   - Verify OTP is sent to new email
   - Complete verification with OTP
   - Verify new email is displayed and user stays logged in

4. Test error handling:
   - Try updating with invalid data
   - Try changing to an email already in use
   - Try verifying with incorrect OTP

## Troubleshooting

### Common Issues

1. **Authentication errors:**
   - Verify token is correctly included in headers
   - Check token expiration
   - Ensure user is authorized to edit the profile

2. **Missing fields in response:**
   - Check serialization in backend
   - Verify all expected fields are returned

3. **OTP verification issues:**
   - Verify correct email is used
   - Check OTP expiration (5 minutes)
   - Ensure proper error handling for invalid OTPs

### Debugging Tips

1. Use browser developer tools to inspect API requests/responses
2. Check application logs for detailed error messages
3. Verify JWT token is correctly updated after email change
4. Test routes directly with Postman before frontend integration

## Conclusion

This integration should be straightforward since your frontend components already follow the expected flow. The main changes will be in the API endpoints and possibly handling the JWT token update after email change.

For assistance with specific integration issues, please refer to the backend implementation details or contact the development team.

# Testing Without a Backend Database

Since you're experiencing database connection issues in your backend, here's a guide to test your frontend OTP verification without relying on the backend.

## Testing Options

### 1. Using Browser Console Mock Functions (Easiest)

We've added a special function to the browser console that simulates OTP verification:

1. Open your browser console (F12)
2. Visit the verification page
3. Enter email and request OTP (this will fail due to the backend issue)
4. After entering an OTP, run this in console:
   ```javascript
   window.mockVerifyOTP('your@email.com', '123456');
   ```
5. This will simulate a successful verification and store mock auth tokens

This method is quick but only works for manual testing.

### 2. Using the Mock API Module (More Complete)

For more thorough testing, you can integrate the mock API module we've created:

1. Open `src/services/api.js`
2. Add the mock API support:

```javascript
// At the top of the file
import mockApi from '../utils/mock-api';

// Before making real API calls in your request interceptor:
api.interceptors.request.use(
  (config) => {
    // If mocking is enabled, intercept the request
    if (mockApi.isMockApiEnabled()) {
      const { method, url, data } = config;
      console.log(`Mock API intercepting: ${method} ${url}`);
      
      // Match the endpoint and return mock data
      if (url === '/auth/verify-email' && method === 'post') {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        const { email, otp, purpose } = parsedData;
        
        // Create a mock response
        return Promise.resolve({
          data: mockApi.mockVerifyOtp(email, otp, purpose)
        });
      }
      
      if (url === '/auth/check-email' && method === 'post') {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        const { email, isResend, purpose } = parsedData;
        
        // Create a mock response
        return Promise.resolve({
          data: mockApi.mockCheckEmail(email, isResend, purpose)
        });
      }
      
      // Add other endpoints as needed
    }
    
    // Continue with the real API call if not mocked
    return config;
  },
  (error) => Promise.reject(error)
);
```

3. Enable mocking in your development environment:
```javascript
// In main.jsx or similar startup file
import mockApi from './utils/mock-api';

if (import.meta.env.DEV) {
  // Enable mock API for development
  mockApi.enableMockApi(true);
  console.log('Mock API enabled for development');
  
  // Make the control available in browser console
  window.toggleMockApi = mockApi.enableMockApi;
}
```

## Database Connection Fix Instructions

To fix the actual database connection issue:

1. Check if PostgreSQL is running:
   ```powershell
   Get-Service -Name 'postgresql*'
   ```

2. Start PostgreSQL if it's not running:
   ```powershell
   Start-Service -Name 'postgresql*'
   ```

3. Check the connection string in your backend `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

4. Restart your backend server after fixing the database connection.

## Verifying Your OTP Implementation

Your current OTP implementation in `appointmentService.js` is correctly handling:
- Input validation
- OTP format validation with regex
- Whitespace trimming
- Error handling

Once the database connection is fixed, this implementation should work properly.

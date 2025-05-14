# Database Connection Troubleshooting Guide

## Issue Identified

The error logs show that your application is experiencing a database connection error:
```
Invalid `prisma.patientProfile.findMany()` invocation
Can't reach database server at `localhost:5432`
Please make sure your database server is running at `localhost:5432`.
```

This is a PostgreSQL connection issue, not a problem with your OTP verification logic.

## Steps to Resolve

1. **Check if PostgreSQL is running**:
   ```powershell
   # Check if PostgreSQL service is running
   Get-Service -Name 'postgresql*'
   ```
   
   If it's not running, start it:
   ```powershell
   # Start PostgreSQL service
   Start-Service -Name 'postgresql*'
   ```

2. **Verify PostgreSQL connection**:
   ```powershell
   # Using psql (if installed)
   psql -h localhost -p 5432 -U postgres -c "SELECT 1"
   
   # Or check if port 5432 is listening
   netstat -an | findstr 5432
   ```

3. **Check backend configuration**:
   - Verify that your `.env` file in the backend folder has the correct database connection string
   - Typical format: `DATABASE_URL="postgresql://username:password@localhost:5432/database_name"`

4. **Restart the backend server** after fixing database connection issues

## OTP Verification Implementation Status

Your OTP verification implementation in the frontend looks correct:

1. The `appointmentService.verifyAppointmentOTP` function has proper:
   - Parameter validation
   - OTP format checking with regex `/^\d{6}$/`
   - Whitespace trimming for both email and OTP
   - Proper error handling

2. Once the database connection is fixed, the OTP verification should work correctly.

## Temporary Testing Workaround

If you need to test the frontend without the backend database:

1. You can create a mock API response in your debug utility:
   ```javascript
   window.mockVerifyOTP = async (email, otp) => {
     console.log(`Mock verification for ${email} with OTP ${otp}`);
     return {
       success: true,
       user: { email },
       token: "mock-token-for-testing",
       profiles: [{
         id: "mock-profile-1",
         name: "Test User",
         age: 30,
         email: email
       }]
     };
   };
   ```

2. Call this from the browser console to simulate a successful response

# Implementation Details: "View Your Profile" Feature

This document outlines the technical implementation details of the "View Your Profile" feature, focusing on code differences between flows, architectural decisions, and key technical considerations.

## Architecture Overview

The "View Your Profile" feature extends the existing authentication framework with a parameterized approach to handle different user flows while maintaining backward compatibility.

### Key Components

1. **Authentication Service**
   - OTP generation and verification
   - Email existence checking
   - Profile selection
   - Session token issuance

2. **Account Verification Flow**
   - Email verification
   - OTP validation
   - Profile selection (if multiple profiles exist)

3. **Dashboard Integration**
   - Direct navigation after authentication

## Code Differences

### 1. OTP Service

The OTP service has been enhanced to support the `purpose` parameter:

```javascript
// Before
async function sendOtp(email, context, patientId = null) {
  const code = genCode();
  await storeOtp(email, code, context, patientId);
  console.log(`[${context}] OTP for ${email}${patientId ? ` (patient ${patientId})` : ''}: ${code}`);
}

// After
async function sendOtp(email, context, patientId = null, purpose = 'registration') {
  const code = genCode();
  await storeOtp(email, code, context, patientId, purpose);
  console.log(`[${context}] OTP for ${email}${patientId ? ` (patient ${patientId})` : ''} (purpose: ${purpose}): ${code}`);
}
```

### 2. Auth Controller

The email check endpoint now handles the purpose parameter:

```javascript
// Before
exports.checkEmailAndSendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Check if patient with this email exists
    const patients = await prisma.patientProfile.findMany({
      where: { email }
    });
    
    // Send OTP regardless of whether email exists or not
    await sendOtp(email, 'LOGIN', null);
    
    // Return whether email exists and patient profiles if they do
    if (patients.length > 0) {
      res.json({ 
        emailExists: true, 
        patients: patients,
        message: 'OTP sent'
      });
    } else {
      res.json({ 
        emailExists: false,
        message: 'OTP sent'
      });
    }
  } catch (err) { next(err); }
};

// After
exports.checkEmailAndSendOtp = async (req, res, next) => {
  try {
    const { email, purpose = 'registration' } = req.body;
    
    // Check if patient with this email exists
    const patients = await prisma.patientProfile.findMany({
      where: { email }
    });
    
    // If purpose is view_profile and no patients exist, return error
    if (purpose === 'view_profile' && patients.length === 0) {
      return res.status(404).json({ 
        error: 'No profile found for this email. Please make an appointment first.',
        emailExists: false
      });
    }
    
    // Send OTP with specified purpose
    await sendOtp(email, 'LOGIN', null, purpose);
    
    // Return whether email exists and patient profiles if they do
    if (patients.length > 0) {
      res.json({ 
        emailExists: true, 
        patients: patients,
        message: 'OTP sent'
      });
    } else {
      res.json({ 
        emailExists: false,
        message: 'OTP sent'
      });
    }
  } catch (err) { next(err); }
};
```

### 3. Database Schema

Added a new `purpose` field to the OTP model:

```prisma
model OTP {
  id        Int        @id @default(autoincrement())
  email     String
  code      String
  context   OTPContext
  patientId Int?
  purpose   String     @default("registration")  // New field
  expiresAt DateTime
  used      Boolean    @default(false)
  createdAt DateTime   @default(now())
}
```

## Flow Control Logic

The feature uses the following flow control logic to distinguish between "Make Appointment" and "View Your Profile":

1. **Purpose Parameter**: 
   - The `purpose` parameter (`registration` or `view_profile`) is passed through each step of the authentication process
   - Default value is `registration` for backward compatibility

2. **Email Existence Check**: 
   - For `view_profile`: Return error if email doesn't exist
   - For `registration`: Allow proceeding to create a new profile

3. **OTP Verification**:
   - Both flows use the same OTP verification mechanism
   - The `purpose` parameter is used to ensure OTPs can't be reused between flows

4. **Account Selection**:
   - Both flows allow selecting from multiple profiles if they exist
   - The frontend navigates differently based on the flow

## Performance Considerations

1. **Database Impact**:
   - Added index on `purpose` field for efficient OTP lookups
   - No significant increase in database load

2. **API Compatibility**:
   - All endpoint changes are backward compatible
   - Default parameters ensure existing API consumers aren't affected

## Security Considerations

1. **OTP Isolation**:
   - OTPs generated for one purpose cannot be used for another
   - Prevents session hijacking between flows

2. **Error Handling**:
   - Enhanced error messages provide security through obscurity
   - Non-existent emails receive different responses based on the flow's purpose

## Testing Focus Areas

1. **Backward Compatibility**:
   - Existing "Make Appointment" flow continues to work as before
   - Mobile apps using the API don't break

2. **Edge Cases**:
   - Multiple profiles under the same email
   - Expired or invalid OTPs
   - Attempting to use "View Profile" OTP for making an appointment

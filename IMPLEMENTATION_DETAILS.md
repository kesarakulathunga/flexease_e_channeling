# Flexease Physiotherapy - Feature Comparison

## "Make Appointment" vs "View Your Profile" Flows

This document outlines the key differences and similarities between the two main authentication flows in the application.

## Code Implementation Differences

### 1. Authentication Service (`authService.js`)

| Function | "Make Appointment" (Original) | "View Your Profile" (New) |
|----------|------------------------------|---------------------------|
| `checkEmail` | Original implementation without purpose | Added `purpose='view_profile'` parameter |
| `verifyOTP` | Original implementation without purpose | Added `purpose='view_profile'` parameter |
| `selectAccount` | Same for both flows | Same for both flows |

### 2. Email Verification

| Aspect | "Make Appointment" (Original) | "View Your Profile" (New) |
|--------|------------------------------|---------------------------|
| Component | Uses `VerifyEmail.jsx` | Uses dedicated `ViewProfile.jsx` |
| Error Handling | Basic error handling | Enhanced error handling for non-existent emails |
| Non-Existent Emails | Allows registration | Shows error requiring appointment first |

### 3. Profile Selection

| Aspect | "Make Appointment" (Original) | "View Your Profile" (New) |
|--------|------------------------------|---------------------------|
| Create Profile | Option available | Option not available |
| Error Message | Generic errors | Specific message about making appointment first |
| Post-Selection | Navigates to appointment booking | Navigates to dashboard |

## User Experience Differences

| User Scenario | "Make Appointment" Response | "View Your Profile" Response |
|---------------|---------------------------|----------------------------|
| New User (Email not in system) | Allows creating new profile after OTP | Shows error: "This email is not registered. Please make an appointment first to create an account." |
| Existing User (No profiles) | Shows profile creation option | Shows error about no profiles found |
| Existing User (With profiles) | Shows profile selection | Shows profile selection |
| OTP Entry | Standard OTP verification | Same OTP verification but with 'view_profile' purpose |

## Technical Implementation Notes

1. **Parameter-Based Approach**: The implementation uses a parameter-based approach to maintain backward compatibility:
   - Added `purpose` parameter with default value 'registration' to key functions
   - This ensures existing code continues to work as before

2. **Error Handling Improvements**:
   - Enhanced error messages specific to each flow
   - Detailed backend error information displayed to the user
   - Specific handling for common error cases (invalid email, invalid OTP, etc.)

3. **Backend Requirements**:
   - Backend needs to be updated to handle the `purpose` parameter in OTP verification
   - Different OTP context based on the purpose ('registration' vs 'view_profile')

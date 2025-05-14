# Testing Guide for Profile Features

This document provides comprehensive guidance for testing the profile-related features: "View Your Profile" and "Edit Your Profile".

## 1. View Your Profile Feature

### Test Scenarios

#### 1.1. View Profile with Existing Account

**Scenario**: User has an existing profile and wants to view it
1. Click "View Your Profile" button on homepage
2. Enter your registered email address
3. Click "Continue"
4. Enter the OTP sent to your email
5. If multiple profiles exist for the email, select your profile
6. You should be redirected to the dashboard showing your profile details

**Expected Result**: Profile is displayed on dashboard

#### 1.2. View Profile with Non-existent Email

**Scenario**: User attempts to view a profile with an email that doesn't exist in the system
1. Click "View Your Profile" button on homepage
2. Enter an email address that doesn't have a profile
3. Click "Continue"

**Expected Result**: Error message "No profile found for this email. Please make an appointment first."

#### 1.4. Make Appointment with New Email

**Scenario**: New user creates a profile while making an appointment
1. Click "Make Appointment" button on homepage
2. Enter a new email address (not in the system)
3. Click "Continue"
4. Enter the OTP sent to your email
5. Fill out the profile creation form
6. Complete the appointment booking process

**Expected Result**: New profile created and appointment booked successfully

## 2. Edit Your Profile Feature

### Test Scenarios

#### 2.1. Update Basic Profile Information

**Scenario**: User wants to update their basic profile information
1. Log in to the system and navigate to the profile page
2. Click "Edit Profile" button
3. Modify the profile details (name, age, NIC number, mobile number)
4. Click "Save Changes"
5. Verify that the information has been updated

**Expected Result**: Profile information updated successfully and changes reflected in the profile view

#### 2.2. Change Email Address

**Scenario**: User wants to change their email address
1. Log in to the system and navigate to the profile page
2. Click "Change Email" button
3. Enter the new email address
4. Click "Send Verification Code"
5. Check the new email for the OTP
6. Enter the OTP and click "Verify"
7. Verify that you are logged in with the new email

**Expected Result**: Email address updated successfully, new authentication token issued

#### 2.3. Attempt to Update with Invalid Data

**Scenario**: User tries to update profile with invalid data
1. Log in to the system and navigate to the profile page
2. Click "Edit Profile" button
3. Enter invalid data (e.g., negative age, empty required fields)
4. Click "Save Changes"

**Expected Result**: Validation errors shown, profile not updated

#### 2.4. Change to Already Used Email

**Scenario**: User tries to change email to one already in use
1. Log in to the system and navigate to the profile page
2. Click "Change Email" button
3. Enter an email that is already used by another account
4. Click "Send Verification Code"

**Expected Result**: Error message "Email is already in use by another account"

## 3. Automated Testing

### API Testing Script

To test the profile editing functionality programmatically, run:

```bash
node test-profile-editing.js
```

This script performs the following tests:
1. Creates a test patient account
2. Retrieves the patient profile
3. Updates basic profile information
4. Initiates email change
5. Verifies and completes email change
6. Checks final profile state with updated information

### Backward Compatibility Testing

To ensure the new features don't break existing functionality, run:

```bash
node test-backward-compatibility.js
```

## 4. Error Handling Testing

These tests verify the error handling capabilities:

1. **Authentication Failures**
   - Attempt to access profiles without authentication
   - Use expired or invalid tokens

2. **Authorization Violations**
   - Attempt to access or modify another user's profile

3. **Validation Errors**
   - Submit invalid data formats
   - Omit required fields

Expected Result: Appropriate error responses with descriptive messages and correct HTTP status codes

## Feature Comparison

| Feature | Make Appointment | View Your Profile |
|---------|-----------------|-------------------|
| Non-existent email | Allows creating new profile | Shows error message: "Please make an appointment first" |
| OTP verification | Uses purpose='registration' | Uses purpose='view_profile' |
| Create profile option | Available | Not available |
| Navigation after selection | Goes to appointment booking | Goes directly to dashboard |
| OTP context | 'LOGIN' for both | 'LOGIN' for both |

## Troubleshooting

### Common Issues

1. **OTP not received**
   - In development mode, check server console logs for the OTP
   - Verify email is entered correctly

2. **Error: "No profile found"**
   - This is expected behavior for "View Profile" if no appointments have been made
   - Try using "Make Appointment" flow first

3. **Profile data incorrect**
   - Ensure you selected the correct profile if multiple exist
   - Check if updates were properly saved

### Diagnostic Steps

1. Verify the OTP validation logs in the backend console
2. Check server logs for any error messages related to profile retrieval
3. Confirm all parameters are correctly passed in API requests
4. Verify purpose parameter ('view_profile' or 'registration') is being sent correctly

## Backend Testing

These curl commands can be used to test the API endpoints directly:

```bash
# 1. Check email (View Profile)
curl -X POST http://localhost:4000/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "purpose":"view_profile"}'

# 2. Verify OTP (View Profile)
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "code":"123456", "purpose":"view_profile"}'

# 3. Select Account (View Profile)
curl -X POST http://localhost:4000/api/auth/select-account \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "patientId":1, "purpose":"view_profile"}'
```

# Testing Guide for Flexease Physiotherapy Web Application

## Feature: "View Your Profile"

### Test Scenarios

#### Scenario 1: User with existing account
1. Click "View Your Profile" on the homepage
2. Enter an email that has an existing account
3. Enter the OTP received
4. Select a profile from the list
5. Verify that you are redirected to the dashboard

#### Scenario 2: User without account
1. Click "View Your Profile" on the homepage
2. Enter an email that doesn't exist in the system
3. Verify that an error message is displayed: "This email is not registered. Please make an appointment first to create an account."

#### Scenario 3: Invalid OTP
1. Click "View Your Profile" on the homepage
2. Enter a valid email with an account
3. Enter an incorrect OTP
4. Verify that an appropriate error message is displayed

### Comparison with "Make Appointment" Flow

| Step | "Make Appointment" | "View Your Profile" |
|------|-------------------|-------------------|
| Email verification | Can verify any email | Same as Make Appointment |
| OTP verification | OTP is sent and verified | Same as Make Appointment |
| Non-existent email | Shows profile creation option | Shows error message saying user needs to make appointment first |
| Profile selection | Shows list of existing profiles | Same as Make Appointment |
| No profiles | Offers to create new profile | Shows error message |
| After selection | Goes to appointment booking | Goes to dashboard |

### Known Issues

- If you're encountering "Invalid or expired OTP" errors when testing the "View Your Profile" flow, but the same OTP works for the "Make Appointment" flow, ensure that your backend is updated to handle the purpose parameter in OTP verification.

### Troubleshooting

If you're experiencing errors with OTP verification:
1. Check browser console for error details
2. Verify OTP hasn't expired (valid for 10 minutes)
3. Ensure backend is updated to handle 'view_profile' purpose
4. Request a new OTP if needed

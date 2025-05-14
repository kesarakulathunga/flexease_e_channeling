# Profile Editing Feature - Implementation Details

This document provides the technical details for the implementation of the profile editing feature in the FlexEase Healthcare application.

## Architecture Overview

The profile editing feature follows the MVC architecture pattern:

- **Model**: PatientProfile schema in Prisma
- **Controller**: ProfileController handling business logic
- **Service**: PatientService for database operations
- **Routes**: Express routes for API endpoints

## Database Schema Changes

The PatientProfile model has been extended with:

```prisma
model PatientProfile {
  // Existing fields
  id           Int      @id @default(autoincrement())
  email        String
  fullName     String
  age          Int
  nicNumber    String
  
  // New fields
  mobileNumber String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt @default(now())

  @@unique([email, fullName])
}
```

Migration SQL:
```sql
-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN "mobileNumber" TEXT;
ALTER TABLE "PatientProfile" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

## API Endpoints

### Profile Retrieval
- **Endpoint**: `GET /api/profile/patient/:id`
- **Authorization**: JWT token required, can only access own profile
- **Response**: Patient profile data

### Basic Profile Update
- **Endpoint**: `PUT /api/profile/patient/:id`
- **Authorization**: JWT token required, can only update own profile
- **Request Body**:
  ```json
  {
    "fullName": "Updated Name",
    "age": 35,
    "nicNumber": "NIC12345",
    "mobileNumber": "1234567890"
  }
  ```
- **Response**: Updated patient profile

### Email Change Initiation
- **Endpoint**: `POST /api/profile/email/initiate-change`
- **Authorization**: JWT token required
- **Request Body**:
  ```json
  {
    "newEmail": "new.email@example.com"
  }
  ```
- **Response**: Success confirmation and OTP sent to new email

### Email Change Verification
- **Endpoint**: `POST /api/profile/email/verify-change`
- **Authorization**: JWT token required
- **Request Body**:
  ```json
  {
    "newEmail": "new.email@example.com",
    "code": "123456"
  }
  ```
- **Response**: Success confirmation, updated profile, and new JWT token

## Security Implementation

### Authentication
- JWT-based authentication via the `authenticate` middleware
- Token validation and extraction from Authorization header

### Authorization
- User ID and role validation to ensure users can only modify their own profiles
- Admin users have access to all profiles

### Input Validation
- Basic validation for required fields and data types
- Email format validation with regex
- Age validation (positive numbers)
- OTP format validation (6-digit numeric code)

## Error Handling

The system uses a custom error handling framework:

```javascript
class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

Common error scenarios:
- Invalid or expired tokens (401 Unauthorized)
- Access to other users' profiles (403 Forbidden)
- Profile not found (404 Not Found)
- Invalid input data (400 Bad Request)
- Email already in use (409 Conflict)
- Server errors (500 Internal Server Error)

## Logging System

Comprehensive logging is implemented throughout the profile operations:

```javascript
const logger = {
  error: (message, meta = {}) => log(LOG_LEVELS.ERROR, message, meta),
  warn: (message, meta = {}) => log(LOG_LEVELS.WARN, message, meta),
  info: (message, meta = {}) => log(LOG_LEVELS.INFO, message, meta),
  debug: (message, meta = {}) => log(LOG_LEVELS.DEBUG, message, meta),
};
```

Log events include:
- Profile access attempts
- Profile update operations
- Email change process steps
- Validation failures
- Security violations

## Testing Script

The implementation includes a dedicated test script (`test-profile-editing.js`) that validates:

1. Patient registration flow
2. Profile retrieval functionality
3. Basic profile update operations
4. Email change process (both initiation and verification)
5. Error handling scenarios

## Integration Points

The profile editing feature integrates with:
- Authentication system for user verification
- OTP service for email change verification
- Session service for token management
- Error handling middleware for standardized responses

## Performance Considerations

- Database indexes on frequently queried fields
- Minimal data transfer in responses
- Efficient database operations using Prisma client
- Proper error handling to avoid performance issues

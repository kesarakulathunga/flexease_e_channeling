# FlexEase Healthcare Backend

This repository contains the backend API for the FlexEase Healthcare application, which allows patients to book appointments, view and edit their profiles, and access medical reports.

## Features

- **User Authentication** with email and OTP verification
- **Patient Profile Management**
  - View patient profile information
  - Update basic profile details (name, age, mobile number)
  - Change email address with OTP verification
- **Appointment Booking and Management**
- **Medical Reports and Feedback**
- **Admin Dashboard and Management**

## Recent Feature Implementations

### 1. View Your Profile

We've implemented a feature that allows patients to directly view their profile without going through the appointment booking flow.

### 2. Edit Your Profile

We've added comprehensive profile editing functionality, enabling patients to:
- Update their basic information (name, age, NIC number, mobile number)
- Change their email address with secure OTP verification
- Access enhanced error handling and logging

#### Documentation

- [Implementation Report](./IMPLEMENTATION_REPORT.md) - Overview of changes and implementation details
- [Implementation Details](./IMPLEMENTATION_DETAILS.md) - Technical implementation specifics
- [Testing Guide](./TESTING.md) - How to test the profile features

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL v14 or higher

### Environment Setup

1. Clone this repository
2. Create a `.env` file based on `.env.new`
3. Update the database connection string in `.env`

```bash
# Example .env file
DATABASE_URL=postgresql://username:password@localhost:5432/flexease_db?schema=public
JWT_SECRET=your_secret_key_here
```

### Installation

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Seed the database (optional)
npm run seed

# Start the development server
npm run dev
```

## API Documentation

The API provides the following endpoints:

### Authentication

- `POST /api/auth/check-email` - Check if email exists and send OTP
- `POST /api/auth/verify-email` - Verify OTP for email
- `POST /api/auth/select-account` - Select account and get JWT token
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token
- `POST /api/auth/logout` - Logout and invalidate session

### Patients

- `POST /api/patients/register-verified` - Register a new patient after email verification
- `POST /api/patients` - Create a new patient profile
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient profile
- `DELETE /api/patients/:id` - Delete patient profile

### Appointments

- `POST /api/appointments` - Create a new appointment
- `GET /api/appointments` - Get appointments (with filtering)
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment status
- `DELETE /api/appointments/:id` - Cancel appointment

### Time Slots

- `POST /api/slots` - Create time slots
- `GET /api/slots` - Get available time slots
- `GET /api/slots/:id` - Get time slot by ID
- `PUT /api/slots/:id` - Update time slot
- `DELETE /api/slots/:id` - Delete time slot

### Reports

- `POST /api/reports` - Upload a new report
- `GET /api/reports` - Get reports (with filtering)
- `GET /api/reports/:id` - Get report by ID
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Feedback

- `POST /api/feedback` - Add feedback to a report
- `GET /api/feedback` - Get feedback (by report or admin)
- `GET /api/feedback/:id` - Get feedback by ID
- `PUT /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback

## Development

### Database Schema

The database schema is managed using Prisma ORM. To make changes:

1. Update the schema in `prisma/schema.prisma`
2. Run migrations: `npm run migrate`

### Code Structure

```
src/
├── app.js               # Express app configuration
├── server.js            # Server entry point
├── config/              # Configuration
├── auth/                # Authentication logic
├── controllers/         # Request handlers
├── middlewares/         # Express middlewares
├── routes/              # API routes
├── services/            # Business logic
├── users/               # User management
└── utils/               # Utility functions
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

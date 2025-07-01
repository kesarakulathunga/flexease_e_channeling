# 🏥 Healthcare System Backend

A comprehensive healthcare management system backend built with Node.js, Express.js, and Prisma ORM.

## 🚀 Features

- **User Management**: Patient and Admin profiles with role-based access
- **Appointment System**: Time slot management and booking system
- **Report Management**: Medical report upload and review system
- **Feedback System**: Admin feedback on patient reports
- **Authentication**: JWT-based authentication with OTP verification
- **Database**: PostgreSQL with Prisma ORM
- **File Upload**: Secure file handling for medical reports

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, bcryptjs
- **File Upload**: Multer
- **Email**: Nodemailer
- **Environment**: dotenv
- **CORS**: Cross-origin resource sharing enabled

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/healthcare_db"
   JWT_SECRET="your-super-secret-jwt-key"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password"
   PORT=3000
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📁 Project Structure

```
healthcare-backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom middlewares
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── uploads/            # File uploads directory
├── docs/              # API documentation
├── scripts/           # Utility scripts
└── package.json       # Project dependencies
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification

### Patients
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `POST /api/patients/appointments` - Book appointment
- `GET /api/patients/appointments` - Get patient appointments

### Admins
- `GET /api/admin/availability` - Get admin availability
- `POST /api/admin/availability` - Set availability
- `GET /api/admin/appointments` - Get admin appointments
- `GET /api/admin/reports` - Get patient reports

### Reports
- `POST /api/reports/upload` - Upload medical report
- `GET /api/reports` - Get reports
- `POST /api/reports/feedback` - Add feedback to report

## 🗄️ Database Schema

The system uses a properly structured PostgreSQL database with:

- **Users**: Central authentication table
- **Patient Profiles**: Patient-specific information
- **Admin Profiles**: Healthcare provider information
- **Time Slots**: Available appointment slots
- **Appointments**: Booking records
- **Reports**: Medical report storage
- **Feedback**: Admin feedback on reports
- **Sessions**: User session management
- **OTPs**: One-time password verification

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- OTP verification for secure access
- Role-based access control
- Input validation and sanitization
- Secure file upload handling

## 🚀 Deployment

1. **Environment Variables**: Set up production environment variables
2. **Database**: Configure production PostgreSQL database
3. **Build**: No build step required for Node.js
4. **Start**: Use `npm start` for production

## 📚 API Documentation

Detailed API documentation is available in the `/docs` folder:
- [Admin Availability API](./docs/SIMPLIFIED_AVAILABILITY_API.md)
- [Frontend-Friendly Slots API](./docs/FRONTEND_FRIENDLY_SLOTS_API.md)

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for better healthcare management**

# TailorResumeAuthServer

Authentication server for the JobBidAssist TailorResume application with comprehensive user, IP, and settings management.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **User Management**: Complete CRUD operations for user accounts
- **IP Management**: Track and manage IP addresses associated with users
- **Settings Management**: Flexible key-value settings storage
- **PostgreSQL Database**: Robust relational database with connection pooling
- **RESTful API**: Clean, well-structured API endpoints
- **Management UI**: Modern web-based dashboard for easy administration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Additional**: CORS, body-parser, dotenv

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TailorResumeAuthServer
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=tailorresume_auth
JWT_SECRET=your_secret_key
```

4. Setup database:
```bash
npm run setup
```

5. Start the server:
```bash
# Production
npm start

# Development (with nodemon)
npm run dev
```

6. Access the Management UI:
```
Open your browser and navigate to: http://localhost:3000
```

For detailed UI documentation, see [MANAGEMENT_UI.md](MANAGEMENT_UI.md)

## API Documentation

Base URL: `http://localhost:3000`

### Authentication Endpoints

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "confirm_password": "securepassword"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Get All Users
```http
GET /api/auth/
```

#### Get User by ID
```http
GET /api/auth/:id
```

#### Update User
```http
PUT /api/auth/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### Delete User
```http
DELETE /api/auth/:id
```

#### Block/Unblock User
```http
PATCH /api/auth/:id/block
Content-Type: application/json

{
  "blocked": 0  // 0 = blocked, 1 = active
}
```

### IP Management Endpoints

#### Get All IPs
```http
GET /api/ips/
```

#### Get IP by ID
```http
GET /api/ips/:id
```

#### Get IPs by User ID
```http
GET /api/ips/user/:userId
```

#### Create IP Entry
```http
POST /api/ips/
Content-Type: application/json

{
  "userId": "john@example.com",
  "ip": "192.168.1.100"
}
```

#### Update IP
```http
PUT /api/ips/:id
Content-Type: application/json

{
  "userId": "john@example.com",
  "ip": "192.168.1.101"
}
```

#### Delete IP
```http
DELETE /api/ips/:id
```

### Settings Management Endpoints

#### Get All Settings
```http
GET /api/settings/
```

#### Get Setting by ID
```http
GET /api/settings/:id
```

#### Get Setting by Key
```http
GET /api/settings/key/:key
```

#### Create Setting
```http
POST /api/settings/
Content-Type: application/json

{
  "key": "max_login_attempts",
  "value": "5"
}
```

#### Update Setting
```http
PUT /api/settings/:id
Content-Type: application/json

{
  "key": "max_login_attempts",
  "value": "10"
}
```

#### Delete Setting
```http
DELETE /api/settings/:id
```

## Authentication

Protected routes require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

The `authenticateToken` middleware is available in `utils/auth.middleware.js` and can be applied to any route that needs protection.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    blocked INT DEFAULT 1,  -- 1 = active, 0 = blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### IPs Table
```sql
CREATE TABLE ips (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user VARCHAR(100) NOT NULL,
    ip VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Settings Table
```sql
CREATE TABLE settings (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
TailorResumeAuthServer/
├── controllers/
│   ├── auth.controller.js      # Authentication & user management logic
│   ├── ip.controller.js         # IP management logic
│   └── settings.controller.js   # Settings management logic
├── database/
│   ├── db.js                    # Database connection pool
│   ├── model.js                 # Database queries
│   └── setup.js                 # Database initialization
├── routers/
│   ├── auth.router.js           # Auth routes
│   ├── ip.router.js             # IP routes
│   └── settings.router.js       # Settings routes
├── utils/
│   ├── auth.middleware.js       # Authentication & validation middleware
│   └── utils.js                 # Utility functions
├── .env                         # Environment variables (not in git)
├── .env.example                 # Example environment variables
├── index.js                     # Application entry point
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Request validation middleware
- **CORS**: Configured for cross-origin requests
- **Environment Variables**: Sensitive data stored in .env
- **User Blocking**: Ability to block/unblock user accounts

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Development

For development with auto-reload:

```bash
npm run dev
```

## Building Production Executable

Build standalone executables with custom icon and metadata using PKG:

### Quick Start

**Windows**: Double-click `build-with-icon.bat`

**Or use npm scripts**:
```bash
# Build Windows executable with icon
npm run build:win

# Build for all platforms
npm run build:all
```

### Icon and Metadata

The production executable includes:
- ⚙️ Custom gears icon
- 📄 File description and version info
- © Copyright: "Copyright (C) 2024 TailorResume. All rights reserved."
- 🏢 Company: TailorResume
- 📌 Product: TailorResume Auth Server v1.0.0

**First-time setup**: Convert `resources/icon.svg` to `resources/icon.ico` (see [QUICK_START_ICON.md](QUICK_START_ICON.md))

**Documentation**:
- Quick guide: [QUICK_START_ICON.md](QUICK_START_ICON.md)
- Detailed guide: [BUILD_WITH_ICON.md](BUILD_WITH_ICON.md)
- Full documentation: [ICON_AND_METADATA.md](ICON_AND_METADATA.md)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Copyright (C) 2024 TailorResume. All rights reserved.

This software is proprietary and confidential.

## Support

For issues and questions, please open an issue on the repository.

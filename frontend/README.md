# Frontend - React + Vite + Tailwind CSS

This is the frontend application for the TailorResume Admin Dashboard, built with React, Vite, and Tailwind CSS.

## Features

- **React 18** with modern hooks and context API
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **React Router** for client-side routing
- **Authentication** with JWT tokens
- **Responsive Design** with Tailwind CSS

## Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

The development server will run on `http://localhost:3000` with proxy to the backend API at `http://localhost:8085`.

## Build for Production

Build the React app for production:

```bash
npm run build
```

This will output the built files to the `../public` directory, which will be served by the Express server.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components (Login, Sidebar, Modal)
│   ├── contexts/        # React contexts (AuthContext)
│   ├── pages/          # Page components (Users, GPT, Configs, Jobs)
│   ├── services/        # API service functions
│   ├── App.jsx         # Main app component with routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles with Tailwind
├── index.html          # HTML template
├── vite.config.js     # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
└── package.json        # Dependencies and scripts
```

## Authentication Flow

1. **Login Page**: Shown when user is not authenticated
2. **After Login**: Sidebar appears with all navigation links
3. **Protected Routes**: Users and GPT pages require authentication
4. **Public Routes**: Configs and Jobs pages are accessible without authentication

## Development Notes

- The frontend communicates with the backend API at `http://localhost:8085/api`
- Authentication tokens are stored in localStorage
- The app uses React Router for client-side routing
- All styling is done with Tailwind CSS utility classes

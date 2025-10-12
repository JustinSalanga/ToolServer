const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

// Main startup function
(async () => {
    // Load environment variables (works in both dev and pkg)
    const { loadEnvironment } = require('./config/env');
    if (!loadEnvironment()) {
        console.error('❌ Failed to load environment variables');
        console.error('❌ Please create a .env file with database configuration');
        process.exit(1);
    }

    // Startup authentication check
    const { authenticateStartup } = require('./utils/startup-auth');
    const startupPassword = process.env.STARTUP_PASSWORD || '';
    const isHashed = process.env.STARTUP_PASSWORD_HASHED === 'true';
    const maxAttempts = parseInt(process.env.STARTUP_MAX_ATTEMPTS || '3', 10);

    const authenticated = await authenticateStartup(startupPassword, isHashed, maxAttempts);

    if (!authenticated) {
        console.error('❌ Startup authentication failed');
        process.exit(1);
    }

    const passport = require('./config/passport');
    const authRouter = require('./routers/auth.router');
    const ipRouter = require('./routers/ip.router');
    const settingsRouter = require('./routers/settings.router');
    const gptRouter = require('./routers/gpt.router');
    const configRouter = require('./routers/config.router');
    const { setupDatabase } = require('./database/setup');

    const app = express();
    const PORT = process.env.PORT || 3000;

    // Middleware
    app.use(morgan('dev')); // HTTP request logger
    app.use(bodyParser.urlencoded({ extended: true, limit: '50kb'}));
    app.use(bodyParser.json({ limit: '50kb' }));
    app.use(cors());

    // Initialize Passport
    app.use(passport.initialize());

    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, 'public')));

    // API Routes
    app.use('/api/auth', authRouter);
    app.use('/api/ips', ipRouter);
    app.use('/api/settings', settingsRouter);
    app.use('/api/gpt', gptRouter);
    app.use('/api/config', configRouter);

    // Serve the dashboard for the root route
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Something went wrong!' });
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    // Initialize database and start server
    setupDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Failed to setup database:', err);
        process.exit(1);
    });
})();
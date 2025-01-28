require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser'); // Add cookie-parser
const { createUserTable } = require('./models/user');
const { createIpTable } = require('./models/iplog'); // Import createTable function
const app = express();
const fs = require('fs');
const sessionMiddleware = require('./middlewares/authMiddleware');
const nocache = require('nocache');
const PgSession = require("connect-pg-simple")(session);
const { Pool } = require('pg');

// Initialize database tables
createUserTable(); 
createIpTable();
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

// Config imports
const cspPolicy = require('./config/cspPolicy');

// Middleware imports
const { logIpGeolocation, restrictToUS } = require('./middlewares/geo');

// Route imports
const indexRoutes = require('./routes/index');
const ipRoutes = require('./routes/iplog');
const torrentRoutes = require('./routes/torrents');
const searchRoutes = require('./routes/search');
const accountRoutes = require('./routes/account');
const downloadRoutes = require('./routes/downloads');

// Import nocache middleware
app.use(nocache());

// Session configuration
app.use(session({
    store: new PgSession({
        pool, // Reuse the Postgres connection pool
        tableName: "session", // Name of the table for session data
        createTableIfMissing: true, // Automatically create the session table if it doesn't exist
      }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production", // Secure cookies only in production
        maxAge: 24 * 60 * 60 * 1000 // Session lasts for 24 hours
    }
}));

console.log('Production environment?', process.env.NODE_ENV === 'production');

// Global Middleware
app.use(logIpGeolocation);
app.use(restrictToUS);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // Use cookie-parser

// Use Helmet to apply the CSP policy
app.use(helmet.contentSecurityPolicy(cspPolicy));
app.use(express.static(path.join(__dirname, './')));

// Serve sw.js with version query parameter
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the versioned sw.js file (e.g., sw-1234567890.js)
app.get('/sw.js', (req, res) => {
    // Fetch the version from version.json
    fs.readFile(path.join(__dirname, 'version.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading version.json:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        const version = JSON.parse(data).version;
        // Construct the file path based on the version]

        const swFilePath = path.join(__dirname, `sw-${version}.js`);
        console.log('Service Worker file path:', swFilePath);
        
        // Ensure the versioned service worker file exists and serve it
        fs.existsSync(swFilePath, exists => {
            if (exists) {
                res.sendFile(swFilePath);
            } else {
                res.status(404).json({ error: 'Service Worker not found' });
            }
        });
    });
});

// Routes
app.use('/', indexRoutes);
app.use('/iplog', sessionMiddleware, ipRoutes);
app.use('/torrents', torrentRoutes);
app.use('/search', searchRoutes);
app.use('/account', accountRoutes);
app.use('/downloads', sessionMiddleware, downloadRoutes);
app.use((req, res, next) => {
    res.status(404).render('404');
});

// Views setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
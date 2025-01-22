require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const nocache = require('nocache');
const bodyParser = require('body-parser');
const session = require('express-session');
const { createUserTable } = require('./models/user');

const app = express();

// Initialize database
createUserTable().then(() => {
    console.log('User table created');
}).catch(err => {
    console.error('Error creating user table', err);
});

// Config imports
const cspPolicy = require('./config/cspPolicy');

// Middleware imports
const sessionMiddleware = require('./middlewares/authMiddleware');
const { logIpGeolocation, restrictToUS } = require('./middlewares/geo');

// Route imports
const indexRoutes = require('./routes/index');
const ipRoutes = require('./routes/iplog');
const torrentRoutes = require('./routes/torrents');
const searchRoutes = require('./routes/search');
const accountRoutes = require('./routes/account');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // Session lasts for 24 hours
    }
}));

// Global Middleware
app.use(logIpGeolocation);
app.use(restrictToUS);
// app.use(nocache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use Helmet to apply the CSP policy
app.use(helmet.contentSecurityPolicy(cspPolicy));
app.use(express.static(path.join(__dirname, './')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/assets/icons', express.static(path.join(__dirname, 'public/assets/icons')));
app.use('/sw.js', express.static(path.join(__dirname, 'sw.js')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts'), {
    setHeaders: (res) => res.setHeader('Content-Type', 'application/javascript'),
}));

// Routes
app.use('/', indexRoutes);
app.use('/iplog', sessionMiddleware, ipRoutes);
app.use('/torrents', torrentRoutes);
app.use('/search', searchRoutes);
app.use('/account', accountRoutes);
app.use('/downloads', sessionMiddleware, express.static(path.join(__dirname, 'views/downloads.html')));

// Views setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
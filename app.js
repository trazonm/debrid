require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const nocache = require('nocache');

const app = express();

//Config imports
const cspPolicy = require('./config/cspPolicy');

// Middleware imports
const authMiddleware = require('./middlewares/authMiddleware');
const { logIpGeolocation, restrictToUS } = require('./middlewares/geo');


// Route imports
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const torrentRoutes = require('./routes/torrents');
const searchRoutes = require('./routes/search');

// Global Middleware
app.use(logIpGeolocation);
app.use(nocache());
app.use(helmet({ frameguard: { action: 'deny' } }));

// Use Helmet to apply the CSP policy
app.use(helmet.contentSecurityPolicy(cspPolicy));
app.use(express.static(path.join(__dirname, './')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/sw.js', express.static(path.join(__dirname, 'sw.js')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts'), {
    setHeaders: (res) => res.setHeader('Content-Type', 'application/javascript'),
}));

// Routes
app.use('/', indexRoutes);
app.use('/iplog', authMiddleware, authRoutes);
app.use('/torrents', torrentRoutes);
app.use('/search', searchRoutes);

// Views setup
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

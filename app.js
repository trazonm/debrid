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
const sessionMiddleware = require('./middlewares/authMiddleware');
const nocache = require('nocache');

// Initialize database tables
createUserTable(); 
createIpTable();
const pool = require('./utils/pool');

// Config imports
const { cspPolicy, scriptNonce, styleNonce, fontNonce, imgNonce, mediaNonce } = require('./config/cspPolicy');
const sessionConfig = require('./config/sessionConfig');

// Middleware imports
const { logIpGeolocation, restrictToUS } = require('./middlewares/geo');

// Route imports
const indexRoutes = require('./routes/index');
const ipRoutes = require('./routes/iplog');
const torrentRoutes = require('./routes/torrents');
const searchRoutes = require('./routes/search');
const accountRoutes = require('./routes/account');
const downloadRoutes = require('./routes/downloads');
const brainRoutes = require('./routes/brain');
const premRoutes = require('./routes/premiumizer');
const swRoute = require('./routes/sw'); // Import swRoute

// App configuration
app.use(nocache());
app.disable('x-powered-by');
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Session configuration
app.use(session(sessionConfig));

console.log('Production environment?', process.env.NODE_ENV === 'production');

// Global Middleware
app.use(logIpGeolocation);
app.use(restrictToUS);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // Use cookie-parser

// Middleware to set nonces for each request
app.use((req, res, next) => {
    res.locals.scriptNonce = scriptNonce;
    res.locals.styleNonce = styleNonce;
    res.locals.fontNonce = fontNonce;
    res.locals.imgNonce = imgNonce;
    res.locals.mediaNonce = mediaNonce;
    next();
});

// Use Helmet to apply the CSP policy
app.use(helmet.contentSecurityPolicy(cspPolicy));
app.use(express.static(path.join(__dirname, './')));

// Serve sw.js with version query parameter
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the versioned sw.js file (e.g., sw-1234567890.js)
app.use(swRoute);

// Routes
app.use('/', indexRoutes);
app.use('/iplog', sessionMiddleware, ipRoutes);
app.use('/torrents', sessionMiddleware, torrentRoutes);
app.use('/search', sessionMiddleware,searchRoutes);
app.use('/account', accountRoutes);
app.use('/downloads', sessionMiddleware, downloadRoutes);
app.use('/brain', sessionMiddleware, brainRoutes);
app.use('/premiumizer', sessionMiddleware, premRoutes);
app.use((req, res, next) => {
    res.status(404).render('404');
});

// Views setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
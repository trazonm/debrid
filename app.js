require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const qs = require('querystring');
const multer = require('multer');
const nocache = require('nocache');
const helmet = require('helmet');
const xssClean = require('xss-clean');

const app = express();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/x-bittorrent'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only torrent files are allowed.'));
        }
    },
});

// Middleware
app.use(nocache());

// Use Helmet middleware with frameguard enabled
app.use(helmet({
    frameguard: {
        action: 'deny', // Prevent embedding in any frame
    },
}));

// Define your CSP rules
const cspPolicy = {
    directives: {
        defaultSrc: ["'self'"], // Only allow resources from the same origin
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"], // Allow inline scripts and external CDN
        styleSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "https://fonts.googleapis.com", 
            "https://cdn.jsdelivr.net", 
            "https://fonts.cdnfonts.com"
        ], // Allow inline styles and external styles
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.cdnfonts.com"], // Allow fonts from Google Fonts and CDN fonts
        imgSrc: ["'self'", "data:"], // Allow images from self, data URIs, and trusted sources
        objectSrc: ["'none'"], // Block the use of <object> tags
        connectSrc: [
            "'self'", 
            "https://jackett-service.gleeze.com", // Allow connections to Jackett API
            "https://ipapi.co",
            "https://freegeoip.app"
        ], // Allow external API requests to Jackett service
        upgradeInsecureRequests: [], // Automatically upgrade HTTP requests to HTTPS
    }
};

// Use Helmet to apply the CSP policy
app.use(helmet.contentSecurityPolicy(cspPolicy));

// XSS protection - sanitize user inputs to prevent XSS attacks
app.use(xssClean());

const excludedFiles = ['app.js', 'Dockerfile', 'docker-compose.yml'];
app.use((req, res, next) => {
    const requestedFile = path.basename(req.url);
    if (excludedFiles.includes(requestedFile)) {
        res.status(404).send('Not Found');
    } else {
        next();
    }
});

app.use(express.static(path.join(__dirname, './')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts'), {
    setHeaders: (res) => res.setHeader('Content-Type', 'application/javascript'),
}));

// Utility: Async wrapper to handle errors
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const fs = require('fs');
const MAX_LOG_ENTRIES = 100;
const logFilePath = path.join(__dirname, 'iplog.json');

const isPrivateIp = (ip) => {
    // Check for private IP ranges and localhost
    return ip.startsWith('192.168.0') || ip === '127.0.0.1' || ip === '::1';
};

app.use(async (req, res, next) => {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.split(':').pop();
    }

    if (clientIp === '127.0.0.1' || clientIp === '::1') {
        clientIp = 'localhost';
    }

    if (isPrivateIp(clientIp)) {
        console.log('Private or localhost IP detected, skipping geolocation.');
        return next();
    }

    try {
        const response = await axios.get(`https://ipinfo.io/${clientIp}?token=${process.env.IP_INFO_TOKEN}`);
        const location = response.data;

        // Read existing log or initialize
        const log = fs.existsSync(logFilePath)
            ? JSON.parse(fs.readFileSync(logFilePath, 'utf-8'))
            : [];

        // Create log entry
        const logEntry = {
            ip: clientIp,
            location: location.city ? `${location.city}, ${location.region}, ${location.country} ${location.postal}` : 'Unknown location',
            timestamp: new Date().toISOString(),
        };

        // Update log with unique IPs only
        if (!log.some(entry => entry.ip === clientIp)) {
            log.unshift(logEntry);

            // Keep only the last MAX_LOG_ENTRIES entries
            if (log.length > MAX_LOG_ENTRIES) {
                log.pop();
            }

            // Write the updated log to the file
            fs.writeFileSync(logFilePath, JSON.stringify(log, null, 2), 'utf-8');
            console.log(`Logged IP ${clientIp} to the file.`);
        }
    } catch (error) {
        console.error(`Failed to fetch geolocation for IP ${clientIp}`, error.message);
    }

    next();
});

// Basic Authentication setup (replace with your username and password)
app.use('/iplog', basicAuth({
    users: { 'bakaboi341': 'KatsukiBakugo#1' }, // Replace with your desired username and password
    challenge: true,                   // Prompt for credentials
    unauthorizedResponse: 'Unauthorized access to this page'
}));

// IP logging and serving the page
app.get('/iplog', (req, res) => {
    if (fs.existsSync(logFilePath)) {
        const log = JSON.parse(fs.readFileSync(logFilePath, 'utf-8'));

        const formattedLogEntries = log.map(entry => ({
            ip: entry.ip,
            location: entry.location,
            timestamp: new Date(entry.timestamp).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: true,
                timeZone: 'America/New_York'
            })
        }));

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>IP Log</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container my-4">
                    <h1 class="text-center">Last 100 Unique Visitors</h1>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col">IP Address</th>
                                <th scope="col">Location</th>
                                <th scope="col">Timestamp (Eastern)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${formattedLogEntries.map(entry => `
                                <tr>
                                    <td>${entry.ip}</td>
                                    <td>${entry.location}</td>
                                    <td>${entry.timestamp}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.min.js"></script>
            </body>
            </html>
        `);
    } else {
        res.status(404).send('Log file not found.');
    }
});
app.set('views', path.join(__dirname, 'views')); // Set views directory

// Utility: Reusable Real-Debrid headers
const getRealDebridHeaders = () => ({
    Authorization: process.env.REAL_DEBRID_AUTH,
});

// Serve the index page
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, './views') });
});

// Search endpoint
app.get('/search', asyncHandler(async (req, res) => {
    const query = req.query.query?.trim();
    console.log("Received search query: ", query);
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const apiURL = `https://jackett-service.gleeze.com/api/v2.0/indexers/all/results?apikey=${process.env.JACKETT_API_KEY}&Query=${encodeURIComponent(query)}`;

    const { data } = await axios.get(apiURL);
    res.json(data);
}));

// Add magnet link
app.get('/addMagnet', asyncHandler(async (req, res) => {
    const link = req.query.link?.trim();
    console.log("Received request to add magnet: ", link);

    if (!link || !link.startsWith('magnet:')) {
        return res.status(400).json({ error: 'Invalid magnet link provided' });
    }

    const data = qs.stringify({ magnet: link });
    const headers = getRealDebridHeaders();

    const { data: response } = await axios.post('https://api.real-debrid.com/rest/1.0/torrents/addMagnet', data, { headers });
    console.log(response);
    await selectFiles(response.id, headers);
    res.json(response);
}));

// Add torrent file
app.put('/addTorrent', upload.single('file'), asyncHandler(async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'No torrent file provided' });
    }

    console.log('Received request to add torrent file:', req.file);

    const headers = {
        ...getRealDebridHeaders(),
        'Content-Type': 'application/octet-stream',
    };

    const { data } = await axios.put('https://api.real-debrid.com/rest/1.0/torrents/addTorrent', req.file.buffer, { headers });
    await selectFiles(data.id, headers);
    res.json(data);
}));

// Check torrent progress
app.get('/checkProgress/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const apiURL = `https://api.real-debrid.com/rest/1.0/torrents/info/${id}`;

    const { data } = await axios.get(apiURL, { headers: getRealDebridHeaders() });
    res.json(data);
}));

// Unrestrict a link
app.get('/unrestrict', asyncHandler(async (req, res) => {
    const link = req.query.link?.trim();
    if (!link) {
        return res.status(400).json({ error: 'Link parameter is required' });
    }
    console.log("Received request to unrestrict link: ", link);
    const data = qs.stringify({
        link: link
    });

    const apiURL = `https://api.real-debrid.com/rest/1.0/unrestrict/link`;
    const { data: response }  = await axios.post(apiURL, data, { headers: getRealDebridHeaders() });
    console.log(`Unrestricted link endpoint has returned data: ${JSON.stringify(response.data)}. The response status was ${response.status} ${response.statusText}`);
    console.log(response);
    res.json(response);
}));

// Check redirect
app.get('/checkRedirect', asyncHandler(async (req, res) => {
    const link = req.query.link?.trim();
    console.log("Received request to check redirects for: ", link);
    if (!link) {
        return res.status(400).json({ error: 'Link parameter is required' });
    }

    try {
        const { headers } = await axios.get(link, { maxRedirects: 0 });
        res.json({ redirects: 0, finalUrl: null });
    } catch (error) {
        if (error.response?.status === 302) {
            console.log("Redirect found");
            const redirectLocation = error.response.headers.location;
            res.json({ redirects: 1, finalUrl: redirectLocation });
        } else {
            throw error;
        }
    }
}));

// Function: Select files
async function selectFiles(torrentId, headers) {
    console.log("Received request to select files for torrent id:", torrentId);
    const data = qs.stringify({ files: 'all' });
    await axios.post(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, data, { headers });
}

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'An internal error occurred', details: err.message });
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
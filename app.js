require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const qs = require('querystring');
const multer = require('multer');
const nocache = require('nocache');

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
app.use('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'manifest.json'));
});
app.use('/service-worker.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'service-worker.js'));
});
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts'), {
    setHeaders: (res) => res.setHeader('Content-Type', 'application/javascript'),
}));

// Utility: Async wrapper to handle errors
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

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
    const response  = await axios.post(apiURL, data, { headers: getRealDebridHeaders() });
    console.log(`Unrestricted link endpoint has returned data: ${JSON.stringify(response.data)}. The response status was ${response.status} ${response.statusText}`);
    console.log(response);
    res.json(response.data);
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
    res.status(500).json({ error: 'An internal error occurred:', err });
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
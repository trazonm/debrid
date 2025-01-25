const express = require('express');
const upload = require('../config/multerConfig');
const asyncHandler = require('../utils/asyncHandler');
const { getRealDebridHeaders } = require('../utils/realDebrid');
const axios = require('axios');
const qs = require('querystring');
const dns = require('dns');
const router = express.Router();

dns.setDefaultResultOrder('ipv4first'); // Node.js 16.4.0+ only


router.put('/addTorrent', upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No torrent file provided' });
    }

    console.log('Received request to add torrent file:', req.file);

    const headers = { ...getRealDebridHeaders(), 'Content-Type': 'application/octet-stream' };
    const { data } = await axios.put('https://api.real-debrid.com/rest/1.0/torrents/addTorrent', req.file.buffer, { headers });
    await selectFiles(data.id, headers);
    res.json(data);
}));

// Add magnet link
router.get('/addMagnet', asyncHandler(async (req, res) => {
    const link = req.query.link?.trim();
    console.log("Received request to add magnet: ", link);

    if (!link || !link.startsWith('magnet:')) {
        return res.status(400).json({
            error: 'Invalid magnet link provided'
        });
    }

    const data = qs.stringify({
        magnet: link
    });
    const headers = getRealDebridHeaders();

    const {
        data: response
    } = await axios.post('https://api.real-debrid.com/rest/1.0/torrents/addMagnet', data, {
        headers
    });
    console.log(response);
    await selectFiles(response.id, headers);
    res.json(response);
}));

// Check torrent progress
router.get('/checkProgress/:id', asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;
    const apiURL = `https://api.real-debrid.com/rest/1.0/torrents/info/${id}`;

    const {
        data
    } = await axios.get(apiURL, {
        headers: getRealDebridHeaders()
    });
    res.json(data);
}));

// Unrestrict a link
router.get('/unrestrict', asyncHandler(async (req, res) => {
    const link = req.query.link?.trim();
    if (!link) {
        return res.status(400).json({
            error: 'Link parameter is required'
        });
    }
    console.log("Received request to unrestrict link: ", link);
    const data = qs.stringify({
        link: link
    });

    const apiURL = `https://api.real-debrid.com/rest/1.0/unrestrict/link`;
    const {
        data: response
    } = await axios.post(apiURL, data, {
        headers: getRealDebridHeaders()
    });
    console.log(`Unrestricted link endpoint has returned data: ${JSON.stringify(response.data)}. The response status was ${response.status} ${response.statusText}`);
    console.log(response);
    res.json(response);
}));

// Check redirect
router.get('/checkRedirect', asyncHandler(async (req, res) => {
    const link = req.query.link?.trim();
    console.log("Received request to check redirects for: ", link);
    if (!link) {
        return res.status(400).json({
            error: 'Link parameter is required'
        });
    }

    try {
        const { headers } = await axios.get(link, {
            maxRedirects: 0
        });
        res.json({
            redirects: 0,
            finalUrl: null
        });
    } catch (error) {
        if ([301, 302, 307, 308].includes(error.response?.status)) {
            const redirectLocation = error.response.headers.location;
            console.log("Redirect found:", redirectLocation);

            res.json({
                redirects: 1,
                finalUrl: redirectLocation
            });
        } else {
            throw error;
        }
    }
}));

// Function: Select files
async function selectFiles(torrentId, headers) {
    console.log("Received request to select files for torrent id:", torrentId);
    const data = qs.stringify({
        files: 'all'
    });
    await axios.post(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, data, {
        headers
    });
}


module.exports = router;

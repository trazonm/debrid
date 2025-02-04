const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/sw.js', (req, res) => {
    // Fetch the version from version.json
    fs.readFile(path.join(__dirname, '../version.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading version.json:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        const version = JSON.parse(data).version;
        // Construct the file path based on the version
        const swFilePath = path.join(__dirname, `../sw-${version}.js`);
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

module.exports = router;

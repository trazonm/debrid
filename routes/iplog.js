const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const router = express.Router();
const pool = require('../utils/pool');

// Middleware to restrict access to bakaboi341
const restrictToBakaboi341 = (req, res, next) => {
    const username = req.session.user; // Assuming username is stored in session
    if (username === 'bakaboi341') {
        return next();
    } else {
        return res.status(403).send('Access denied.');
    }
};

router.use(restrictToBakaboi341); // Apply the middleware to all routes in this router

router.get('/', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT ip, location, timestamp FROM iplog');
        const log = result.rows;

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
                timeZone: 'America/New_York',
            }),
        }));

        const htmlTemplate = fs.readFileSync(path.join(__dirname, '../views/iplog.html'), 'utf-8');
        formattedLogEntries.reverse(); // Show the most recent log entries first
        const tableRows = formattedLogEntries.map(entry => `
            <tr class="log-entry">
                <td>${entry.ip}</td>
                <td>${entry.location}</td>
                <td>${entry.timestamp}</td>
            </tr>`).join('');

        const updatedHtml = htmlTemplate.replace('<!-- LOG_ENTRIES -->', tableRows);
        res.send(updatedHtml.replace('<%= scriptNonce %>', res.locals.scriptNonce).replace('<%= styleNonce %>', res.locals.styleNonce));

        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving log entries.');
    }
});

module.exports = router;

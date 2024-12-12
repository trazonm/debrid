const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const logFilePath = path.join(__dirname, '../logs/iplog.json');

router.get('/', (req, res) => {
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
                timeZone: 'America/New_York',
            }),
        }));

        const htmlTemplate = fs.readFileSync(path.join(__dirname, '../views/iplog.html'), 'utf-8');
        const tableRows = formattedLogEntries.map(entry => `
            <tr class="log-entry">
                <td>${entry.ip}</td>
                <td>${entry.location}</td>
                <td>${entry.timestamp}</td>
            </tr>`).join('');

        const updatedHtml = htmlTemplate.replace('<!-- LOG_ENTRIES -->', tableRows);
        res.send(updatedHtml);
    } else {
        res.status(404).send('Log file not found.');
    }
});

module.exports = router;

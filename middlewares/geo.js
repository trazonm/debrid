const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logFilePath = path.join(__dirname, '../logs/iplog.json');
const MAX_LOG_ENTRIES = 100;

// Function to determine if an IP is private
const isPrivateIp = (ip) => {
    return ip.startsWith('192.168.0') || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
};

// Middleware to log IP geolocation
const logIpGeolocation = async (req, res, next) => {
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
        const log = fs.existsSync(logFilePath) ? JSON.parse(fs.readFileSync(logFilePath, 'utf-8')) : [];

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
};

// Middleware to restrict access to U.S. users only
const restrictToUS = async (req, res, next) => {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.split(':').pop();
    }

    if (clientIp === '127.0.0.1' || clientIp === '::1') {
        return next();
    }

    try {
        const response = await axios.get(`https://ipinfo.io/${clientIp}?token=${process.env.IP_INFO_TOKEN}`);
        const location = response.data;
        const country = location.country;

        if (country !== 'US') {
            console.log(`Access denied for IP: ${clientIp} (${country})`);
            return res.status(403).send('Access denied. This service is available to U.S. users only.');
        }

        next();
    } catch (error) {
        console.error(`Geolocation error for IP ${clientIp}:`, error.message);
        res.status(500).send('Internal Server Error: Unable to verify IP location.');
    }
};

module.exports = {
    logIpGeolocation,
    restrictToUS
};

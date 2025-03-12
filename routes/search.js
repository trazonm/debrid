const express = require('express');
const axios = require('axios');
const https = require('https');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Create an Axios instance with SSL verification disabled
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: true
    })
});

router.get('/', asyncHandler(async (req, res) => {
    const query = req.query.query?.trim();
    console.log("Received search query: ", query);
    if (!query) {
        return res.status(400).json({
            error: 'Query parameter is required'
        });
    }

    const apiURL = `https://jackett-service.gleeze.com/api/v2.0/indexers/all/results?apikey=${process.env.JACKETT_API_KEY}&Query=${encodeURIComponent(query)}`;

    const {
        data
    } = await axiosInstance.get(apiURL);
    res.json(data);
}));

module.exports = router;
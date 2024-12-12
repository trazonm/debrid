const express = require('express');
const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

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
    } = await axios.get(apiURL);
    res.json(data);
}));

module.exports = router;
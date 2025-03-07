const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const router = express.Router();
const pool = require('../utils/pool');

// Middleware to restrict access to bakaboi341
const restrict = (req, res, next) => {
    const username = req.session.user; // Assuming username is stored in session
    const allowedUsers = ['bakaboi341', 'im_james420', 'limeking', 'wizkid'];
    if (allowedUsers.includes(username)) {
        return next();
    } else {
        return res.status(403).send('Access denied.');
    }
};

router.use(restrict); // Apply the middleware to all routes in this router

router.get('/', async (req, res) => {
    res.render('brain', { scriptNonce: res.locals.scriptNonce, styleNonce: res.locals.styleNonce, user: req.session.user });
});

module.exports = router;

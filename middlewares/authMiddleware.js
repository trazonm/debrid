const bcrypt = require('bcrypt'); // Add bcrypt for password hashing
require('dotenv').config();

const sessionMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/');
    }
};

module.exports = sessionMiddleware; // Export sessionMiddleWare and sessionMiddleware;
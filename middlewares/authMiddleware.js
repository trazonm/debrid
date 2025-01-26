const bcrypt = require('bcrypt'); // Add bcrypt for password hashing
require('dotenv').config();

const sessionMiddleware = (req, res, next) => {
    if (req.session && req.session.user && req.cookies?.isLoggedIn === 'true') {
        return next();
    } else {
        return res.redirect('/');
    }
};

module.exports = sessionMiddleware; // Export sessionMiddleWare and sessionMiddleware;
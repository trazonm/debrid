const basicAuth = require('express-basic-auth');
const { findUserByUsername } = require('../models/user');
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing
require('dotenv').config();

const myAuthorizer = async (username, password) => {
    const user = await findUserByUsername(username);
    return user && await bcrypt.compare(password, user.password); // Compare hashed passwords
};

const authMiddleware = basicAuth({
    authorizer: myAuthorizer,
    authorizeAsync: true,
    challenge: true,
    unauthorizedResponse: 'Unauthorized access to this page',
});

const sessionMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/');
    }
};

module.exports = sessionMiddleware;
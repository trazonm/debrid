const basicAuth = require('express-basic-auth');
require('dotenv').config();

const username = process.env.BASIC_AUTH_USER;
const password = process.env.BASIC_AUTH_PASS;

module.exports = basicAuth({
    users: { [username]: password },
    challenge: true,
    unauthorizedResponse: 'Unauthorized access to this page',
});

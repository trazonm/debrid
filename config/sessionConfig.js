const session = require('express-session');
const PgSession = require("connect-pg-simple")(session);
const pool = require('../utils/pool');

module.exports = {
    store: new PgSession({
        pool, // Reuse the Postgres connection pool
        tableName: "session", // Name of the table for session data
        createTableIfMissing: true, // Automatically create the session table if it doesn't exist
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production", // Secure cookies only in production
        maxAge: 24 * 60 * 60 * 1000 // Session lasts for 24 hours
    }
};

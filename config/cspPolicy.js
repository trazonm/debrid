const crypto = require('crypto');

// Function to generate a random nonce
function generateNonce() {
    return crypto.randomBytes(16).toString('base64');
}

const scriptNonce = generateNonce();
const styleNonce = generateNonce();

const cspPolicy = {
    directives: {
        defaultSrc: ["'self'", "data:"],

        scriptSrc: [
            "'self'",
            `'nonce-${scriptNonce}'`,
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net",
            "https://www.google.com/recaptcha/",
            "https://*.google.com/recaptcha/",
            "https://www.gstatic.com/recaptcha/",
        ],

        scriptSrcAttr: [
            `'nonce-${scriptNonce}'`
        ],

        styleSrc: [
            "'self'",
            `'nonce-${styleNonce}'`,
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
            "https://fonts.cdnfonts.com",
        ],

        fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://fonts.cdnfonts.com"
        ],

        mediaSrc: [
            "'self'" // Allow audio from your own server
        ],

        imgSrc: [
            "'self'",
            "data:"
        ],

        objectSrc: ["'none'"],

        connectSrc: ["'self'", 'https://jackett-service.gleeze.com', "data:", "https://www.google.com/recaptcha/", "https://*.google.com/recaptcha/*"],

        frameSrc: [
            "'self'",
            "https://www.google.com",
            "https://jcw87.github.io/",
            "https://bakaserver.gleeze.com",
        ]
    }
};

module.exports = { cspPolicy, scriptNonce, styleNonce };
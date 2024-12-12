// config/cspPolicy.js

const cspPolicy = {
    directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net"
        ],

        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
            "https://fonts.cdnfonts.com"
        ],

        fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://fonts.cdnfonts.com"
        ],

        imgSrc: [
            "'self'",
            "data:"
        ],

        objectSrc: ["'none'"],

        connectSrc: [
            "'self'",
            "https://jackett-service.gleeze.com",
            "https://ipapi.co",
            "https://freegeoip.app"
        ],

        upgradeInsecureRequests: []
    }
};

module.exports = cspPolicy;

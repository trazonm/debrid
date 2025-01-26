const cspPolicy = {
    directives: {
        defaultSrc: ["'self'", "data:"],

        scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net",
            "https://www.google.com/recaptcha/",
            "https://*.google.com/recaptcha/",
            "https://www.gstatic.com/recaptcha/",
        ],

        scriptSrcAttr: [
            "'unsafe-inline'"
        ],

        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
            "https://fonts.cdnfonts.com",
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

        connectSrc: ["'self'", 'https://jackett-service.gleeze.com', "data:", "https://www.google.com/recaptcha/", "https://*.google.com/recaptcha/*"],

        frameSrc: [
            "'self'",
            "https://www.google.com",
            "https://jcw87.github.io/"
        ]
    }
};

module.exports = cspPolicy;
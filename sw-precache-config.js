// sw-precache-config.js
module.exports = {
    staticFileGlobs: [
      '/assets/**',         // Cache all files in the /assets folder (e.g., CSS, images)
      '/scripts/**',        // Cache all files in the /scripts folder
      '/favicon.ico',       // Cache favicon
      '/',
      '/index.html',        // Cache the homepage
      '/iplog.html'         // Cache iplog page
    ],
    stripPrefix: '/',
    runtimeCaching: [{
      urlPattern: /\/scripts\//, // Cache dynamic requests from /scripts
      handler: 'networkFirst',  // Fetch from network first, then fall back to cache
    }],
    verbose: true,            // Output verbose logging during the build
  };
  
module.exports = {
    staticFileGlobs: [
      'assets/**',       // Cache all files in /assets
      'scripts/**',      // Cache all files in /scripts
      'views/**',        // Cache all HTML pages
      'manifest.json',   // Cache the manifest file
      'favicon.jpg'      // Cache the favicon
    ],
    stripPrefix: '',
    runtimeCaching: [
      {
        urlPattern: /\/scripts\//, // Cache dynamic requests for /scripts
        handler: 'networkFirst',
      },
    ],
    swFilePath: 'sw.js', // Generate service worker in the root directory
    verbose: true,
  };
  
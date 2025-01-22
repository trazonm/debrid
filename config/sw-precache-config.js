module.exports = {
    staticFileGlobs: [
      'public/**',       // Cache all files in /public
      'scripts/**',      // Cache all files in /scripts
      'views/**',        // Cache all HTML pages
      'manifest.json',   // Cache the manifest file
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
  
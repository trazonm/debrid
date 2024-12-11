module.exports = {
    staticFileGlobs: [
      'assets/**',          // Cache all files in the /assets folder (e.g., CSS, images)
      'scripts/**',         // Cache all files in the /scripts folder
      'views/**'            // Cache pages
    ],
    stripPrefix: '',
    runtimeCaching: [
      {
        urlPattern: /\/scripts\//, // Cache dynamic requests from /scripts
        handler: 'networkFirst',  // Fetch from network first, then fall back to cache
      },
    ],
    swFilePath: './sw.js', // Output sw.js to the root directory of your project
    verbose: true,
  };
  
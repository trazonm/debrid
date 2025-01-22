module.exports = {
    staticFileGlobs: [
      'public/**',       // Cache all files in /public
      'manifest.json',   // Cache the manifest file
    ],
    stripPrefix: '',
    runtimeCaching: [
      {
        urlPattern: /\/public\//, // Cache dynamic requests for /public
        handler: 'networkFirst',
      },
    ],
    swFilePath: 'sw.js', // Generate service worker in the root directory
    verbose: true,
  };
  
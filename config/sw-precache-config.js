module.exports = {
  staticFileGlobs: [
    'public/**',       // Cache all files in /public
    'manifest.json',   // Cache the manifest file
    'views/*.html',    // Cache all HTML files in /views
    'public/assets/styles.autoprefixed.css', // Cache the CSS file
    'public/js/*.js',  // Cache all JS files in /public/js
  ],
  stripPrefix: '',
  runtimeCaching: [
    {
      urlPattern: /\/public\//, // Cache dynamic requests for /public
      handler: 'networkFirst',
    },
    {
      urlPattern: /\/api\//, // Cache API requests
      handler: 'networkFirst',
    },
    {
      urlPattern: /\/views\//, // Cache dynamic requests for /views
      handler: 'networkFirst',
    },
  ],
  swFilePath: 'sw.js', // Generate service worker in the root directory
  verbose: true,
  // Add cacheId to ensure cache is updated when files change
  cacheId: 'debrid-app-cache',
  // Add a maximum age for cached files
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
};

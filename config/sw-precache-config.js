const version = require('../version.json').version || Date.now(); // Fallback to Date.now()

module.exports = {
  staticFileGlobs: [
    'public/**',
    'manifest.json',
    'views/*.html',
    'public/assets/styles.autoprefixed.css',
    'public/js/*.js',
  ],
  staticFileGlobsIgnorePatterns: [
    /\.(mp4|webm|ogg|mp3|wav|flac)$/, // Exclude large media files
  ],
  stripPrefix: '',
  runtimeCaching: [
    {
      urlPattern: /\/public\//,
      handler: 'networkFirst',
    },
    {
      urlPattern: /\/torrents\//,
      handler: 'networkFirst',
    },
    {
      urlPattern: /\/account\//,
      handler: 'networkFirst',
    },
    {
      urlPattern: /\/views\//,
      handler: 'networkFirst',
    },
    {
      urlPattern: /\.(mp4|webm|ogg|mp3|wav|flac)$/,
      handler: 'networkOnly', // Prevent caching of media files
    },
  ],
  swFilePath: `sw-${version}.js`, // Dynamically add versioning
  verbose: true,
  cacheId: 'debrid-app-cache',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  skipWaiting: true,
  clientsClaim: true,
};

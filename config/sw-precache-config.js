const version = require('../version.json').version || Date.now(); // Fallback to Date.now()

module.exports = {
  staticFileGlobs: [
    'public/**',
    'manifest.json',
    'views/*.html',
    'public/assets/*.css',
    'public/js/*.js',
  ],
  staticFileGlobsIgnorePatterns: [
    '**/*.mp4',
    '**/*.webm',
    '**/*.ogg',
    '**/*.mp3',
    '**/*.wav',
    '**/*.flac',
  ],
  stripPrefix: '',
  runtimeCaching: [
    {
      urlPattern: /\/public\/(?!.*\.(mp4|webm|ogg|mp3|wav|flac)$)/,
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
  ],
  swFilePath: `sw-${version}.js`, // Dynamically add versioning
  verbose: true,
  cacheId: 'debrid-app-cache',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  skipWaiting: true,
  clientsClaim: true,
};

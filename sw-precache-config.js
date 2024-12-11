module.exports = {
    staticFileGlobs: [
      '/assets/**',         
      '/scripts/**',        
      '/favicon.ico',       
      '/',
      '/index.html',        
      '/iplog.html'         
    ],
    stripPrefix: '/',
    runtimeCaching: [{
      urlPattern: /\/scripts\//,
      handler: 'networkFirst',
    }],
    swFilePath: 'sw.js', // Ensure sw.js is placed in the root directory
    verbose: true,
  };
  
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3003',
      changeOrigin: true,
    })
  );
  app.use(
    '/stats',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3003',
      changeOrigin: true,
    })
  );
  app.use(
    '/sync',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3003',
      changeOrigin: true,
    })
  );
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'ws://127.0.0.1:8080',
      changeOrigin: true,
      ws: true,
    })
  );
  
  console.log('Proxy middleware applied');
};

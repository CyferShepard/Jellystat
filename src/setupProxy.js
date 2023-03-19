const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
    })
  );
  app.use(
    '/stats',
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
    })
  );
  app.use(
    '/sync',
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
    })
  );
  console.log('Proxy middleware applied to /api');
};

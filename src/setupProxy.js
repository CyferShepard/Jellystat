const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    `/api`,
    createProxyMiddleware({
      target: `http://127.0.0.1:${process.env.PORT || 3003}`,
      changeOrigin: true,
    }),
  );
  app.use(
    `/proxy`,
    createProxyMiddleware({
      target: `http://127.0.0.1:${process.env.PORT || 3003}`,
      changeOrigin: true,
    }),
  );
  app.use(
    `/stats`,
    createProxyMiddleware({
      target: `http://127.0.0.1:${process.env.PORT || 3003}`,
      changeOrigin: true,
    }),
  );
  app.use(
    `/sync`,
    createProxyMiddleware({
      target: `http://127.0.0.1:${process.env.PORT || 3003}`,
      changeOrigin: true,
    }),
  );
  app.use(
    `/auth`,
    createProxyMiddleware({
      target: `http://127.0.0.1:${process.env.PORT || 3003}`,
      changeOrigin: true,
    }),
  );
  app.use(
    `/logs`,
    createProxyMiddleware({
      target: `http://127.0.0.1:${process.env.PORT || 3003}`,
      changeOrigin: true,
    }),
  );

  console.log(`Proxy middleware applied`);
};

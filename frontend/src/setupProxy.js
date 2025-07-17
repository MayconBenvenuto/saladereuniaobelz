const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Só configura proxy em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:3001',
        changeOrigin: true,
      })
    );
  }
};

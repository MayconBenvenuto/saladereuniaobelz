module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Corrigido para a porta correta do backend
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },
};
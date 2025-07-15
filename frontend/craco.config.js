module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // <-- Mude aqui para a URL do seu backend
        changeOrigin: true,
        pathRewrite: { '^/api': '' }, // Opcional: remove /api do início da URL antes de enviar para o backend
      },
    },
  },
};
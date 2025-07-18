module.exports = {
  babel: {
    plugins: [
      ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
      ["@babel/plugin-transform-class-properties", { loose: true }],
      ["@babel/plugin-transform-private-methods", { loose: true }]
    ]
  },
  devServer: {
    proxy: {
      '/api': {
        target: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === 'production') {
        // Configurações específicas para produção
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
        };
      }
      return webpackConfig;
    },
  },
};
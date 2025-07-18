// Versão super simples do vercel.js para debugging
const serverless = require('serverless-http');

console.log('🚀 VERCEL SUPER SIMPLES INICIANDO...');

try {
  const app = require('./index-simple');
  console.log('✅ App super simples carregado');
  
  const handler = serverless(app);
  console.log('✅ Handler super simples criado');
  
  module.exports = handler;
} catch (error) {
  console.error('❌ Erro no vercel super simples:', error);
  
  // Fallback manual
  module.exports = (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Erro na inicialização',
      message: error.message,
      timestamp: new Date().toISOString()
    }));
  };
}

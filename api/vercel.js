// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');

console.log('=== VERCEL.JS STARTING ===');

// Importar o app Express
let app;
try {
  app = require('./index');
  console.log('✅ App Express carregado com sucesso');
  
  // Verificar se o app foi exportado corretamente
  if (!app || (typeof app !== 'function' && !app.handle)) {
    console.error('❌ App não é um Express app válido:', typeof app);
    throw new Error('App Express inválido');
  }
  
} catch (error) {
  console.error('❌ Erro ao carregar app Express:', error);
  throw error;
}

// Configurar o handler serverless com timeouts otimizados
const handler = serverless(app, {
  binary: false,
  request: (request, event, context) => {
    console.log(`📡 [${new Date().toISOString()}] Requisição: ${request.method} ${request.url}`);
    
    // Configurar timeout para a função
    context.callbackWaitsForEmptyEventLoop = false;
  },
  response: (response, event, context) => {
    console.log(`✅ [${new Date().toISOString()}] Resposta: ${response.statusCode}`);
  }
});

module.exports = handler;
module.exports.handler = handler;

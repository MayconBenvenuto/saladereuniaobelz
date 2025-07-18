// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');

console.log('=== VERCEL.JS STARTING ===');

// Importar o app
let app;
try {
  app = require('./index');
  console.log('App loaded successfully');
  
  // Verificar se o app foi exportado corretamente
  if (typeof app !== 'function' && !app.handle) {
    console.error('App is not a valid Express app:', typeof app);
    throw new Error('Invalid Express app export');
  }
  
} catch (error) {
  console.error('Error loading app:', error);
  throw error;
}

const handler = serverless(app, {
  binary: false,
  request: (request, event, context) => {
    console.log('Handling request:', request.url);
  }
});

module.exports = handler;
module.exports.handler = handler;

// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');

console.log('=== VERCEL.JS STARTING ===');

// Importar o app
let app;
try {
  app = require('./index');
  console.log('App loaded successfully');
} catch (error) {
  console.error('Error loading app:', error);
  throw error;
}

const handler = serverless(app, {
  binary: false
});

module.exports = handler;
module.exports.handler = handler;

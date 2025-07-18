// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');

console.log('🚀 VERCEL.JS INICIANDO...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('📦 VERCEL:', !!process.env.VERCEL);

// Importar o app Express
let app;
try {
  console.log('📂 Importando ./index.js...');
  app = require('./index');
  console.log('✅ App Express carregado com sucesso');
  console.log('🔍 Tipo do app:', typeof app);
  console.log('🔍 App tem handle?', !!app.handle);
  console.log('🔍 App é função?', typeof app === 'function');
  
  // Verificar se o app foi exportado corretamente
  if (!app || (typeof app !== 'function' && !app.handle)) {
    console.error('❌ App não é um Express app válido:', typeof app);
    throw new Error('App Express inválido');
  }
  
} catch (error) {
  console.error('❌ Erro ao carregar app Express:', error);
  console.error('📋 Stack:', error.stack);
  throw error;
}

console.log('⚙️ Configurando handler serverless...');

// Configurar o handler serverless de forma mais simples
const handler = serverless(app);

console.log('✅ Handler configurado com sucesso');

module.exports = handler;

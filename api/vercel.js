// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');

console.log('🚀 VERCEL.JS INICIANDO...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('📦 VERCEL:', !!process.env.VERCEL);
console.log('🔍 VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('🔍 VERCEL_URL:', process.env.VERCEL_URL);
console.log('🔍 VERCEL_REGION:', process.env.VERCEL_REGION);
console.log('🔍 Variáveis de ambiente disponíveis:');
console.log('   - SUPABASE_URL:', !!process.env.SUPABASE_URL);
console.log('   - SUPABASE_KEY:', !!process.env.SUPABASE_KEY);

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
console.log('🔍 Handler tipo:', typeof handler);

// Função wrapper para logs adicionais
const wrappedHandler = async (req, res) => {
  console.log('📨 Nova requisição recebida:', {
    method: req.method,
    url: req.url,
    headers: Object.keys(req.headers || {}),
    timestamp: new Date().toISOString()
  });
  
  try {
    const result = await handler(req, res);
    console.log('✅ Requisição processada com sucesso');
    return result;
  } catch (error) {
    console.error('❌ Erro ao processar requisição:', error);
    console.error('📋 Stack:', error.stack);
    throw error;
  }
};

console.log('🎯 Exportando handler final...');
module.exports = wrappedHandler;

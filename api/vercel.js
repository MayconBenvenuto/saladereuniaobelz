// Adaptador para rodar Express como Serverless Function na Vercel
console.log('🚀 VERCEL.JS INICIANDO...');
console.log('📅 Timestamp:', new Date().toISOString());

// Timeout de 5 segundos para inicialização
const INIT_TIMEOUT = 5000;

let app;
const initPromise = new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    reject(new Error('Timeout na inicialização do app Express'));
  }, INIT_TIMEOUT);

  try {
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
    console.log('� VERCEL:', !!process.env.VERCEL);
    console.log('🔍 VERCEL_ENV:', process.env.VERCEL_ENV);
    console.log('🔍 Variáveis de ambiente disponíveis:');
    console.log('   - SUPABASE_URL:', !!process.env.SUPABASE_URL);
    console.log('   - SUPABASE_KEY:', !!process.env.SUPABASE_KEY);

    console.log('📂 Importando ./index.js...');
    app = require('./index');
    console.log('✅ App Express carregado com sucesso');
    
    clearTimeout(timer);
    resolve(app);
  } catch (error) {
    clearTimeout(timer);
    console.error('❌ Erro ao carregar app Express:', error);
    reject(error);
  }
});

// Handler principal com fallback
module.exports = async (req, res) => {
  console.log('📨 Nova requisição recebida:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  try {
    // Aguardar inicialização com timeout
    const expressApp = await Promise.race([
      initPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout aguardando app')), 10000)
      )
    ]);

    // Se chegou até aqui, usar o serverless handler
    const serverless = require('serverless-http');
    const handler = serverless(expressApp);
    
    return await handler(req, res);
    
  } catch (error) {
    console.error('❌ Erro crítico na função:', error);
    
    // Fallback: resposta de emergência
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const fallbackResponse = {
      error: 'Erro na inicialização da API',
      details: error.message,
      timestamp: new Date().toISOString(),
      fallback: true,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_KEY
      }
    };
    
    return res.status(500).json(fallbackResponse);
  }
};

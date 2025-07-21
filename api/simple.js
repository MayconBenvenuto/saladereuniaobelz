// api/simple.js - Endpoint ultra-simples para diagnóstico
console.log('🚀 SIMPLE API STARTING...');

module.exports = (req, res) => {
  console.log('📨 Simple API called:', new Date().toISOString());
  
  // Headers básicos
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Resposta instantânea sem dependências
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API simple funcionando!',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_KEY,
    }
  };
  
  console.log('✅ Simple response:', response);
  res.status(200).json(response);
};

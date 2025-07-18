// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');

// Carregar dotenv apenas se não estiver em produção
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('=== VERCEL.JS LOADED ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);
console.log('SUPABASE_URL value:', process.env.SUPABASE_URL?.substring(0, 30) + '...');

// Importar o app após configurar as variáveis
const app = require('./index');

const handler = serverless(app);

module.exports = async (req, res) => {
  console.log('=== VERCEL REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const result = await handler(req, res);
    console.log('Request processed successfully');
    return result;
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports.handler = module.exports;

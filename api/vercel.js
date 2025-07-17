// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');
const app = require('./index');

console.log('=== VERCEL.JS LOADED ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);

const handler = serverless(app);

module.exports = async (req, res) => {
  console.log('=== VERCEL REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Path:', req.path);
  
  return handler(req, res);
};

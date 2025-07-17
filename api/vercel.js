// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');
const app = require('./index');

console.log('Vercel.js carregado, NODE_ENV:', process.env.NODE_ENV);

module.exports = serverless(app);

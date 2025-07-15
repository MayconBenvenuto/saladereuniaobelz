// Adaptador para rodar Express como Serverless Function na Vercel
const serverless = require('serverless-http');
const app = require('./index');

module.exports = serverless(app);

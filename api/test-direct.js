// Arquivo de teste direto para verificar se a Vercel está funcionando
const express = require('express');
const serverless = require('serverless-http');

console.log('🔧 TESTE DIRETO - Vercel funcionando');

const app = express();

app.get('/api/test-direct', (req, res) => {
  console.log('✅ Endpoint de teste direto chamado');
  res.json({
    message: 'Teste direto funcionando!',
    timestamp: new Date().toISOString(),
    vercel: true
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'API Test Direct funcionando' });
});

const handler = serverless(app);

module.exports = handler;

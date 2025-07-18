// Versão super simplificada do index.js para debugging
const express = require('express');
const cors = require('cors');

console.log('🚀 INDEX.JS SUPER SIMPLES INICIANDO...');

const app = express();

// CORS básico
app.use(cors());
app.use(express.json());

// Endpoints super simples
app.get('/api/ping', (req, res) => {
  console.log('🏓 PING chamado');
  res.json({ 
    status: 'pong', 
    timestamp: new Date().toISOString(),
    message: 'API super simples funcionando!'
  });
});

app.get('/api/health', (req, res) => {
  console.log('🏥 HEALTH chamado');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: 'super-simples'
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'API Super Simples' });
});

console.log('✅ App Express super simples criado');

// Exportar o app
module.exports = app;

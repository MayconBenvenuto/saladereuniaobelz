// Servidor local para testar a API minimal.js
const http = require('http');
const url = require('url');
const minimal = require('./api/minimal.js');

const PORT = process.env.PORT || 3000;

// Função para simular res.status() e res.json() do Express/Vercel
function enhanceResponse(res) {
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };
  
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };
  
  return res;
}

// Criar servidor HTTP
const server = http.createServer(async (req, res) => {
  try {
    // Melhorar o objeto response para ser compatível
    enhanceResponse(res);
    
    // Parse do body para requisições POST
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        req.body = body;
        minimal(req, res);
      });
    } else {
      minimal(req, res);
    }
  } catch (error) {
    console.error('Erro no servidor:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor local rodando em http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponíveis:`);
  console.log(`   GET  http://localhost:${PORT}/api/ping`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/appointments?date=2025-07-18`);
  console.log(`   POST http://localhost:${PORT}/api/appointments`);
});

// API mínima funcional para teste
module.exports = (req, res) => {
  console.log('🚀 API MINIMAL CHAMADA:', req.url);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Simple routing
  if (req.url === '/api/ping' || req.url === '/ping') {
    res.status(200).json({
      status: 'pong',
      timestamp: new Date().toISOString(),
      message: 'API minimal funcionando!',
      url: req.url,
      method: req.method
    });
    return;
  }
  
  if (req.url === '/api/health' || req.url === '/health') {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Health check OK!',
      url: req.url,
      method: req.method
    });
    return;
  }
  
  // Default response
  res.status(200).json({
    message: 'API Minimal Online',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    availableEndpoints: ['/api/ping', '/api/health']
  });
};

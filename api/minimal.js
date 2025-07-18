// API otimizada funcional para sistema de agendamentos
const { createClient } = require('@supabase/supabase-js');

// Inicialização do Supabase
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
} catch (error) {
  console.log('⚠️ Supabase não inicializado:', error.message);
}

module.exports = async (req, res) => {
  const startTime = Date.now();
  console.log(`🚀 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Parse URL
    const url = new URL(req.url, 'https://example.com');
    const path = url.pathname;
    const query = Object.fromEntries(url.searchParams);
    
    // Routing
    if (path === '/api/ping' || path === '/ping') {
      res.status(200).json({
        status: 'pong',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        message: 'API funcionando!'
      });
      return;
    }
    
    if (path === '/api/health' || path === '/health') {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        supabase: !!supabase,
        environment: process.env.NODE_ENV || 'production'
      });
      return;
    }
    
    // Appointments endpoint
    if (path === '/api/appointments' && req.method === 'GET') {
      const { date } = query;
      
      if (!date) {
        res.status(400).json({ error: 'Parâmetro date é obrigatório' });
        return;
      }
      
      if (!supabase) {
        res.status(200).json([]);
        return;
      }
      
      const { data, error } = await Promise.race([
        supabase
          .from('agendamentos')
          .select('*')
          .eq('date', date)
          .order('start_time', { ascending: true }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
      ]);
      
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      
      console.log(`✅ Appointments: ${data?.length || 0} found in ${Date.now() - startTime}ms`);
      res.status(200).json(data || []);
      return;
    }
    
    // Availability endpoint
    if (path.startsWith('/api/availability/') && req.method === 'GET') {
      const date = path.split('/api/availability/')[1];
      
      if (!date) {
        res.status(400).json({ error: 'Data é obrigatória' });
        return;
      }
      
      let appointments = [];
      
      if (supabase) {
        try {
          const { data, error } = await Promise.race([
            supabase
              .from('agendamentos')
              .select('id, name, title, start_time, end_time')
              .eq('date', date)
              .order('start_time', { ascending: true }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 15000)
            )
          ]);
          
          if (!error) {
            appointments = data || [];
          }
        } catch (error) {
          console.log('⚠️ Erro Supabase:', error.message);
        }
      }
      
      console.log(`✅ Availability: ${appointments.length} appointments in ${Date.now() - startTime}ms`);
      res.status(200).json({
        date: date,
        occupied: appointments,
        slots_config: {
          start_hour: 8,
          end_hour: 20,
          slot_duration: 30
        }
      });
      return;
    }
    
    // Default response
    res.status(200).json({
      message: 'Sistema de Agendamento - API Online',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      url: req.url,
      method: req.method,
      availableEndpoints: [
        'GET /api/ping',
        'GET /api/health', 
        'GET /api/appointments?date=YYYY-MM-DD',
        'GET /api/availability/YYYY-MM-DD'
      ]
    });
    
  } catch (error) {
    console.error('❌ Erro na API:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

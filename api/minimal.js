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
    
    // Create appointment endpoint (POST)
    if (path === '/api/appointments' && req.method === 'POST') {
      if (!supabase) {
        res.status(500).json({ error: 'Banco de dados não disponível' });
        return;
      }
      
      // Parse request body
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const appointmentData = JSON.parse(body);
          console.log(`📝 Criando agendamento:`, appointmentData);
          
          // Validar dados obrigatórios
          const { name, title, date, start_time, end_time } = appointmentData;
          
          if (!name || !title || !date || !start_time || !end_time) {
            res.status(400).json({ 
              error: 'Dados obrigatórios: name, title, date, start_time, end_time' 
            });
            return;
          }
          
          // Verificar conflitos antes de inserir
          const { data: conflicts } = await Promise.race([
            supabase
              .from('agendamentos')
              .select('id, name, start_time, end_time')
              .eq('date', date)
              .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 15000)
            )
          ]);
          
          if (conflicts && conflicts.length > 0) {
            console.log(`❌ Conflito encontrado:`, conflicts[0]);
            res.status(409).json({ 
              error: 'Horário já ocupado',
              conflict: conflicts[0]
            });
            return;
          }
          
          // Inserir o agendamento
          const { data, error } = await Promise.race([
            supabase
              .from('agendamentos')
              .insert([appointmentData])
              .select(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 15000)
            )
          ]);
          
          if (error) {
            console.error(`❌ Erro ao inserir:`, error);
            res.status(500).json({ error: error.message });
            return;
          }
          
          console.log(`✅ Agendamento criado em ${Date.now() - startTime}ms:`, data[0]);
          res.status(201).json({
            message: 'Agendamento criado com sucesso',
            appointment: data[0]
          });
          
        } catch (parseError) {
          console.error(`❌ Erro ao processar dados:`, parseError);
          res.status(400).json({ error: 'Dados inválidos' });
        }
      });
      
      return;
    }
    
    // Delete appointment endpoint (DELETE)
    if (path.startsWith('/api/appointments/') && req.method === 'DELETE') {
      if (!supabase) {
        res.status(500).json({ error: 'Banco de dados não disponível' });
        return;
      }
      
      const appointmentId = path.split('/api/appointments/')[1];
      
      if (!appointmentId) {
        res.status(400).json({ error: 'ID do agendamento é obrigatório' });
        return;
      }
      
      console.log(`🗑️ Deletando agendamento ID: ${appointmentId}`);
      
      const { data, error } = await Promise.race([
        supabase
          .from('agendamentos')
          .delete()
          .eq('id', appointmentId)
          .select(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
      ]);
      
      if (error) {
        console.error(`❌ Erro ao deletar:`, error);
        res.status(500).json({ error: error.message });
        return;
      }
      
      if (!data || data.length === 0) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      console.log(`✅ Agendamento deletado em ${Date.now() - startTime}ms`);
      res.status(200).json({
        message: 'Agendamento deletado com sucesso',
        deleted: data[0]
      });
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
        'POST /api/appointments',
        'DELETE /api/appointments/:id',
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

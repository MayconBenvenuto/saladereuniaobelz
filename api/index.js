require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();

// CORS mais específico
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Supabase
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && 
    process.env.SUPABASE_URL !== 'coloque_sua_url_aqui' && 
    process.env.SUPABASE_KEY !== 'coloque_sua_key_aqui') {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    console.log('✅ Supabase inicializado');
  } catch (error) {
    console.warn('⚠️ Erro ao inicializar Supabase:', error.message);
    supabase = null;
  }
} else {
  console.warn('⚠️ Supabase não configurado - variáveis de ambiente ausentes ou inválidas');
  console.log('💡 Para usar o Supabase, configure as variáveis SUPABASE_URL e SUPABASE_KEY no arquivo .env');
}

// Ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check
app.get('/api/health', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase.from('agendamentos').select('id').limit(1);
    if (error) throw error;
    res.json({ status: 'healthy' });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

// Get appointments
app.get('/api/appointments', async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date parameter required' });
  }
  
  if (!supabase) {
    return res.json([]);
  }
  
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('date', date)
      .order('start_time');
      
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get availability for a date
app.get('/api/availability/:date', async (req, res) => {
  const { date } = req.params;
  const { sala } = req.query; // Adicionar parâmetro de sala
  
  if (!supabase) {
    // Return mock data if no database
    return res.json({
      date,
      sala: sala || 'grande',
      occupied: [],
      available: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
    });
  }
  
  try {
    let query = supabase
      .from('agendamentos')
      .select('start_time, end_time')
      .eq('date', date);
    
    // Filtrar por sala se especificado
    if (sala) {
      query = query.eq('sala', sala);
    }
    
    const { data, error } = await query;
      
    if (error) throw error;
    
    const occupied = data.map(app => ({
      start: app.start_time,
      end: app.end_time
    }));
    
    res.json({
      date,
      sala: sala || 'todas',
      occupied,
      available: generateAvailableSlots(occupied)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create appointment
app.post('/api/appointments', async (req, res) => {
  const { name, title, date, start_time, end_time, description, participants, sala } = req.body;
  
  if (!name || !title || !date || !start_time || !end_time || !sala) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([{ name, title, date, start_time, end_time, description, participants, sala }])
      .select();
      
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete appointment
app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  
  try {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment
app.put('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { name, title, date, start_time, end_time, description, participants, sala } = req.body;
  
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .update({ name, title, date, start_time, end_time, description, participants, sala })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Função auxiliar para gerar horários disponíveis
function generateAvailableSlots(occupied) {
  const businessHours = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  return businessHours.filter(slot => {
    return !occupied.some(appointment => {
      const slotTime = slot + ':00';
      return slotTime >= appointment.start && slotTime < appointment.end;
    });
  });
}

// Default route (fallback)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// For development
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

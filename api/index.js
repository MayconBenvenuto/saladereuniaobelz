const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// CORS
app.use(cors());
app.use(express.json());

// Supabase
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
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

// Create appointment
app.post('/api/appointments', async (req, res) => {
  const { name, title, date, start_time, end_time, description } = req.body;
  
  if (!name || !title || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([{ name, title, date, start_time, end_time, description }])
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
  const { name, title, date, start_time, end_time, description } = req.body;
  
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .update({ name, title, date, start_time, end_time, description })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// For development
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conectar ao Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
console.log('Supabase conectado:', supabase); // Adicione este log

// Buscar agendamentos por data
app.get('/api/appointments', async (req, res) => {
  const { date } = req.query;

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('date', date);
  console.log('Data:', date); // Adicione este log
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Erro ao buscar agendamentos:', error); // Adicione este log
    return res.status(500).json({ error: error.message });
  }
  console.log('Agendamentos encontrados:', data); // Adicione este log
  res.json(data);
});

// Criar agendamento
app.post('/api/appointments', async (req, res) => {
  const { title, description, name, date, start_time, end_time } = req.body;

  if (!title || !name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  // Verificar conflito
  const { data: conflitos, error: errorCheck } = await supabase
    .from('appointments')
    .select('*')
    .eq('date', date);

  const conflitou = conflitos?.some(appt => {
    return (
      (start_time >= appt.start_time && start_time < appt.end_time) ||
      (end_time > appt.start_time && end_time <= appt.end_time) ||
      (start_time <= appt.start_time && end_time >= appt.end_time)
    );
  });

  if (conflitou) {
    return res.status(409).json({ error: 'Já existe um agendamento neste horário' });
  }

  const { data: created, error } = await supabase
    .from('appointments')
    .insert([{ title, description, name, date, start_time, end_time }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(created[0]);
});

// Deletar agendamento
app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Agendamento removido com sucesso' });
});

module.exports = app;

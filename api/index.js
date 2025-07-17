// Importações essenciais
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
// Importa e carrega as variáveis de ambiente de um arquivo .env
require('dotenv').config();
console.log('Iniciando backend...');

// Inicializa o aplicativo Express
const app = express();

// Configuração CORS simples mas com headers específicos
app.use(cors({
  origin: true,
  credentials: true
}));

// Middleware para adicionar headers CORS manualmente se necessário
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json()); // Habilita o parsing de JSON no corpo das requisições

// **AQUI ESTÁ A CORREÇÃO CRÍTICA:** Inicialização do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

// Verifica se as variáveis de ambiente do Supabase estão definidas
if (!supabaseUrl || !supabaseKey) {
  console.warn('AVISO: As variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não estão definidas.');
  console.warn('O sistema funcionará com dados de exemplo.');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase cliente inicializado com sucesso.');
}

// Observação: Você importou e inicializou 'postgres' como 'sql',
// mas não o utilizou para as operações de banco de dados no seu código.
// Todas as suas operações estão usando o cliente 'supabase-js'.
// Se você não pretende usar uma conexão PostgreSQL direta separada do Supabase client,
// você pode remover as linhas abaixo:
// import postgres from 'postgres'
// const connectionString = process.env.DATABASE_URL
// const sql = postgres(connectionString)
// export default sql // Esta linha também mistura CommonJS e ES Modules e não é necessária aqui.


// --- Rotas da API ---

// Rota de teste simples para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Servidor Express está rodando e conectado ao Supabase!' });
});

// Rota de teste para debugging
app.get('/api/test', (req, res) => {
  console.log('Rota de teste chamada');
  res.status(200).json({ 
    message: 'API teste funcionando!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY)
  });
});

// Buscar agendamentos por data (query parameter)
app.get('/api/appointments', async (req, res) => {
  const { date } = req.query;

  // Validação do parâmetro de entrada
  if (!date) {
    return res.status(400).json({ error: 'Parâmetro de data (date) é obrigatório.' });
  }

  console.log('Buscando agendamentos para a data:', date);

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log('Agendamentos encontrados:', data);
    res.json(data);
  } catch (err) {
    console.error('Erro interno:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Rota de disponibilidade para compatibilidade com o frontend (path parameter)
app.get('/api/availability/:date', async (req, res) => {
  const { date } = req.params;
  
  console.log('=== AVAILABILITY ROUTE CALLED ===');
  console.log('Date param:', date);
  console.log('Full URL:', req.url);
  console.log('Method:', req.method);
  console.log('Environment Variables Check:');
  console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Timeout mais rápido para melhor experiência
  req.setTimeout(15000); // 15 segundos
  res.setTimeout(15000); // 15 segundos
  
  if (!date) {
    return res.status(400).json({ error: 'Parâmetro de data é obrigatório.' });
  }
  
  try {
    let appointments = [];
    
    // Buscar do Supabase com timeout muito reduzido
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && supabase) {
      try {
        // Timeout de apenas 3 segundos para consulta rápida
        const supabasePromise = supabase
          .from('appointments')
          .select('id, name, title, start_time, end_time')
          .eq('date', date)
          .order('start_time', { ascending: true });
          
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 3000); // 3 segundos apenas
        });
        
        const { data: supabaseData, error } = await Promise.race([
          supabasePromise,
          timeoutPromise
        ]);
          
        if (error) {
          console.warn('Supabase error (usando fallback):', error.message);
        } else {
          appointments = supabaseData || [];
        }
      } catch (supabaseErr) {
        console.warn('Supabase timeout (usando fallback):', supabaseErr.message);
      }
    }
    
    // Gerar slots de forma mais eficiente
    const slots = generateTimeSlots(appointments);
    
    // Headers para resposta rápida
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache de 1 minuto
    
    return res.status(200).json(slots);
    
  } catch (err) {
    console.error('Erro na availability:', err.message);
    
    // Fallback rápido com slots padrão
    const fallbackSlots = generateTimeSlots([]);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(fallbackSlots);
  }
});

// Função otimizada para gerar slots
function generateTimeSlots(appointments = []) {
  const slots = [];
  const startHour = 8;
  const endHour = 18;
  const slotDuration = 30;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += slotDuration) {
      const start = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const endMin = min + slotDuration;
      let endHourSlot = hour;
      let endMinSlot = endMin;
      
      if (endMin >= 60) {
        endHourSlot++;
        endMinSlot = endMin - 60;
      }
      
      const end = `${String(endHourSlot).padStart(2, '0')}:${String(endMinSlot).padStart(2, '0')}`;
      
      // Verificação mais rápida de conflitos
      const appointment = appointments.find(appt =>
        (start >= appt.start_time && start < appt.end_time) ||
        (end > appt.start_time && end <= appt.end_time) ||
        (start <= appt.start_time && end >= appt.end_time)
      );
      
      slots.push({
        start_time: start,
        end_time: end,
        available: !appointment,
        appointment: appointment ? {
          id: appointment.id,
          name: appointment.name,
          title: appointment.title
        } : null
      });
    }
  }
  
  return slots;
}

// Rota de fallback para debugging
app.get('/api/availability', (req, res) => {
  console.log('FALLBACK ROUTE: /api/availability called without date');
  res.status(400).json({ 
    error: 'Data é obrigatória. Use /api/availability/YYYY-MM-DD',
    example: '/api/availability/2025-07-17'
  });
});

// Rota de teste para verificar se a API está funcionando
app.get('/api/test', (req, res) => {
  console.log('=== API TEST ROUTE ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);
  console.log('Supabase client exists:', !!supabase);
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY && supabase),
    message: 'API está funcionando!'
  });
});

// Criar agendamento (otimizado)
app.post('/api/appointments', async (req, res) => {
  const { title, description, name, date, start_time, end_time } = req.body;

  if (!title || !name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, name, date, start_time, end_time.' });
  }

  // Timeout ajustado
  req.setTimeout(25000); // 25 segundos
  res.setTimeout(25000); // 25 segundos

  // Verificar se o Supabase está disponível
  if (!supabase || !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    return res.status(503).json({ 
      error: 'Serviço temporariamente indisponível. Tente novamente.' 
    });
  }

  try {
    // Verificar conflito com timeout de 6 segundos
    let conflitos = null;
    let errorCheck = null;
    try {
      const checkConflictPromise = supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('date', date);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao checar conflitos')), 6000); // 6 segundos
      });
      ({ data: conflitos, error: errorCheck } = await Promise.race([
        checkConflictPromise,
        timeoutPromise
      ]));
    } catch (err) {
      if (err.message.includes('Timeout')) {
        console.warn('Timeout ao checar conflitos. Retornando erro rápido.');
        return res.status(504).json({ error: 'Timeout ao checar disponibilidade. Tente novamente.' });
      } else {
        console.error('Erro inesperado ao checar conflitos:', err.message);
        return res.status(500).json({ error: 'Erro ao verificar disponibilidade.' });
      }
    }

    if (errorCheck) {
      console.error('Erro ao verificar conflitos:', errorCheck.message);
      return res.status(500).json({ error: 'Erro ao verificar disponibilidade.' });
    }

    const conflitou = conflitos?.some(appt => {
      return (
        (start_time >= appt.start_time && start_time < appt.end_time) ||
        (end_time > appt.start_time && end_time <= appt.end_time) ||
        (start_time <= appt.start_time && end_time >= appt.end_time)
      );
    });

    if (conflitou) {
      return res.status(409).json({ error: 'Horário já ocupado.' });
    }

    // Criar agendamento com timeout de 8 segundos
    let created = null;
    let error = null;
    try {
      const createAppointmentPromise = supabase
        .from('appointments')
        .insert([{ title, description, name, date, start_time, end_time }])
        .select();
      const createTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao salvar agendamento')), 8000); // 8 segundos
      });
      ({ data: created, error } = await Promise.race([
        createAppointmentPromise,
        createTimeoutPromise
      ]));
    } catch (err) {
      if (err.message.includes('Timeout')) {
        console.warn('Timeout ao salvar agendamento. Retornando erro rápido.');
        return res.status(504).json({ error: 'Timeout ao salvar agendamento. Tente novamente.' });
      } else {
        console.error('Erro inesperado ao salvar agendamento:', err.message);
        return res.status(500).json({ error: 'Erro ao salvar agendamento.' });
      }
    }

    if (error) {
      console.error('Erro ao criar agendamento:', error.message);
      return res.status(500).json({ error: 'Erro ao salvar agendamento.' });
    }

    res.status(201).json(created[0]);

  } catch (err) {
    console.error('Erro interno:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Deletar agendamento
app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID do agendamento é obrigatório para exclusão.' });
  }

  try {
    console.log('Deletando agendamento com ID:', id);
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar agendamento:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log('Agendamento removido com sucesso, ID:', id);
    res.json({ message: 'Agendamento removido com sucesso.' });
    
  } catch (err) {
    console.error('Erro interno ao deletar agendamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Adaptação para Vercel Serverless Function
const serverless = require('serverless-http');
module.exports = serverless(app);
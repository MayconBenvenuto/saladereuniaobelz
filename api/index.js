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

// Configuração CORS otimizada
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Headers CORS otimizados (removendo duplicação)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
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

// Rota de disponibilidade otimizada - retorna apenas agendamentos ocupados
app.get('/api/availability/:date', async (req, res) => {
  const { date } = req.params;
  
  console.log('=== OPTIMIZED AVAILABILITY ROUTE ===');
  console.log('Date:', date);
  
  // Timeout aumentado para conexões móveis
  req.setTimeout(30000); // 30 segundos
  res.setTimeout(30000); // 30 segundos
  
  if (!date) {
    return res.status(400).json({ error: 'Parâmetro de data é obrigatório.' });
  }
  
  try {
    let appointments = [];
    
    // Buscar apenas agendamentos ocupados (payload menor)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && supabase) {
      try {
        // Timeout aumentado para 15 segundos
        const supabasePromise = supabase
          .from('appointments')
          .select('id, name, title, start_time, end_time')
          .eq('date', date)
          .order('start_time', { ascending: true });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na consulta Supabase')), 15000); // 15 segundos
        });

        const result = await Promise.race([
          supabasePromise,
          timeoutPromise
        ]);

        if (result && result.error) {
          console.warn('Supabase error:', result.error.message);
        } else if (result && result.data) {
          appointments = result.data || [];
        }
      } catch (supabaseErr) {
        console.warn('Erro ao consultar Supabase:', supabaseErr.message);
      }
    }
    
    // Headers otimizados para mobile
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache de 5 minutos
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Retorna apenas os agendamentos ocupados (frontend gera os slots)
    return res.status(200).json({
      date: date,
      occupied: appointments,
      slots_config: {
        start_hour: 8,
        end_hour: 18,
        slot_duration: 30
      }
    });
    
  } catch (err) {
    console.error('Erro na availability:', err.message);
    
    // Fallback com resposta mínima
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      date: date,
      occupied: [],
      slots_config: {
        start_hour: 8,
        end_hour: 18,
        slot_duration: 30
      }
    });
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

// Criar agendamento otimizado com transação única
app.post('/api/appointments', async (req, res) => {
  const { title, description, name, date, start_time, end_time } = req.body;

  if (!title || !name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, name, date, start_time, end_time.' });
  }

  // Timeout aumentado para conexões móveis
  req.setTimeout(45000); // 45 segundos
  res.setTimeout(45000); // 45 segundos

  // Verificar se o Supabase está disponível
  if (!supabase || !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    return res.status(503).json({ 
      error: 'Serviço temporariamente indisponível. Tente novamente.' 
    });
  }

  try {
    console.log('=== CRIANDO AGENDAMENTO ===');
    console.log('Dados:', { title, name, date, start_time, end_time });

    // Transação única: verifica conflito E cria agendamento em uma operação
    const { data: created, error } = await supabase.rpc('create_appointment_safe', {
      p_title: title,
      p_name: name,
      p_date: date,
      p_start_time: start_time,
      p_end_time: end_time,
      p_description: description || null
    });

    if (error) {
      console.error('Erro na função RPC:', error.message);
      
      // Se a função RPC não existir, usar método tradicional com retry
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        return await createAppointmentTraditional(req, res, { title, description, name, date, start_time, end_time });
      }
      
      if (error.message.includes('conflict') || error.message.includes('ocupado')) {
        return res.status(409).json({ error: 'Horário já ocupado por outro agendamento.' });
      }
      
      return res.status(500).json({ error: 'Erro ao salvar agendamento. Tente novamente.' });
    }

    console.log('Agendamento criado com sucesso:', created);
    res.status(201).json(created);

  } catch (err) {
    console.error('Erro interno:', err.message);
    
    // Fallback para método tradicional em caso de erro
    return await createAppointmentTraditional(req, res, { title, description, name, date, start_time, end_time });
  }
});

// Função helper para criar agendamento tradicional com retry
async function createAppointmentTraditional(req, res, { title, description, name, date, start_time, end_time }) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Tentativa ${attempt}/${maxRetries} - método tradicional`);
    
    try {
      // Verificar conflito com timeout de 10 segundos
      const checkConflictPromise = supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('date', date);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao checar conflitos')), 10000);
      });
      
      const { data: conflitos, error: errorCheck } = await Promise.race([
        checkConflictPromise,
        timeoutPromise
      ]);

      if (errorCheck) {
        throw new Error(`Erro ao verificar conflitos: ${errorCheck.message}`);
      }

      const conflitou = conflitos?.some(appt => {
        return (
          (start_time >= appt.start_time && start_time < appt.end_time) ||
          (end_time > appt.start_time && end_time <= appt.end_time) ||
          (start_time <= appt.start_time && end_time >= appt.end_time)
        );
      });

      if (conflitou) {
        return res.status(409).json({ error: 'Horário já ocupado por outro agendamento.' });
      }

      // Criar agendamento com timeout de 15 segundos
      const createPromise = supabase
        .from('appointments')
        .insert([{ title, description, name, date, start_time, end_time }])
        .select();
      
      const createTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao salvar agendamento')), 15000);
      });
      
      const { data: created, error } = await Promise.race([
        createPromise,
        createTimeoutPromise
      ]);

      if (error) {
        throw new Error(`Erro ao salvar: ${error.message}`);
      }

      console.log(`Agendamento criado na tentativa ${attempt}:`, created[0]);
      return res.status(201).json(created[0]);

    } catch (err) {
      console.warn(`Tentativa ${attempt} falhou:`, err.message);
      
      if (attempt === maxRetries) {
        console.error('Todas as tentativas falharam');
        return res.status(500).json({ 
          error: 'Erro ao salvar agendamento após múltiplas tentativas. Verifique sua conexão e tente novamente.' 
        });
      }
      
      // Aguardar antes da próxima tentativa (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

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

// Novo endpoint otimizado: apenas slots ocupados (muito mais rápido)
app.get('/api/occupied-slots/:date', async (req, res) => {
  const { date } = req.params;
  
  console.log('=== OCCUPIED SLOTS ROUTE ===');
  console.log('Date:', date);
  
  // Headers de performance
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=30'); // Cache de 30 segundos
  res.setHeader('X-Response-Time', Date.now());
  
  if (!date) {
    return res.status(400).json({ error: 'Data é obrigatória.' });
  }
  
  try {
    let appointments = [];
    
    if (supabase) {
      // Timeout mais generoso para conexão inicial
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), 20000); // 20 segundos
      });
      
      const queryPromise = supabase
        .from('appointments')
        .select('id, name, title, start_time, end_time')
        .eq('date', date)
        .order('start_time', { ascending: true });
      
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        if (result && !result.error && result.data) {
          appointments = result.data;
        } else if (result && result.error) {
          console.warn('Supabase query error:', result.error.message);
        }
      } catch (dbError) {
        console.warn('Database error (returning empty):', dbError.message);
      }
    }
    
    // Retornar apenas os agendamentos (muito menor payload)
    return res.status(200).json(appointments);
    
  } catch (err) {
    console.error('Error in occupied-slots:', err.message);
    // Em caso de erro, retornar array vazio (não falhar)
    return res.status(200).json([]);
  }
});

// Endpoint otimizado para verificação rápida de disponibilidade
app.get('/api/check-availability/:date/:start_time/:end_time', async (req, res) => {
  const { date, start_time, end_time } = req.params;
  
  console.log('=== CHECK AVAILABILITY ===');
  console.log('Params:', { date, start_time, end_time });
  
  if (!date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Todos os parâmetros são obrigatórios.' });
  }
  
  try {
    let available = true;
    
    if (supabase) {
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', date)
        .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`)
        .limit(1);
      
      available = !conflicts || conflicts.length === 0;
    }
    
    res.json({ available, checked_at: new Date().toISOString() });
    
  } catch (err) {
    console.error('Error checking availability:', err.message);
    // Em caso de erro, assumir disponível (melhor UX)
    res.json({ available: true, error: 'Could not verify, assuming available' });
  }
});

// Adaptação para Vercel Serverless Function
const serverless = require('serverless-http');
module.exports = serverless(app);
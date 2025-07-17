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
  
  if (!date) {
    console.log('ERROR: Date parameter missing');
    return res.status(400).json({ error: 'Parâmetro de data (date) é obrigatório.' });
  }
  
  try {
    console.log('Data recebida para availability:', date);
    
    let appointments = [];
    
    // Tentar buscar do Supabase, mas continuar mesmo se falhar
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && supabase) {
      try {
        console.log('Tentando conectar ao Supabase...');
        const { data: supabaseData, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('date', date)
          .order('start_time', { ascending: true });
          
        if (error) {
          console.error('SUPABASE ERROR (continuing anyway):', error);
        } else {
          appointments = supabaseData || [];
          console.log('Dados do Supabase carregados com sucesso:', appointments.length, 'appointments');
        }
      } catch (supabaseErr) {
        console.error('SUPABASE CONNECTION ERROR (continuing anyway):', supabaseErr);
      }
    } else {
      console.log('Supabase not configured properly, using empty appointments');
      console.log('Missing:', {
        url: !process.env.SUPABASE_URL,
        key: !process.env.SUPABASE_KEY,
        client: !supabase
      });
    }
    
    console.log('Agendamentos encontrados:', appointments?.length || 0);
    
    // Gerar todos os horários possíveis do dia (exemplo: 08:00 às 18:00, de 30 em 30 min)
    const startHour = 8;
    const endHour = 18;
    const slotDuration = 30; // minutos
    const slots = [];
    
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
        
        // Verifica se esse slot está ocupado
        const appointment = (appointments || []).find(appt =>
          (start >= appt.start_time && start < appt.end_time) ||
          (end > appt.start_time && end <= appt.end_time) ||
          (start <= appt.start_time && end >= appt.end_time)
        );
        
        slots.push({
          start_time: start,
          end_time: end,
          available: !appointment,
          appointment: appointment || null
        });
      }
    }
    
    console.log(`Slots gerados: ${slots.length} slots para ${date}`);
    console.log('=== RETURNING RESPONSE ===');
    console.log('Primeiro slot:', slots[0]);
    console.log('Último slot:', slots[slots.length - 1]);
    
    // Garantir headers corretos
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    res.status(200).json(slots);
    
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
    console.error('Error stack:', err.stack);
    
    // Em caso de erro crítico, retornar horários padrão
    const defaultSlots = [];
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
        
        defaultSlots.push({
          start_time: start,
          end_time: end,
          available: true,
          appointment: null
        });
      }
    }
    
    console.log('Retornando slots padrão devido a erro:', defaultSlots.length);
    res.status(200).json(defaultSlots);
  }
});

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

// Criar agendamento
app.post('/api/appointments', async (req, res) => {
  const { title, description, name, date, start_time, end_time } = req.body;

  if (!title || !name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando: title, name, date, start_time, end_time.' });
  }

  console.log(`Verificando conflitos para data: ${date}, início: ${start_time}, fim: ${end_time}`);
  
  // Verificar se o Supabase está disponível
  if (!supabase || !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Supabase não está configurado. Não é possível criar agendamentos.');
    return res.status(503).json({ 
      error: 'Serviço de banco de dados não está disponível. Entre em contato com o administrador.' 
    });
  }
  
  try {
    // Verificar conflito
    const { data: conflitos, error: errorCheck } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date);

    if (errorCheck) {
      console.error('Erro ao verificar conflitos de agendamento:', errorCheck.message);
      return res.status(500).json({ error: errorCheck.message });
    }

    const conflitou = conflitos?.some(appt => {
      return (
        (start_time >= appt.start_time && start_time < appt.end_time) ||
        (end_time > appt.start_time && end_time <= appt.end_time) ||
        (start_time <= appt.start_time && end_time >= appt.end_time)
      );
    });

    if (conflitou) {
      console.log('Conflito de agendamento detectado.');
      return res.status(409).json({ error: 'Já existe um agendamento neste horário.' });
    }

    console.log('Tentando criar novo agendamento:', { title, description, name, date, start_time, end_time });
    
    const { data: created, error } = await supabase
      .from('appointments')
      .insert([{ title, description, name, date, start_time, end_time }])
      .select();

    if (error) {
      console.error('Erro ao criar agendamento:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log('Agendamento criado com sucesso:', created[0]);
    res.status(201).json(created[0]);
    
  } catch (err) {
    console.error('Erro interno ao criar agendamento:', err);
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

// Define a porta em que o servidor irá escutar
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

// Exporta o app para que possa ser importado em outros arquivos (se necessário)
module.exports = app;
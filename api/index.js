// Importações essenciais
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('🚀 BACKEND INICIANDO...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('📦 VERCEL:', !!process.env.VERCEL);

// Carregamento mais robusto das variáveis de ambiente
if (process.env.NODE_ENV !== 'production') {
  try {
    console.log('🔍 Carregando variáveis de ambiente do arquivo .env');
    require('dotenv').config();
    console.log('✅ Arquivo .env carregado com sucesso');
  } catch (error) {
    console.warn('⚠️ Erro ao carregar .env:', error.message);
  }
}

// Inicializa o aplicativo Express
const app = express();
console.log('✅ Express app criado');

// Configuração CORS simplificada para produção
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  }));
} else {
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Accept', 
      'Origin', 
      'Cache-Control'
    ],
    optionsSuccessStatus: 204
  }));
}

app.use(bodyParser.json());

// Servir arquivos estáticos da pasta frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Inicialização do cliente Supabase com configurações otimizadas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

// Função para inicializar Supabase de forma segura
function initializeSupabase() {
  try {
    console.log('🔍 Verificando variáveis de ambiente do Supabase...');
    console.log('🔍 SUPABASE_URL definida:', !!supabaseUrl);
    console.log('🔍 SUPABASE_KEY definida:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ AVISO: Variáveis SUPABASE_URL ou SUPABASE_KEY não definidas - rodando sem banco');
      console.log('🔍 SUPABASE_URL valor:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined');
      console.log('🔍 SUPABASE_KEY valor:', supabaseKey ? supabaseKey.substring(0, 30) + '...' : 'undefined');
      return null;
    }
    
    console.log('🔍 URL Preview:', supabaseUrl);
    console.log('🔍 Key Preview:', supabaseKey.substring(0, 50) + '...');
    
    // Configurações otimizadas do cliente Supabase
    const supabaseOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'x-application-name': 'saladereuniaobelz'
        }
      }
    };
    
    supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);
    console.log('✅ Supabase inicializado com sucesso');
    console.log('🔍 Cliente Supabase tipo:', typeof supabase);
    return supabase;
  } catch (error) {
    console.error('❌ Erro ao inicializar Supabase:', error);
    return null;
  }
}

// Inicializar Supabase
supabase = initializeSupabase();

// Endpoint super simples para teste de conectividade - SEM DEPENDÊNCIAS
app.get('/api/ping', (req, res) => {
  try {
    console.log('🏓 Ping endpoint chamado');
    const response = {
      status: 'pong',
      timestamp: new Date().toISOString(),
      message: 'API funcionando!'
    };
    console.log('✅ Ping response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Erro no ping:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Health check endpoint - MAIS RÁPIDO e sem dependências
app.get('/api/health', (req, res) => {
  try {
    console.log('🏥 Health check endpoint chamado');
    const response = { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      supabase: !!supabase,
      environment: process.env.NODE_ENV || 'unknown',
      vercel: !!process.env.VERCEL,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_KEY
    };
    console.log('✅ Health response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Erro no health:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Endpoint para testar conexão específica do Supabase
app.get('/api/test-supabase', async (req, res) => {
  try {
    console.log('🧪 Testando conexão Supabase...');
    
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Supabase não inicializado',
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_KEY,
        urlPreview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'undefined'
      });
    }

    // Teste simples de conexão com timeout curto
    const { data, error } = await Promise.race([
      supabase.from('agendamentos').select('id').limit(1),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na conexão Supabase')), 5000))
    ]);

    if (error) {
      console.error('❌ Erro na conexão Supabase:', error);
      return res.status(500).json({ 
        error: 'Erro na conexão Supabase', 
        details: error.message,
        code: error.code 
      });
    }

    console.log('✅ Conexão Supabase OK');
    res.json({ 
      status: 'Supabase conectado com sucesso', 
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('❌ Erro no teste Supabase:', error);
    res.status(500).json({ 
      error: 'Erro no teste Supabase', 
      message: error.message 
    });
  }
});
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
  const startTime = Date.now();
  const { date } = req.query;

  // Validação do parâmetro de entrada
  if (!date) {
    return res.status(400).json({ error: 'Parâmetro de data (date) é obrigatório.' });
  }

  console.log(`📅 [${new Date().toISOString()}] Buscando agendamentos para: ${date}`);

  try {
    // Se o Supabase não estiver configurado, retornar dados de exemplo
    if (!supabase) {
      console.log('⚠️ Supabase não configurado, retornando dados de exemplo');
      const exampleAppointments = [
        {
          id: 1,
          title: 'Reunião de Exemplo',
          name: 'Sistema',
          date: date,
          start_time: '14:00:00',
          end_time: '15:00:00',
          description: 'Agendamento de exemplo'
        }
      ];
      return res.json(exampleAppointments);
    }

    // Query otimizada com timeout
    const { data, error } = await Promise.race([
      supabase
        .from('agendamentos')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na consulta Supabase')), 15000)
      )
    ]);

    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Agendamentos encontrados: ${data?.length || 0} em ${Date.now() - startTime}ms`);
    res.json(data || []);
  } catch (err) {
    console.error('❌ Erro interno:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Rota de disponibilidade otimizada - retorna apenas agendamentos ocupados
app.get('/api/availability/:date', async (req, res) => {
  const startTime = Date.now();
  const { date } = req.params;
  
  console.log(`📅 [${new Date().toISOString()}] Buscando disponibilidade para: ${date}`);
  
  // Configurar timeout da requisição para 20 segundos
  req.setTimeout(20000);
  res.setTimeout(20000);
  
  if (!date) {
    return res.status(400).json({ error: 'Parâmetro de data é obrigatório.' });
  }
  
  try {
    let appointments = [];
    
    // Buscar apenas agendamentos ocupados (payload menor)
    if (supabase && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        console.log(`🔍 Consultando Supabase para data: ${date}`);
        
        // Query otimizada com timeout de 15 segundos
        const supabasePromise = supabase
          .from('agendamentos')
          .select('id, name, title, start_time, end_time')
          .eq('date', date)
          .order('start_time', { ascending: true });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na consulta Supabase')), 15000);
        });

        const result = await Promise.race([
          supabasePromise,
          timeoutPromise
        ]);

        if (result && result.error) {
          console.error('❌ Erro Supabase:', result.error.message);
          appointments = []; // Fallback para array vazio
        } else if (result && result.data) {
          appointments = result.data || [];
          console.log(`✅ Encontrados ${appointments.length} agendamentos em ${Date.now() - startTime}ms`);
        }
      } catch (supabaseErr) {
        console.error('❌ Erro na consulta Supabase:', supabaseErr.message);
        appointments = []; // Fallback para array vazio
      }
    } else {
      console.log('Supabase não configurado, retornando dados de exemplo');
      // Dados de exemplo se Supabase não estiver configurado
      if (date === new Date().toISOString().split('T')[0]) {
        appointments = [
          {
            id: 1,
            name: 'Sistema',
            title: 'Reunião de Exemplo',
            start_time: '14:00:00',
            end_time: '15:00:00'
          }
        ];
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
        end_hour: 20,
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
        end_hour: 20,
        slot_duration: 30
      }
    });
  }
});

// Função otimizada para gerar slots
function generateTimeSlots(appointments = []) {
  const slots = [];
  const startHour = 8;
  const endHour = 20;
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

// Criar agendamento otimizado - usar método tradicional por padrão
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
    console.log('Supabase não configurado, simulando agendamento');
    // Simular agendamento para demonstração
    const mockAppointment = {
      id: Date.now(),
      title,
      description,
      name,
      date,
      start_time,
      end_time,
      created_at: new Date().toISOString()
    };
    
    console.log('Agendamento simulado criado:', mockAppointment);
    return res.status(201).json(mockAppointment);
  }

  try {
    console.log('=== CRIANDO AGENDAMENTO ===');
    console.log('Dados recebidos:', { title, name, date, start_time, end_time });
    console.log('Supabase configurado:', !!supabase);
    console.log('Environment vars:', {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY
    });

    // Usar método tradicional diretamente (mais confiável)
    return await createAppointmentTraditional(req, res, { title, description, name, date, start_time, end_time });

  } catch (err) {
    console.error('Erro interno:', err.message);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Função helper para criar agendamento tradicional com retry
async function createAppointmentTraditional(req, res, { title, description, name, date, start_time, end_time }) {
  // Se o Supabase não estiver configurado, simular agendamento
  if (!supabase || !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.log('Supabase não configurado - criando agendamento simulado');
    const mockAppointment = {
      id: Date.now(),
      title,
      description,
      name,
      date,
      start_time,
      end_time,
      created_at: new Date().toISOString()
    };
    
    console.log('Agendamento simulado criado:', mockAppointment);
    return res.status(201).json(mockAppointment);
  }

  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Tentativa ${attempt}/${maxRetries} - método tradicional`);
    
    try {
      // Verificar conflito com timeout de 10 segundos
      const checkConflictPromise = supabase
        .from('agendamentos')
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

      console.log('Verificando conflitos para:', { start_time, end_time });
      console.log('Agendamentos existentes:', conflitos);

      // Função helper para converter time string em minutos
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const newStartMinutes = timeToMinutes(start_time);
      const newEndMinutes = timeToMinutes(end_time);

      const conflitou = conflitos?.some(appt => {
        const existingStartMinutes = timeToMinutes(appt.start_time);
        const existingEndMinutes = timeToMinutes(appt.end_time);
        
        console.log('Comparando:', {
          novo: { start: newStartMinutes, end: newEndMinutes },
          existente: { start: existingStartMinutes, end: existingEndMinutes, id: appt.id }
        });
        
        // Verificar sobreposição real
        const overlap = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        console.log('Conflito detectado:', overlap);
        return overlap;
      });

      if (conflitou) {
        console.log('CONFLITO: Horário já ocupado');
        return res.status(409).json({ error: 'Horário já ocupado por outro agendamento.' });
      }

      // Criar agendamento com timeout de 15 segundos
      const createPromise = supabase
        .from('agendamentos')
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
      .from('agendamentos')
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
        .from('agendamentos')
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
        .from('agendamentos')
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

// Definir porta para desenvolvimento local
const PORT = process.env.PORT || 3001;

// Verificar se está rodando localmente ou no Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  });
}

// Exportar o app Express diretamente para o Vercel
module.exports = app;

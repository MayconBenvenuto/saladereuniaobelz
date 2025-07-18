// API otimizada funcional para sistema de agendamentos
const { createClient } = require('@supabase/supabase-js');

// Cache simples em memória para reduzir consultas desnecessárias
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para cache com TTL
function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Limpar cache antigo periodicamente
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        cache.delete(k);
      }
    }
  }
}

// Inicialização do Supabase
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { 'x-application-name': 'agendamentos-belz' } }
    });
  }
} catch (error) {
  console.log('⚠️ Supabase não inicializado:', error.message);
}

// Função para validar formato de data
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  const timestamp = date.getTime();
  
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false;
  return date.toISOString().startsWith(dateString);
}

// Função para validar formato de horário (aceita HH:MM ou HH:MM:SS)
function isValidTime(timeString) {
  const regexWithSeconds = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  const regexWithoutSeconds = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regexWithSeconds.test(timeString) || regexWithoutSeconds.test(timeString);
}

// Função para normalizar horário para HH:MM:SS
function normalizeTime(timeString) {
  if (!timeString) return timeString;
  
  // Se já tem segundos, retorna como está
  if (timeString.includes(':') && timeString.split(':').length === 3) {
    return timeString;
  }
  
  // Se só tem HH:MM, adiciona :00
  if (timeString.includes(':') && timeString.split(':').length === 2) {
    return timeString + ':00';
  }
  
  return timeString;
}

// Função para comprimir resposta se necessário
function setResponseHeaders(res, cacheable = false) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  if (cacheable) {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutos
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}

module.exports = async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🚀 [${new Date().toISOString()}] [${requestId}] ${req.method} ${req.url}`);
  
  // Configurar headers de resposta
  setResponseHeaders(res);
  
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
    
    // Routing com logs de performance
    if (path === '/api/ping' || path === '/ping') {
      setResponseHeaders(res, true);
      const duration = Date.now() - startTime;
      res.status(200).json({
        status: 'pong',
        timestamp: new Date().toISOString(),
        duration,
        requestId,
        message: 'API otimizada funcionando!'
      });
      console.log(`✅ [${requestId}] Ping responded in ${duration}ms`);
      return;
    }
    
    if (path === '/api/health' || path === '/health') {
      const duration = Date.now() - startTime;
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        duration,
        requestId,
        supabase: !!supabase,
        environment: process.env.NODE_ENV || 'production',
        cache: {
          size: cache.size,
          maxSize: 100
        }
      });
      console.log(`✅ [${requestId}] Health check responded in ${duration}ms`);
      return;
    }
    
    // Appointments endpoint com cache
    if (path === '/api/appointments' && req.method === 'GET') {
      const { date } = query;
      
      if (!date) {
        res.status(400).json({ 
          error: 'Parâmetro date é obrigatório',
          requestId,
          example: '?date=2025-07-18'
        });
        return;
      }
      
      // Validar formato da data
      if (!isValidDate(date)) {
        res.status(400).json({ 
          error: 'Formato de data inválido. Use YYYY-MM-DD',
          requestId,
          received: date
        });
        return;
      }
      
      // Verificar cache primeiro
      const cacheKey = `appointments:${date}`;
      const cached = getCached(cacheKey);
      
      if (cached) {
        const duration = Date.now() - startTime;
        setResponseHeaders(res, true);
        res.status(200).json(cached);
        console.log(`⚡ [${requestId}] Appointments (cached): ${cached.length} found in ${duration}ms`);
        return;
      }
      
      if (!supabase) {
        const emptyResult = [];
        setCache(cacheKey, emptyResult);
        res.status(200).json(emptyResult);
        return;
      }
      
      const { data, error } = await Promise.race([
        supabase
          .from('agendamentos')
          .select('*')
          .eq('date', date)
          .order('start_time', { ascending: true }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 12000) // Reduzido para 12s
        )
      ]);
      
      if (error) {
        console.error(`❌ [${requestId}] Database error:`, error.message);
        res.status(500).json({ 
          error: 'Erro ao consultar agendamentos',
          requestId,
          details: error.message 
        });
        return;
      }
      
      const result = data || [];
      const duration = Date.now() - startTime;
      
      // Armazenar no cache
      setCache(cacheKey, result);
      setResponseHeaders(res, true);
      
      res.status(200).json(result);
      console.log(`✅ [${requestId}] Appointments: ${result.length} found in ${duration}ms`);
      return;
    }
    
    // Create appointment endpoint com validação melhorada
    if (path === '/api/appointments' && req.method === 'POST') {
      if (!supabase) {
        res.status(500).json({ 
          error: 'Banco de dados não disponível',
          requestId 
        });
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
          console.log(`📝 [${requestId}] Criando agendamento:`, {
            name: appointmentData.name,
            date: appointmentData.date,
            start_time: appointmentData.start_time,
            end_time: appointmentData.end_time
          });
          
          // Validar dados obrigatórios
          const { name, title, date, start_time, end_time } = appointmentData;
          
          if (!name || !title || !date || !start_time || !end_time) {
            res.status(400).json({ 
              error: 'Dados obrigatórios: name, title, date, start_time, end_time',
              requestId,
              received: { name: !!name, title: !!title, date: !!date, start_time: !!start_time, end_time: !!end_time }
            });
            return;
          }
          
          // Normalizar horários para formato HH:MM:SS
          const normalizedStartTime = normalizeTime(start_time);
          const normalizedEndTime = normalizeTime(end_time);
          
          // Validações de formato
          if (!isValidDate(date)) {
            res.status(400).json({ 
              error: 'Formato de data inválido. Use YYYY-MM-DD',
              requestId,
              received: date
            });
            return;
          }
          
          if (!isValidTime(normalizedStartTime) || !isValidTime(normalizedEndTime)) {
            res.status(400).json({ 
              error: 'Formato de horário inválido. Use HH:MM ou HH:MM:SS',
              requestId,
              received: { start_time: normalizedStartTime, end_time: normalizedEndTime }
            });
            return;
          }
          
          // Validar se horário de fim é após horário de início
          if (normalizedStartTime >= normalizedEndTime) {
            res.status(400).json({ 
              error: 'Horário de fim deve ser posterior ao horário de início',
              requestId,
              received: { start_time: normalizedStartTime, end_time: normalizedEndTime }
            });
            return;
          }
          
          // Atualizar os dados com horários normalizados
          const normalizedAppointmentData = {
            ...appointmentData,
            start_time: normalizedStartTime,
            end_time: normalizedEndTime
          };
          
          // Verificar conflitos antes de inserir
          const { data: conflicts } = await Promise.race([
            supabase
              .from('agendamentos')
              .select('id, name, start_time, end_time')
              .eq('date', date)
              .or(`and(start_time.lte.${normalizedStartTime},end_time.gt.${normalizedStartTime}),and(start_time.lt.${normalizedEndTime},end_time.gte.${normalizedEndTime}),and(start_time.gte.${normalizedStartTime},end_time.lte.${normalizedEndTime})`),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 12000)
            )
          ]);
          
          if (conflicts && conflicts.length > 0) {
            console.log(`❌ [${requestId}] Conflito encontrado:`, conflicts[0]);
            res.status(409).json({ 
              error: 'Horário já ocupado',
              requestId,
              conflict: conflicts[0]
            });
            return;
          }
          
          // Inserir o agendamento
          const { data, error } = await Promise.race([
            supabase
              .from('agendamentos')
              .insert([normalizedAppointmentData])
              .select(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 12000)
            )
          ]);
          
          if (error) {
            console.error(`❌ [${requestId}] Erro ao inserir:`, error);
            res.status(500).json({ 
              error: 'Erro ao criar agendamento',
              requestId,
              details: error.message 
            });
            return;
          }
          
          const duration = Date.now() - startTime;
          const created = data[0];
          
          // Invalidar cache para esta data
          cache.delete(`appointments:${date}`);
          cache.delete(`availability:${date}`);
          
          console.log(`✅ [${requestId}] Agendamento criado em ${duration}ms: ID ${created.id}`);
          res.status(201).json({
            message: 'Agendamento criado com sucesso',
            appointment: created,
            requestId,
            duration
          });
          
        } catch (parseError) {
          console.error(`❌ [${requestId}] Erro ao processar dados:`, parseError);
          res.status(400).json({ 
            error: 'Dados JSON inválidos',
            requestId,
            details: parseError.message 
          });
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

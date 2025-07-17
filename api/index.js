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
app.use(cors()); // Permite requisições de origens diferentes
app.use(bodyParser.json()); // Habilita o parsing de JSON no corpo das requisições

// **AQUI ESTÁ A CORREÇÃO CRÍTICA:** Inicialização do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Verifica se as variáveis de ambiente do Supabase estão definidas
if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: As variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não estão definidas.');
  console.error('Certifique-se de ter um arquivo .env na raiz do seu projeto com essas variáveis.');
  // Termina o processo se as variáveis críticas não estiverem presentes
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  
  if (!date) {
    return res.status(400).json({ error: 'Parâmetro de data (date) é obrigatório.' });
  }
  
  try {
    console.log('Data recebida para availability:', date);
    
    // Buscar agendamentos do dia
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .order('start_time', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar agendamentos:', error.message);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('Agendamentos encontrados:', appointments);
    
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
    res.json(slots);
    
  } catch (err) {
    console.error('Erro interno ao gerar disponibilidade:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Criar agendamento
app.post('/api/appointments', async (req, res) => {
  const { title, description, name, date, start_time, end_time } = req.body;

  if (!title || !name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando: title, name, date, start_time, end_time.' });
  }

  console.log(`Verificando conflitos para data: ${date}, início: ${start_time}, fim: ${end_time}`);
  
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
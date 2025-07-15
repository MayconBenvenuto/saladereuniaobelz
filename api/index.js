// Importações essenciais
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
// Importa e carrega as variáveis de ambiente de um arquivo .env
require('dotenv').config();

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

// Buscar agendamentos por data
app.get('/api/appointments', async (req, res) => {
  const { date } = req.query;

  // Validação do parâmetro de entrada
  if (!date) {
    return res.status(400).json({ error: 'Parâmetro de data (date) é obrigatório.' });
  }

  console.log('Buscando agendamentos para a data:', date);

  // **CORREÇÃO DE SINTAXE:** O .order deve ser encadeado diretamente.
  // console.log() deve ser uma instrução separada.
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('date', date)
    .order('start_time', { ascending: true }); // Encadenamento correto

  if (error) {
    console.error('Erro ao buscar agendamentos:', error.message); // Log mais detalhado do erro
    return res.status(500).json({ error: error.message });
  }

  console.log('Agendamentos encontrados:', data);
  res.json(data);
});

// Criar agendamento
app.post('/api/appointments', async (req, res) => {
  const { title, description, name, date, start_time, end_time } = req.body;

  if (!title || !name || !date || !start_time || !end_time) {
    // Retorno de erro mais específico sobre os campos ausentes
    return res.status(400).json({ error: 'Campos obrigatórios faltando: title, name, date, start_time, end_time.' });
  }

  console.log(`Verificando conflitos para data: ${date}, início: ${start_time}, fim: ${end_time}`);
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
    // Esta lógica de conflito assume que start_time e end_time são strings comparáveis (ex: "HH:MM")
    // ou que o banco de dados Supabase está retornando-os de forma que a comparação direta funcione.
    // Se você estiver usando tipos de hora diferentes, pode ser necessário converter para Date objects.
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
    .select(); // O .select() é importante para retornar os dados do registro inserido

  if (error) {
    console.error('Erro ao criar agendamento:', error.message);
    return res.status(500).json({ error: error.message });
  }

  console.log('Agendamento criado com sucesso:', created[0]);
  res.status(201).json(created[0]);
});

// Deletar agendamento
app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID do agendamento é obrigatório para exclusão.' });
  }

  console.log('Deletando agendamento com ID:', id);
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id); // Certifique-se que 'id' é o nome da sua coluna de chave primária na tabela 'appointments'

  if (error) {
    console.error('Erro ao deletar agendamento:', error.message);
    return res.status(500).json({ error: error.message });
  }

  console.log('Agendamento removido com sucesso, ID:', id);
  res.json({ message: 'Agendamento removido com sucesso.' });
});

// Define a porta em que o servidor irá escutar
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

// Exporta o app para que possa ser importado em outros arquivos (se necessário)
module.exports = app;
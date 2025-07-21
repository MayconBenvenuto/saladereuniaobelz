// api-test.js
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_DATE = new Date().toISOString().split('T')[0]; // Use a data de hoje para o teste

let createdAppointmentId = null;

async function runTest(name, testFn) {
  console.log(`\n--- INICIANDO TESTE: ${name} ---`);
  try {
    await testFn();
    console.log(`✅ SUCESSO: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ FALHA: ${name}`);
    console.error('Detalhes do erro:', error.message);
    return false;
  }
}

// Teste 1: Verificar o endpoint de saúde da API
async function testHealthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`Status code: ${response.status}`);
  const data = await response.json();
  if (data.status !== 'ok' || !data.supabase) {
    throw new Error(`Resposta inesperada do health check: ${JSON.stringify(data)}`);
  }
  console.log('Saúde da API verificada:', data);
}

// Teste 2: Buscar agendamentos para a data de hoje
async function testGetAppointments() {
  const response = await fetch(`${API_BASE_URL}/appointments?date=${TEST_DATE}`);
  if (!response.ok) throw new Error(`Status code: ${response.status}`);
  const data = await response.json();
  console.log(`Encontrados ${data.length} agendamentos para ${TEST_DATE}.`);
}

// Teste 3: Criar um novo agendamento
async function testCreateAppointment() {
  const newAppointment = {
    title: 'Reunião de Teste Automatizado',
    name: 'Script de Teste',
    description: 'Este é um agendamento criado pelo script de teste.',
    date: TEST_DATE,
    start_time: '19:00:00',
    end_time: '19:30:00',
  };

  const response = await fetch(`${API_BASE_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newAppointment),
  });

  if (!response.ok || response.status !== 201) {
    const errorBody = await response.text();
    throw new Error(`Status code: ${response.status}. Body: ${errorBody}`);
  }
  const data = await response.json();
  if (!data.id) {
    throw new Error(`Agendamento criado não retornou um ID. Resposta: ${JSON.stringify(data)}`);
  }
  createdAppointmentId = data.id;
  console.log('Agendamento de teste criado com sucesso. ID:', createdAppointmentId);
}

// Teste 4: Deletar o agendamento criado
async function testDeleteAppointment() {
  if (!createdAppointmentId) {
    throw new Error('Nenhum ID de agendamento para deletar. O teste de criação pode ter falhado.');
  }
  const response = await fetch(`${API_BASE_URL}/appointments/${createdAppointmentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
     const errorBody = await response.text();
    throw new Error(`Status code: ${response.status}. Body: ${errorBody}`);
  }
  const data = await response.json();
   if (!data.message.includes('sucesso')) {
    throw new Error(`Mensagem de exclusão inesperada: ${data.message}`);
  }
  console.log('Agendamento de teste deletado com sucesso.');
}


// Executar todos os testes em sequência
async function runAllTests() {
  console.log('🚀 INICIANDO BATERIA DE TESTES DA API 🚀');
  
  const results = [];
  results.push(await runTest('Health Check', testHealthCheck));
  results.push(await runTest('Buscar Agendamentos', testGetAppointments));
  results.push(await runTest('Criar Agendamento', testCreateAppointment));
  results.push(await runTest('Deletar Agendamento', testDeleteAppointment));

  console.log('\n--- RESULTADO FINAL ---');
  const successCount = results.filter(Boolean).length;
  const totalCount = results.length;

  if (successCount === totalCount) {
    console.log(`✅ Todos os ${totalCount} testes passaram com sucesso! A API está 100% operacional.`);
  } else {
    console.error(`❌ ${totalCount - successCount} de ${totalCount} testes falharam.`);
    process.exit(1); // Termina com erro se algum teste falhar
  }
  
  // Parar o servidor que está rodando em background
  process.exit(0);
}

// Adiciona um delay para garantir que o servidor tenha tempo de iniciar
setTimeout(runAllTests, 2000);

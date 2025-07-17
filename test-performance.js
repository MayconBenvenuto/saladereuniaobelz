const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';

async function testPerformance() {
  console.log('🔍 Testando performance da API...\n');
  
  // Teste 1: Rota básica de teste
  console.log('1. Testando rota de teste...');
  const start1 = Date.now();
  try {
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      timeout: 5000
    });
    const data = await response.json();
    const time1 = Date.now() - start1;
    console.log(`✅ Rota de teste: ${time1}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Supabase configurado: ${data.supabase_configured}\n`);
  } catch (error) {
    console.log(`❌ Erro na rota de teste: ${error.message}\n`);
  }
  
  // Teste 2: Carregamento de disponibilidade
  console.log('2. Testando disponibilidade...');
  const start2 = Date.now();
  const today = new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`${API_BASE_URL}/api/availability/${today}`, {
      timeout: 10000
    });
    const data = await response.json();
    const time2 = Date.now() - start2;
    console.log(`✅ Disponibilidade: ${time2}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Slots retornados: ${Array.isArray(data) ? data.length : 'formato inválido'}\n`);
  } catch (error) {
    console.log(`❌ Erro na disponibilidade: ${error.message}\n`);
  }
  
  // Teste 3: Criar agendamento de teste
  console.log('3. Testando criação de agendamento...');
  const start3 = Date.now();
  const testBooking = {
    name: 'Teste Performance',
    title: 'Reunião de Teste',
    date: today,
    start_time: '14:00',
    end_time: '14:30',
    description: 'Teste automatizado'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBooking),
      timeout: 15000
    });
    
    const time3 = Date.now() - start3;
    console.log(`✅ Criação de agendamento: ${time3}ms`);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ID criado: ${data.id}\n`);
      
      // Limpar o agendamento de teste
      if (data.id) {
        try {
          await fetch(`${API_BASE_URL}/api/appointments/${data.id}`, {
            method: 'DELETE',
            timeout: 5000
          });
          console.log('🧹 Agendamento de teste removido\n');
        } catch (deleteError) {
          console.log('⚠️  Não foi possível remover o agendamento de teste\n');
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`   Erro: ${errorText}\n`);
    }
  } catch (error) {
    console.log(`❌ Erro na criação: ${error.message}\n`);
  }
  
  console.log('📊 Resumo dos tempos ideais:');
  console.log('   Rota de teste: < 1000ms');
  console.log('   Disponibilidade: < 3000ms');
  console.log('   Criação: < 5000ms');
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/`, { timeout: 3000 });
    if (response.ok) {
      console.log('✅ Servidor está rodando\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Servidor não está rodando ou não responde');
    console.log('   Execute: cd api && node index.js\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Teste de Performance - Sistema de Agendamentos\n');
  
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testPerformance();
  }
}

main().catch(console.error);

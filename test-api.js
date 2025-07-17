// Script para testar a API localmente e em produção
const fetch = require('node-fetch');

async function testAPI(baseUrl) {
  console.log(`\n=== TESTANDO API: ${baseUrl} ===`);
  
  try {
    // Teste 1: Verificar se a API está funcionando
    console.log('\n1. Testando rota de teste...');
    const testResponse = await fetch(`${baseUrl}/api/test`);
    const testData = await testResponse.json();
    console.log('Status:', testResponse.status);
    console.log('Resposta:', testData);
    
    // Teste 2: Verificar disponibilidade de horários
    console.log('\n2. Testando disponibilidade de horários...');
    const today = new Date().toISOString().split('T')[0];
    const availabilityResponse = await fetch(`${baseUrl}/api/availability/${today}`);
    const availabilityData = await availabilityResponse.json();
    console.log('Status:', availabilityResponse.status);
    console.log('Quantidade de slots:', Array.isArray(availabilityData) ? availabilityData.length : 'Não é array');
    console.log('Primeiro slot:', Array.isArray(availabilityData) ? availabilityData[0] : 'N/A');
    
  } catch (error) {
    console.error('Erro ao testar API:', error.message);
  }
}

async function runTests() {
  // Teste local
  await testAPI('http://localhost:3001');
  
  // Teste em produção (substitua pela URL do seu site)
  // await testAPI('https://your-vercel-url.vercel.app');
}

runTests();

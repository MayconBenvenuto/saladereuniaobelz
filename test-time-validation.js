// Teste rápido para validação de horários
const fetch = require('node-fetch');

async function testTimeValidation() {
  console.log('🧪 Testando validação de horários...\n');
  
  const baseUrl = 'http://localhost:3000'; // Teste local primeiro
  
  // Teste 1: Formato HH:MM (como vem do frontend)
  const testData1 = {
    name: 'Teste Usuario',
    title: 'Reunião Teste',
    participants: 'teste@email.com',
    date: '2025-07-18',
    start_time: '08:00',     // Formato sem segundos
    end_time: '09:00'        // Formato sem segundos
  };
  
  // Teste 2: Formato HH:MM:SS (formato completo)
  const testData2 = {
    name: 'Teste Usuario 2',
    title: 'Reunião Teste 2',
    participants: 'teste2@email.com',
    date: '2025-07-18',
    start_time: '10:00:00',  // Formato com segundos
    end_time: '11:00:00'     // Formato com segundos
  };
  
  // Teste 3: Formato inválido
  const testData3 = {
    name: 'Teste Usuario 3',
    title: 'Reunião Teste 3',
    participants: 'teste3@email.com',
    date: '2025-07-18',
    start_time: '25:00',     // Hora inválida
    end_time: '26:00'        // Hora inválida
  };
  
  const tests = [
    { name: 'HH:MM', data: testData1, shouldPass: true },
    { name: 'HH:MM:SS', data: testData2, shouldPass: true },
    { name: 'Formato inválido', data: testData3, shouldPass: false }
  ];
  
  for (const test of tests) {
    console.log(`📝 Teste: ${test.name}`);
    console.log(`   Dados: start_time="${test.data.start_time}", end_time="${test.data.end_time}"`);
    
    try {
      const response = await fetch(`${baseUrl}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.data)
      });
      
      const result = await response.json();
      
      if (test.shouldPass) {
        if (response.ok) {
          console.log(`   ✅ PASSOU: ${result.message || 'Sucesso'}`);
        } else {
          console.log(`   ❌ FALHOU: ${result.error} (esperava sucesso)`);
        }
      } else {
        if (!response.ok) {
          console.log(`   ✅ PASSOU: ${result.error} (erro esperado)`);
        } else {
          console.log(`   ❌ FALHOU: Deveria ter dado erro`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
    }
    
    console.log('');
  }
}

// Função para testar normalização de horários
function testTimeNormalization() {
  console.log('🔧 Testando normalização de horários...\n');
  
  // Simular as funções da API
  function normalizeTime(timeString) {
    if (!timeString) return timeString;
    
    if (timeString.includes(':') && timeString.split(':').length === 3) {
      return timeString;
    }
    
    if (timeString.includes(':') && timeString.split(':').length === 2) {
      return timeString + ':00';
    }
    
    return timeString;
  }
  
  function isValidTime(timeString) {
    const regexWithSeconds = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    const regexWithoutSeconds = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regexWithSeconds.test(timeString) || regexWithoutSeconds.test(timeString);
  }
  
  const testCases = [
    '08:00',      // Deve virar 08:00:00
    '08:00:00',   // Deve ficar 08:00:00
    '23:59',      // Deve virar 23:59:00
    '25:00',      // Inválido
    '08:60',      // Inválido
    '',           // Vazio
    null          // Null
  ];
  
  testCases.forEach(time => {
    const normalized = normalizeTime(time);
    const isValid = isValidTime(normalized);
    
    console.log(`Input: "${time}" → Normalizado: "${normalized}" → Válido: ${isValid}`);
  });
  
  console.log('');
}

// Executar os testes
if (require.main === module) {
  testTimeNormalization();
  testTimeValidation(); // Testar com API rodando
}

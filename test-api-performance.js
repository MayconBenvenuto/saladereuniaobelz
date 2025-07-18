// Arquivo: test-api-performance.js
// Script para testar a performance da API após otimizações

const API_BASE_URL = 'https://saladereuniaobelz.vercel.app';

async function testApiPerformance() {
  console.log('🧪 Testando performance da API...');
  console.log('=' .repeat(50));
  
  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE_URL}/api/health`,
      timeout: 5000
    },
    {
      name: 'Ping',
      url: `${API_BASE_URL}/api/ping`,
      timeout: 5000
    },
    {
      name: 'Appointments (today)',
      url: `${API_BASE_URL}/api/appointments?date=${new Date().toISOString().split('T')[0]}`,
      timeout: 20000
    },
    {
      name: 'Availability (today)',
      url: `${API_BASE_URL}/api/availability/${new Date().toISOString().split('T')[0]}`,
      timeout: 20000
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n⏱️  Testando: ${test.name}`);
      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), test.timeout);
      
      const response = await fetch(test.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: ${response.status} (${duration}ms)`);
        
        if (test.name.includes('Appointments') || test.name.includes('Availability')) {
          const count = Array.isArray(data) ? data.length : (data.occupied ? data.occupied.length : 0);
          console.log(`   📊 Registros retornados: ${count}`);
        }
      } else {
        console.log(`❌ ${test.name}: ${response.status} - ${response.statusText} (${duration}ms)`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ ${test.name}: TIMEOUT após ${test.timeout}ms`);
      } else {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Teste de performance concluído!');
}

// Executar os testes
testApiPerformance().catch(console.error);

/* 
COMO USAR ESTE SCRIPT:

1. Execute: node test-api-performance.js
2. Observe os tempos de resposta de cada endpoint
3. Verifique se algum endpoint está dando timeout
4. Tempos ideais:
   - Health Check: < 2 segundos
   - Ping: < 1 segundo  
   - Appointments: < 10 segundos
   - Availability: < 10 segundos

Se os tempos estiverem muito altos, pode ser necessário:
- Executar o script optimize-database.sql no Supabase
- Verificar se as variáveis de ambiente estão configuradas
- Considerar um plano pago da Vercel para funções mais rápidas
*/

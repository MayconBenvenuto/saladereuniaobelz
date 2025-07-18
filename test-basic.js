// Script simplificado para testar apenas os endpoints básicos
const API_BASE_URL = 'https://saladereuniaobelz.vercel.app';

async function testBasicEndpoints() {
  console.log('🧪 Teste básico da API...');
  console.log('=' .repeat(40));
  
  const tests = [
    {
      name: 'Test Direct',
      url: `${API_BASE_URL}/api/test-direct`,
      timeout: 10000
    },
    {
      name: 'Ping',
      url: `${API_BASE_URL}/api/ping`,
      timeout: 10000
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n⏱️  ${test.name}...`);
      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), test.timeout);
      
      const response = await fetch(test.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: ${response.status} (${duration}ms)`);
        console.log(`📋 Resposta:`, JSON.stringify(data, null, 2));
      } else {
        console.log(`❌ ${test.name}: ${response.status} (${duration}ms)`);
        const text = await response.text();
        console.log(`📋 Erro:`, text.substring(0, 200));
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ ${test.name}: TIMEOUT`);
      } else {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(40));
}

testBasicEndpoints().catch(console.error);

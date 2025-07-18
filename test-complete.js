// Teste completo da API otimizada
const API_BASE_URL = 'https://saladereuniaobelz.vercel.app';

async function testCompleteApi() {
  console.log('🧪 Teste completo da API otimizada...');
  console.log('=' .repeat(50));
  
  const today = new Date().toISOString().split('T')[0];
  
  const tests = [
    {
      name: 'Ping',
      url: `${API_BASE_URL}/api/ping`,
      timeout: 10000
    },
    {
      name: 'Health Check',
      url: `${API_BASE_URL}/api/health`,
      timeout: 10000
    },
    {
      name: 'Appointments (hoje)',
      url: `${API_BASE_URL}/api/appointments?date=${today}`,
      timeout: 20000
    },
    {
      name: 'Availability (hoje)',
      url: `${API_BASE_URL}/api/availability/${today}`,
      timeout: 20000
    }
  ];
  
  let totalSuccessful = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n⏱️  Testando: ${test.name}...`);
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
        
        // Mostrar informações específicas por endpoint
        if (test.name.includes('Appointments')) {
          console.log(`   📊 Agendamentos: ${Array.isArray(data) ? data.length : 0}`);
        } else if (test.name.includes('Availability')) {
          console.log(`   📊 Slots ocupados: ${data.occupied ? data.occupied.length : 0}`);
          console.log(`   ⏰ Horário: ${data.slots_config?.start_hour}h-${data.slots_config?.end_hour}h`);
        } else if (test.name.includes('Health')) {
          console.log(`   🔗 Supabase: ${data.supabase ? '✅' : '❌'}`);
          console.log(`   🌍 Environment: ${data.environment}`);
        }
        
        totalSuccessful++;
      } else {
        console.log(`❌ ${test.name}: ${response.status} - ${response.statusText} (${duration}ms)`);
        const text = await response.text();
        console.log(`   📋 Erro: ${text.substring(0, 200)}`);
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
  console.log(`🏁 Teste concluído: ${totalSuccessful}/${tests.length} endpoints funcionando`);
  
  if (totalSuccessful === tests.length) {
    console.log('🎉 TODOS OS ENDPOINTS ESTÃO FUNCIONANDO PERFEITAMENTE!');
    console.log('✨ Os problemas de timeout foram resolvidos!');
  } else if (totalSuccessful > 0) {
    console.log('⚠️  Alguns endpoints funcionando, outros precisam de ajuste');
  } else {
    console.log('❌ Nenhum endpoint funcionando - verificar configuração');
  }
}

testCompleteApi().catch(console.error);

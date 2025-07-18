// Teste completo das otimizações implementadas
const API_BASE_URL = 'https://saladereuniaobelz.vercel.app';

async function testOptimizations() {
  console.log('🚀 Teste completo das otimizações...');
  console.log('=' .repeat(60));
  
  const today = new Date().toISOString().split('T')[0];
  const results = {
    performance: [],
    cache: [],
    errors: []
  };
  
  // Teste 1: Performance básica
  console.log('\n📊 1. TESTE DE PERFORMANCE BÁSICA');
  console.log('-' .repeat(40));
  
  const basicTests = [
    { name: 'Ping', endpoint: '/api/ping' },
    { name: 'Health', endpoint: '/api/health' },
    { name: 'Appointments', endpoint: `/api/appointments?date=${today}` },
    { name: 'Availability', endpoint: `/api/availability/${today}` }
  ];
  
  for (const test of basicTests) {
    try {
      const start = Date.now();
      const response = await fetch(`${API_BASE_URL}${test.endpoint}`);
      const duration = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        results.performance.push({ name: test.name, duration, status: 'ok' });
        console.log(`✅ ${test.name}: ${duration}ms`);
        
        // Verificar se tem requestId (nova funcionalidade)
        if (data.requestId) {
          console.log(`   🔗 Request ID: ${data.requestId}`);
        }
      } else {
        results.performance.push({ name: test.name, duration, status: 'error' });
        console.log(`❌ ${test.name}: ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      results.errors.push({ test: test.name, error: error.message });
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  // Teste 2: Cache (duas requisições iguais)
  console.log('\n🗄️ 2. TESTE DE CACHE');
  console.log('-' .repeat(40));
  
  try {
    console.log('Primeira requisição (sem cache)...');
    const start1 = Date.now();
    const response1 = await fetch(`${API_BASE_URL}/api/appointments?date=${today}`);
    const duration1 = Date.now() - start1;
    const data1 = await response1.json();
    
    console.log('Segunda requisição (com cache)...');
    const start2 = Date.now();
    const response2 = await fetch(`${API_BASE_URL}/api/appointments?date=${today}`);
    const duration2 = Date.now() - start2;
    const data2 = await response2.json();
    
    results.cache.push({ first: duration1, second: duration2 });
    
    console.log(`✅ Primeira: ${duration1}ms`);
    console.log(`✅ Segunda: ${duration2}ms`);
    
    if (duration2 < duration1 * 0.8) {
      console.log(`🚀 Cache funcionando! Melhoria de ${Math.round((1 - duration2/duration1) * 100)}%`);
    } else {
      console.log(`⚠️ Cache pode não estar funcionando como esperado`);
    }
  } catch (error) {
    console.log(`❌ Erro no teste de cache: ${error.message}`);
  }
  
  // Teste 3: Validação de dados
  console.log('\n🔍 3. TESTE DE VALIDAÇÃO');
  console.log('-' .repeat(40));
  
  const validationTests = [
    {
      name: 'Data inválida',
      endpoint: '/api/appointments?date=invalid-date',
      expectedStatus: 400
    },
    {
      name: 'Data sem parâmetro',
      endpoint: '/api/appointments',
      expectedStatus: 400
    }
  ];
  
  for (const test of validationTests) {
    try {
      const response = await fetch(`${API_BASE_URL}${test.endpoint}`);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: Validação funcionando (${response.status})`);
      } else {
        console.log(`⚠️ ${test.name}: Status inesperado ${response.status}, esperado ${test.expectedStatus}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  // Teste 4: Criação com validação
  console.log('\n📝 4. TESTE DE CRIAÇÃO COM VALIDAÇÃO');
  console.log('-' .repeat(40));
  
  // Teste com dados inválidos
  try {
    const invalidData = {
      name: 'Teste',
      title: 'Reunião',
      date: 'invalid-date',
      start_time: '25:00:00', // Hora inválida
      end_time: '26:00:00'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });
    
    if (response.status === 400) {
      const error = await response.json();
      console.log('✅ Validação de dados inválidos funcionando');
      console.log(`   📋 Erro retornado: ${error.error}`);
    } else {
      console.log(`⚠️ Validação pode não estar funcionando: status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro no teste de validação: ${error.message}`);
  }
  
  // Resumo dos resultados
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMO DOS RESULTADOS');
  console.log('=' .repeat(60));
  
  const avgPerformance = results.performance.reduce((acc, test) => acc + test.duration, 0) / results.performance.length;
  console.log(`⚡ Performance média: ${Math.round(avgPerformance)}ms`);
  
  const successfulTests = results.performance.filter(test => test.status === 'ok').length;
  console.log(`✅ Testes bem-sucedidos: ${successfulTests}/${results.performance.length}`);
  
  if (results.cache.length > 0) {
    const cacheImprovement = (1 - results.cache[0].second / results.cache[0].first) * 100;
    console.log(`🗄️ Melhoria do cache: ${Math.round(cacheImprovement)}%`);
  }
  
  if (results.errors.length > 0) {
    console.log(`❌ Erros encontrados: ${results.errors.length}`);
    results.errors.forEach(error => {
      console.log(`   - ${error.test}: ${error.error}`);
    });
  }
  
  if (avgPerformance < 2000 && successfulTests === results.performance.length) {
    console.log('\n🎉 TODAS AS OTIMIZAÇÕES FUNCIONANDO PERFEITAMENTE!');
  } else {
    console.log('\n⚠️ Algumas otimizações precisam de ajustes');
  }
}

testOptimizations().catch(console.error);

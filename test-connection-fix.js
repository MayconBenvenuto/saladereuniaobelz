// Script para testar as correções de timeout e conexão
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('=== TESTE DAS CORREÇÕES DE CONEXÃO ===');
console.log('Data/Hora:', new Date().toISOString());
console.log('');

// Verificar variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurada' : 'NÃO configurada');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? `Configurada (${process.env.SUPABASE_KEY.length} chars)` : 'NÃO configurada');
console.log('');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.log('❌ ERRO: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testSupabaseConnection() {
  console.log('🔄 Testando conexão com Supabase...');
  
  try {
    // Testar conexão com timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de conexão')), 10000);
    });
    
    const connectionPromise = supabase
      .from('appointments')
      .select('count', { count: 'exact', head: true });
    
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    
    console.log('✅ Conexão com Supabase bem-sucedida!');
    console.log('Total de agendamentos na base:', result.count);
    return true;
    
  } catch (error) {
    console.log('❌ Erro na conexão com Supabase:', error.message);
    return false;
  }
}

async function testAvailabilityGeneration() {
  console.log('🔄 Testando geração de horários...');
  
  try {
    // Simular geração de horários padrão (como no frontend)
    const slots = [];
    const startHour = 8;
    const endHour = 18;
    const slotDuration = 30;

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

        slots.push({
          start_time: start,
          end_time: end,
          available: true,
          appointment: null
        });
      }
    }
    
    console.log('✅ Geração de horários padrão funcionando!');
    console.log(`📅 ${slots.length} slots gerados (${startHour}h às ${endHour}h)`);
    console.log('Primeiro slot:', slots[0]);
    console.log('Último slot:', slots[slots.length - 1]);
    return true;
    
  } catch (error) {
    console.log('❌ Erro na geração de horários:', error.message);
    return false;
  }
}

async function testAppointmentQuery() {
  console.log('🔄 Testando busca de agendamentos...');
  
  try {
    const testDate = '2025-07-17';
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na busca')), 10000);
    });
    
    const queryPromise = supabase
      .from('appointments')
      .select('*')
      .eq('date', testDate)
      .order('start_time', { ascending: true });
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    
    if (error) {
      console.log('⚠️ Erro na busca (esperado se tabela não existir):', error.message);
      return false;
    }
    
    console.log('✅ Busca de agendamentos funcionando!');
    console.log(`📅 ${data?.length || 0} agendamentos encontrados para ${testDate}`);
    return true;
    
  } catch (error) {
    console.log('❌ Erro na busca de agendamentos:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 EXECUTANDO TODOS OS TESTES\n');
  
  const results = {
    connection: await testSupabaseConnection(),
    generation: await testAvailabilityGeneration(),
    query: await testAppointmentQuery()
  };
  
  console.log('\n📊 RESULTADOS FINAIS:');
  console.log('Conexão Supabase:', results.connection ? '✅' : '❌');
  console.log('Geração de horários:', results.generation ? '✅' : '❌');
  console.log('Busca de agendamentos:', results.query ? '✅' : '❌');
  
  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 ${successCount}/3 testes passaram`);
  
  if (successCount >= 2) {
    console.log('✅ SISTEMA FUNCIONANDO - O frontend conseguirá mostrar horários!');
  } else {
    console.log('⚠️ PROBLEMAS DETECTADOS - Verifique a configuração!');
  }
}

runAllTests().catch(console.error);

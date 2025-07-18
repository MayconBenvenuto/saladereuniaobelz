// Teste com horário diferente para verificar criação
const fetch = require('node-fetch');

async function testNewTimeSlot() {
  console.log('🧪 TESTE - NOVO HORÁRIO DISPONÍVEL');
  console.log('=====================================\n');
  
  const baseUrl = 'https://saladereuniaobelz.vercel.app';
  const testDate = '2025-07-18';
  
  try {
    // Criar agendamento em horário livre
    console.log('📝 Criando agendamento em horário livre...');
    const newAppointment = {
      name: 'Teste Final',
      title: 'Reunião Final - ' + new Date().toLocaleTimeString(),
      participants: 'teste.final@email.com',
      date: testDate,
      start_time: '16:30',  // Horário diferente
      end_time: '17:00'     // Horário diferente
    };
    
    console.log(`   📝 Tentando: ${newAppointment.start_time}-${newAppointment.end_time}: ${newAppointment.title}`);
    
    const createResponse = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAppointment)
    });
    
    const result = await createResponse.json();
    
    if (createResponse.ok) {
      console.log(`   ✅ CRIADO! ID: ${result.appointment?.id}`);
      console.log(`   ⏱️ Tempo: ${result.duration}ms`);
      console.log(`   🧹 Cache limpo: ${result.cache_cleared}`);
      
      // Verificar se aparece na lista imediatamente
      console.log('\n🔍 Verificando se aparece na lista...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      
      const listResponse = await fetch(`${baseUrl}/api/appointments?date=${testDate}&_cb=${Date.now()}`);
      const appointments = await listResponse.json();
      
      const found = appointments.find(apt => apt.id === result.appointment?.id);
      
      if (found) {
        console.log(`   ✅ ENCONTRADO! Agendamento está na lista:`);
        console.log(`      - ID: ${found.id}`);
        console.log(`      - Horário: ${found.start_time}-${found.end_time}`);
        console.log(`      - Título: ${found.title}`);
        console.log(`   📋 Total de agendamentos: ${appointments.length}`);
        
        console.log('\n🎯 RESULTADO: SLOT DEVE FICAR VERMELHO NO FRONTEND! ✅');
        
      } else {
        console.log(`   ❌ NÃO ENCONTRADO na lista (pode ser cache do CDN)`);
      }
      
    } else {
      console.log(`   ❌ ERRO: ${createResponse.status} - ${result.error}`);
      if (result.conflict) {
        console.log(`   🔍 Conflito com: ${result.conflict.start_time}-${result.conflict.end_time} (${result.conflict.name})`);
      }
    }
    
  } catch (error) {
    console.log(`❌ ERRO GERAL: ${error.message}`);
  }
  
  console.log('\n=====================================');
  console.log('🏁 TESTE CONCLUÍDO');
}

testNewTimeSlot();

// Teste final para verificar funcionamento completo
const fetch = require('node-fetch');

async function testCompleteFlow() {
  console.log('🧪 TESTE COMPLETO - FLUXO DE AGENDAMENTO');
  console.log('==========================================\n');
  
  const baseUrl = 'https://saladereuniaobelz.vercel.app';
  const testDate = '2025-07-18';
  
  try {
    // 1. Testar Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ Status: ${healthData.status}, Supabase: ${healthData.supabase ? 'OK' : 'ERRO'}`);
    console.log(`   ⏱️ Tempo: ${healthData.duration}ms\n`);
    
    // 2. Testar GET agendamentos (antes)
    console.log('2️⃣ Verificando agendamentos existentes...');
    const getResponse1 = await fetch(`${baseUrl}/api/appointments?date=${testDate}`);
    const appointments1 = await getResponse1.json();
    console.log(`   📋 Agendamentos encontrados: ${appointments1.length}`);
    appointments1.forEach(apt => {
      console.log(`      - ${apt.start_time}-${apt.end_time}: ${apt.title} (${apt.name})`);
    });
    console.log('');
    
    // 3. Criar novo agendamento
    console.log('3️⃣ Criando novo agendamento...');
    const newAppointment = {
      name: 'Teste Automatizado',
      title: 'Reunião de Teste - ' + new Date().toLocaleTimeString(),
      participants: 'teste@email.com',
      date: testDate,
      start_time: '14:00',  // Formato HH:MM
      end_time: '15:00'     // Formato HH:MM
    };
    
    console.log(`   📝 Dados: ${newAppointment.start_time}-${newAppointment.end_time}: ${newAppointment.title}`);
    
    const createResponse = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAppointment)
    });
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log(`   ✅ Criado com sucesso! ID: ${createData.appointment?.id}`);
      console.log(`   ⏱️ Tempo: ${createData.duration}ms\n`);
      
      // 4. Verificar se foi criado (GET após POST)
      console.log('4️⃣ Verificando se agendamento aparece na lista...');
      const getResponse2 = await fetch(`${baseUrl}/api/appointments?date=${testDate}`);
      const appointments2 = await getResponse2.json();
      
      const newAppointmentFound = appointments2.find(apt => 
        apt.id === createData.appointment?.id
      );
      
      if (newAppointmentFound) {
        console.log(`   ✅ SUCESSO! Agendamento encontrado:`);
        console.log(`      - ID: ${newAppointmentFound.id}`);
        console.log(`      - Horário: ${newAppointmentFound.start_time}-${newAppointmentFound.end_time}`);
        console.log(`      - Título: ${newAppointmentFound.title}`);
        console.log(`      - Nome: ${newAppointmentFound.name}`);
      } else {
        console.log(`   ❌ ERRO: Agendamento não encontrado na lista!`);
      }
      
      console.log(`   📋 Total de agendamentos agora: ${appointments2.length}\n`);
      
      // 5. Testar conflito
      console.log('5️⃣ Testando detecção de conflito...');
      const conflictAppointment = {
        ...newAppointment,
        name: 'Teste Conflito',
        title: 'Deveria dar conflito'
      };
      
      const conflictResponse = await fetch(`${baseUrl}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conflictAppointment)
      });
      
      if (conflictResponse.status === 409) {
        const conflictData = await conflictResponse.json();
        console.log(`   ✅ Conflito detectado corretamente: ${conflictData.error}`);
      } else {
        console.log(`   ❌ ERRO: Conflito não foi detectado! Status: ${conflictResponse.status}`);
      }
      
    } else {
      const errorData = await createResponse.json();
      console.log(`   ❌ ERRO ao criar: ${createResponse.status} - ${errorData.error}`);
      console.log(`   📋 Detalhes:`, errorData);
    }
    
  } catch (error) {
    console.log(`❌ ERRO GERAL: ${error.message}`);
  }
  
  console.log('\n==========================================');
  console.log('🏁 TESTE CONCLUÍDO');
}

// Executar teste
testCompleteFlow();

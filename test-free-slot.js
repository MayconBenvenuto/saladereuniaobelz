// Teste de agendamento em horário livre
const API_BASE_URL = 'https://saladereuniaobelz.vercel.app';

async function testFreeSlot() {
  console.log('🧪 Teste de agendamento em horário livre...');
  console.log('=' .repeat(50));
  
  const today = new Date().toISOString().split('T')[0];
  
  // Tentar horário mais tarde que provavelmente está livre
  const testAppointment = {
    name: 'Maria Santos',
    title: 'Reunião de Planejamento',
    description: 'Teste em horário livre',
    date: today,
    start_time: '15:00:00',
    end_time: '16:00:00'
  };
  
  console.log('📋 Tentando agendamento das 15h às 16h:');
  console.log(JSON.stringify(testAppointment, null, 2));
  
  try {
    console.log('\n⏱️  Criando agendamento...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testAppointment)
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCESSO! Agendamento criado: ${response.status} (${duration}ms)`);
      console.log('📋 Resposta:', JSON.stringify(data, null, 2));
      
      // Verificar se aparece na listagem
      console.log('\n🔍 Verificando listagem...');
      const listResponse = await fetch(`${API_BASE_URL}/api/appointments?date=${today}`);
      
      if (listResponse.ok) {
        const appointments = await listResponse.json();
        console.log(`📊 Total de agendamentos hoje: ${appointments.length}`);
        
        const found = appointments.find(apt => apt.name === testAppointment.name);
        if (found) {
          console.log('✅ Agendamento encontrado na listagem!');
          console.log(`📋 ID: ${found.id}, Horário: ${found.start_time}-${found.end_time}`);
        }
      }
      
      // Verificar disponibilidade
      console.log('\n🕒 Verificando disponibilidade...');
      const availResponse = await fetch(`${API_BASE_URL}/api/availability/${today}`);
      
      if (availResponse.ok) {
        const availability = await availResponse.json();
        console.log(`📊 Slots ocupados: ${availability.occupied.length}`);
        
        const occupied = availability.occupied.find(apt => apt.name === testAppointment.name);
        if (occupied) {
          console.log('✅ Slot aparece como ocupado! (Ficará vermelho na interface)');
          console.log('🎉 TESTE COMPLETO: Sistema funcionando 100%!');
        }
      }
      
    } else if (response.status === 409) {
      const errorData = await response.json();
      console.log(`⚠️ Horário também ocupado: ${response.status}`);
      console.log('📋 Conflito:', errorData.conflict);
      console.log('💡 Vou tentar um horário ainda mais tarde...');
      
      // Tentar horário ainda mais tarde
      const lateAppointment = {
        ...testAppointment,
        start_time: '18:00:00',
        end_time: '19:00:00'
      };
      
      console.log('\n⏱️  Tentando das 18h às 19h...');
      const lateResponse = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(lateAppointment)
      });
      
      if (lateResponse.ok) {
        const lateData = await lateResponse.json();
        console.log('✅ SUCESSO no horário tardio!');
        console.log('📋 Agendamento:', lateData.appointment.id);
        console.log('🎉 Sistema funcionando perfeitamente!');
      } else {
        console.log(`❌ Erro no horário tardio: ${lateResponse.status}`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro: ${response.status} (${duration}ms)`);
      console.log('📋 Erro:', errorText.substring(0, 300));
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(50));
}

testFreeSlot().catch(console.error);

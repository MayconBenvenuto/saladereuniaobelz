// Teste específico para criação de agendamentos
const API_BASE_URL = 'https://saladereuniaobelz.vercel.app';

async function testCreateAppointment() {
  console.log('🧪 Teste de criação de agendamento...');
  console.log('=' .repeat(50));
  
  const today = new Date().toISOString().split('T')[0];
  
  // Dados do agendamento de teste
  const testAppointment = {
    name: 'João Silva',
    title: 'Reunião de Teste',
    description: 'Teste automático do sistema',
    date: today,
    start_time: '08:00:00',
    end_time: '09:00:00'
  };
  
  console.log('📋 Dados do agendamento:');
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
      console.log(`✅ Agendamento criado: ${response.status} (${duration}ms)`);
      console.log('📋 Resposta:', JSON.stringify(data, null, 2));
      
      // Verificar se o agendamento aparece na listagem
      console.log('\n🔍 Verificando se aparece na listagem...');
      const listResponse = await fetch(`${API_BASE_URL}/api/appointments?date=${today}`);
      
      if (listResponse.ok) {
        const appointments = await listResponse.json();
        const found = appointments.find(apt => 
          apt.name === testAppointment.name && 
          apt.start_time === testAppointment.start_time
        );
        
        if (found) {
          console.log('✅ Agendamento encontrado na listagem!');
          console.log('📋 ID criado:', found.id);
          
          // Testar disponibilidade
          console.log('\n🕒 Verificando disponibilidade...');
          const availResponse = await fetch(`${API_BASE_URL}/api/availability/${today}`);
          
          if (availResponse.ok) {
            const availability = await availResponse.json();
            const occupied = availability.occupied.find(apt => apt.id === found.id);
            
            if (occupied) {
              console.log('✅ Slot aparece como ocupado na disponibilidade!');
              console.log('🎉 TESTE COMPLETO: Agendamento funcionando 100%!');
            } else {
              console.log('⚠️ Slot não aparece como ocupado na disponibilidade');
            }
          }
          
        } else {
          console.log('❌ Agendamento NÃO encontrado na listagem');
          console.log('📋 Agendamentos existentes:', appointments.length);
        }
      }
      
    } else if (response.status === 409) {
      const errorData = await response.json();
      console.log(`⚠️ Conflito de horário: ${response.status} (${duration}ms)`);
      console.log('📋 Conflito:', JSON.stringify(errorData, null, 2));
      console.log('💡 Isso é esperado se já existe um agendamento neste horário');
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro: ${response.status} - ${response.statusText} (${duration}ms)`);
      console.log('📋 Erro:', errorText.substring(0, 300));
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(50));
}

testCreateAppointment().catch(console.error);

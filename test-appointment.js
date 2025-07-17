// Teste simples para verificar se o agendamento está funcionando
const https = require('https');
const http = require('http');

async function testAppointment() {
  try {
    console.log('🧪 Testando criação de agendamento...');
    
    const appointmentData = {
      title: 'Reunião Teste - Horário Livre',
      name: 'Teste Sistema',
      date: '2025-07-18',
      start_time: '16:00',
      end_time: '17:00',
      description: 'Teste de criação via API'
    };

    const postData = JSON.stringify(appointmentData);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/appointments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Agendamento criado com sucesso!');
          console.log('📅 Dados:', JSON.parse(data));
        } else {
          console.log('❌ Erro ao criar agendamento:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erro de conexão:', error.message);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testAppointment();

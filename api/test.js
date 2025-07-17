const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rota de teste para debugging
app.get('/api/test', (req, res) => {
  console.log('Teste da API chamado');
  res.json({ 
    message: 'API funcionando!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Rota simples de availability para teste
app.get('/api/availability/:date', (req, res) => {
  const { date } = req.params;
  console.log('Availability chamado para data:', date);
  
  // Retorna dados de teste
  const slots = [
    {
      start_time: '08:00',
      end_time: '08:30',
      available: true,
      appointment: null
    },
    {
      start_time: '08:30',
      end_time: '09:00',
      available: false,
      appointment: {
        title: 'Reunião de teste',
        name: 'João Silva'
      }
    }
  ];
  
  res.json(slots);
});

module.exports = app;

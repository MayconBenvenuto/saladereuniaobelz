// test-connection.js
require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Iniciando teste de conexão com o Supabase...');
console.log('SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
console.log('SUPABASE_KEY:', supabaseKey ? 'Definida (parcialmente oculta)' : 'Não definida');

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY devem ser definidas no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Tentando buscar dados da tabela "agendamentos"...');
    
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Erro ao conectar ou consultar o Supabase:', error.message);
      if (error.code) console.error('Código do erro:', error.code);
      if (error.details) console.error('Detalhes:', error.details);
      process.exit(1);
    }

    console.log('✅ Conexão com o Supabase bem-sucedida!');
    console.log('Dados recebidos (exemplo):', data);
    
  } catch (err) {
    console.error('Ocorreu um erro inesperado durante o teste:', err);
    process.exit(1);
  }
}

testConnection();

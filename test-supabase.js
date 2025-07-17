const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Teste de conexão com Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('🔗 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key (primeiros caracteres):', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'NÃO DEFINIDA');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Testa conexão básica
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error.message);
      console.error('Detalhes:', error);
      
      // Tenta verificar se a tabela existe
      console.log('🔍 Verificando se a tabela appointments existe...');
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'appointments');
        
      if (tableError) {
        console.error('❌ Erro ao verificar tabelas:', tableError.message);
      } else {
        console.log('📋 Tabelas encontradas:', tables);
      }
    } else {
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
      console.log('📊 Registros encontrados:', data.length);
      if (data.length > 0) {
        console.log('📋 Exemplo de dados:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Erro na conexão:', err.message);
  }
}

testConnection();

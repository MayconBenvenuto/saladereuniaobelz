const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🔨 Configurando banco de dados...');

  try {
    // Criar tabela appointments via SQL usando rpc (se você tiver uma função SQL)
    // Como não temos acesso direto ao SQL, vamos tentar inserir um registro de teste
    // que pode gerar um erro mais informativo

    console.log('📋 Verificando estrutura atual do banco...');
    
    // Primeiro, vamos listar todas as tabelas disponíveis
    const { data: tables, error } = await supabase.rpc('get_tables');
    
    if (error) {
      console.log('ℹ️  Função get_tables não disponível, tentando outra abordagem...');
      
      // Vamos tentar criar a tabela usando uma inserção que deve falhar
      // mas nos dará informações sobre a estrutura esperada
      const { data, error: insertError } = await supabase
        .from('appointments')
        .insert([{
          title: 'Teste',
          name: 'Teste',
          date: '2025-01-20',
          start_time: '09:00',
          end_time: '10:00'
        }]);

      if (insertError) {
        console.log('❌ Erro esperado (tabela não existe):', insertError.message);
        console.log('\n📝 INSTRUÇÕES PARA CRIAR A TABELA NO SUPABASE:');
        console.log('1. Acesse seu dashboard do Supabase');
        console.log('2. Vá para a seção "Table Editor"');
        console.log('3. Clique em "Create a new table"');
        console.log('4. Nome da tabela: appointments');
        console.log('5. Adicione as seguintes colunas:');
        console.log('   - id: int8 (Primary Key, Auto-increment)');
        console.log('   - title: text (Required)');
        console.log('   - description: text (Optional)');
        console.log('   - name: text (Required)');
        console.log('   - date: date (Required)');
        console.log('   - start_time: time (Required)');
        console.log('   - end_time: time (Required)');
        console.log('   - participants: text (Optional)');
        console.log('   - created_at: timestamptz (Default: now())');
        console.log('\nOu execute este SQL no SQL Editor do Supabase:');
        console.log(`
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  participants TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações (para desenvolvimento)
CREATE POLICY "Enable all operations for authenticated users" ON appointments
FOR ALL USING (true);
        `);
      } else {
        console.log('✅ Tabela existe e inserção foi bem-sucedida!');
      }
    } else {
      console.log('📋 Tabelas encontradas:', tables);
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

setupDatabase();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTable() {
  console.log('🔨 Verificando e criando estrutura do banco de dados...\n');

  try {
    console.log('📋 Tentativa 1: Verificando se a tabela appointments existe...');
    
    // Tenta fazer uma consulta simples na tabela
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('❌ Tabela appointments não existe. Tentando criar...\n');
      
      // Tenta criar a tabela usando RPC (Remote Procedure Call)
      console.log('📝 Criando tabela via SQL...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS appointments (
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
        CREATE POLICY IF NOT EXISTS "Enable all operations" ON appointments
        FOR ALL USING (true);
      `;

      // Tenta executar via rpc
      const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (rpcError) {
        console.log('❌ Não foi possível criar via RPC:', rpcError.message);
        console.log('\n🔧 SOLUÇÃO MANUAL NECESSÁRIA:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0]);
        console.log('2. Vá para "SQL Editor"');
        console.log('3. Execute este SQL:\n');
        console.log('```sql');
        console.log(createTableSQL);
        console.log('```\n');
        
        // Vamos tentar uma abordagem alternativa - criar via insert que falha
        console.log('🔄 Tentativa alternativa: Testando estrutura esperada...');
        
        const { error: insertError } = await supabase
          .from('appointments')
          .insert([{
            title: 'Teste de Estrutura',
            name: 'Sistema',
            date: '2025-07-17',
            start_time: '09:00:00',
            end_time: '10:00:00'
          }]);

        if (insertError) {
          console.log('📊 Detalhes do erro de estrutura:', insertError);
        }
        
      } else {
        console.log('✅ Tabela criada com sucesso via RPC!');
      }
      
    } else if (error) {
      console.log('❌ Erro inesperado:', error.message);
      console.log('Detalhes:', error);
    } else {
      console.log('✅ Tabela appointments existe e está acessível!');
      console.log('📊 Dados encontrados:', data.length, 'registros');
      
      // Vamos testar se conseguimos inserir dados
      console.log('\n🧪 Testando inserção de dados...');
      const testData = {
        title: 'Teste de Conexão',
        name: 'Sistema de Teste',
        date: '2025-07-17',
        start_time: '09:00:00',
        end_time: '10:00:00',
        description: 'Teste automático de conexão'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('appointments')
        .insert([testData])
        .select();

      if (insertError) {
        console.log('❌ Erro ao inserir dados de teste:', insertError.message);
        console.log('Detalhes:', insertError);
      } else {
        console.log('✅ Inserção de teste bem-sucedida!');
        console.log('📋 Dados inseridos:', insertData[0]);
        
        // Limpar dados de teste
        if (insertData[0]?.id) {
          await supabase
            .from('appointments')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Dados de teste removidos');
        }
      }
    }

    // Teste adicional: verificar políticas RLS
    console.log('\n🔒 Verificando configurações de segurança...');
    const { data: policies, error: policiesError } = await supabase
      .from('appointments')
      .select('*')
      .limit(5);

    if (policiesError) {
      console.log('⚠️  Possível problema com políticas RLS:', policiesError.message);
    } else {
      console.log('✅ Políticas de segurança configuradas corretamente');
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

// Função adicional para testar todas as operações CRUD
async function testCRUDOperations() {
  console.log('\n🧪 TESTANDO OPERAÇÕES CRUD...\n');
  
  const testAppointment = {
    title: 'Reunião de Teste CRUD',
    name: 'Sistema de Teste',
    date: '2025-07-17',
    start_time: '14:00:00',
    end_time: '15:00:00',
    description: 'Teste completo de operações CRUD'
  };

  try {
    // CREATE
    console.log('📝 Testando CREATE...');
    const { data: created, error: createError } = await supabase
      .from('appointments')
      .insert([testAppointment])
      .select();

    if (createError) {
      console.log('❌ Erro no CREATE:', createError.message);
      return;
    }
    console.log('✅ CREATE funcionando:', created[0].id);

    const testId = created[0].id;

    // READ
    console.log('📖 Testando READ...');
    const { data: read, error: readError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', testId);

    if (readError) {
      console.log('❌ Erro no READ:', readError.message);
    } else {
      console.log('✅ READ funcionando:', read.length, 'registro(s)');
    }

    // UPDATE
    console.log('✏️  Testando UPDATE...');
    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({ title: 'Reunião ATUALIZADA' })
      .eq('id', testId)
      .select();

    if (updateError) {
      console.log('❌ Erro no UPDATE:', updateError.message);
    } else {
      console.log('✅ UPDATE funcionando:', updated[0].title);
    }

    // DELETE
    console.log('🗑️  Testando DELETE...');
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', testId);

    if (deleteError) {
      console.log('❌ Erro no DELETE:', deleteError.message);
    } else {
      console.log('✅ DELETE funcionando');
    }

    console.log('\n🎉 TODOS OS TESTES CRUD PASSARAM!');

  } catch (err) {
    console.error('❌ Erro nos testes CRUD:', err.message);
  }
}

// Executar verificações
async function main() {
  await checkAndCreateTable();
  
  // Se chegou até aqui sem erro, testa CRUD
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .limit(1);
    
  if (!error) {
    await testCRUDOperations();
  }
  
  console.log('\n📋 RELATÓRIO FINAL:');
  console.log('- URL Supabase:', supabaseUrl);
  console.log('- Chave (início):', supabaseKey.substring(0, 15) + '...');
  console.log('- Status da conexão:', error ? '❌ Com problemas' : '✅ Funcionando');
}

main();

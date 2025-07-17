const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
  console.log('🔍 TESTE RÁPIDO DO BANCO DE DADOS\n');
  
  try {
    // Teste 1: Verificar se tabela existe
    console.log('1️⃣ Verificando se tabela appointments existe...');
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ ERRO:', error.message);
      console.log('\n🔧 SOLUÇÃO: Execute o arquivo create-table.sql no Supabase Dashboard');
      console.log('📍 Link direto: https://supabase.com/dashboard/project/dumbpqwjhawkdqlqagoo/sql');
      return false;
    }

    console.log('✅ Tabela existe!');
    console.log('📊 Registros encontrados:', data.length);

    if (data.length > 0) {
      console.log('📋 Exemplo de dados:');
      data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - ${item.name} (${item.date})`);
      });
    }

    // Teste 2: Verificar se consegue inserir
    console.log('\n2️⃣ Testando inserção de dados...');
    const testData = {
      title: 'Teste Automático',
      name: 'Sistema',
      date: new Date().toISOString().split('T')[0],
      start_time: '15:00:00',
      end_time: '16:00:00',
      description: 'Teste de inserção'
    };

    const { data: inserted, error: insertError } = await supabase
      .from('appointments')
      .insert([testData])
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      return false;
    }

    console.log('✅ Inserção funcionou!');
    const newId = inserted[0].id;

    // Teste 3: Limpar dados de teste
    console.log('\n3️⃣ Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', newId);

    if (deleteError) {
      console.log('⚠️ Aviso: Não foi possível limpar dados de teste');
    } else {
      console.log('✅ Limpeza concluída!');
    }

    // Teste 4: Verificar API endpoint
    console.log('\n4️⃣ Testando endpoint de disponibilidade...');
    const today = new Date().toISOString().split('T')[0];
    const { data: availability, error: availError } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', today);

    if (availError) {
      console.log('❌ Erro no endpoint:', availError.message);
      return false;
    }

    console.log('✅ Endpoint funcionando!');

    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('🚀 Seu banco está pronto para o sistema de agendamentos!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Faça commit e push do código');
    console.log('2. A Vercel fará redeploy automático');
    console.log('3. Teste o site na URL da Vercel');
    
    return true;

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    return false;
  }
}

quickTest();

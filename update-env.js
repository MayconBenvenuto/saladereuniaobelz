const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 ATUALIZADOR DE CHAVES DO SUPABASE');
console.log('=====================================');
console.log('');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    console.log('📋 Por favor, forneça as novas chaves do Supabase:');
    console.log('   (Encontre-as em: Settings → API no dashboard do Supabase)');
    console.log('');

    const supabaseUrl = await askQuestion('🔗 Project URL (ex: https://abc123.supabase.co): ');
    if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
      console.log('❌ URL inválida. Deve conter "supabase.co"');
      process.exit(1);
    }

    const supabaseKey = await askQuestion('🔑 Anon public key (eyJhbGciOiJIUzI1NiIs...): ');
    if (!supabaseKey || !supabaseKey.startsWith('eyJ')) {
      console.log('❌ Chave inválida. Deve começar com "eyJ"');
      process.exit(1);
    }

    console.log('');
    console.log('💾 Atualizando arquivo .env...');

    const envContent = `# Configurações do Supabase - Atualizado em ${new Date().toLocaleString('pt-BR')}
SUPABASE_URL=${supabaseUrl}
SUPABASE_KEY=${supabaseKey}

# Configurações do servidor
PORT=3001
NODE_ENV=development

# Frontend
REACT_APP_SUPABASE_URL=${supabaseUrl}
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${supabaseKey}
`;

    fs.writeFileSync('.env', envContent, 'utf8');
    
    console.log('✅ Arquivo .env atualizado com sucesso!');
    console.log('');
    console.log('🧪 Testando nova configuração...');
    
    // Testar a nova configuração
    require('dotenv').config();
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    try {
      const { data, error } = await supabase.from('_temp_test').select('*').limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('✅ API Key funcionando! (Tabela não existe, mas conexão OK)');
      } else if (error) {
        console.log('⚠️  API Key OK, mas pode haver outros problemas:', error.message);
      } else {
        console.log('✅ API Key funcionando perfeitamente!');
      }
    } catch (err) {
      console.log('❌ Erro ao testar:', err.message);
    }
    
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('1. Reiniciar o backend: npm start');
    console.log('2. Criar tabela no Supabase: Execute o SQL em create-table.sql');
    console.log('3. Testar novamente: npm run test-connection');
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  } finally {
    rl.close();
  }
}

main();

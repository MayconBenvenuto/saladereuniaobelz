#!/bin/bash

echo "🔧 Testando correções para problema de carregamento..."

echo "📦 Instalando dependências..."
npm install
cd frontend && npm install && cd ..

echo "🏗️ Fazendo build do frontend..."
cd frontend && npm run build && cd ..

echo "✅ Correções aplicadas:"
echo "1. ✅ Rota /api/availability/:date adicionada no backend"
echo "2. ✅ API_BASE_URL configurada corretamente para prod/dev"
echo "3. ✅ Logs de debug adicionados"
echo "4. ✅ Tratamento de erro melhorado"
echo "5. ✅ Rota de teste adicionada"

echo ""
echo "🚀 Para fazer deploy:"
echo "git add ."
echo "git commit -m 'fix: corrige problema de carregamento de horários em produção'"
echo "git push"

echo ""
echo "🔍 Para testar localmente:"
echo "npm run dev"

echo ""
echo "🌐 Após o deploy, teste:"
echo "1. Clique no botão 'Testar API'"
echo "2. Verifique os logs no console do navegador"
echo "3. Se a API funcionar, os horários devem carregar"

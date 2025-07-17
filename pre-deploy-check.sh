#!/bin/bash

echo "🔍 VERIFICAÇÃO FINAL ANTES DO DEPLOY"
echo "===================================="

# Verificar se o build existe
if [ -f "frontend/build/index.html" ]; then
    echo "✅ Build do frontend existe"
else
    echo "❌ Build do frontend não encontrado"
    echo "Execute: cd frontend && npm run build"
    exit 1
fi

# Verificar se os arquivos da API existem
if [ -f "api/vercel.js" ]; then
    echo "✅ API vercel.js existe"
else
    echo "❌ API vercel.js não encontrado"
    exit 1
fi

if [ -f "api/index.js" ]; then
    echo "✅ API index.js existe"
else
    echo "❌ API index.js não encontrado"
    exit 1
fi

# Verificar vercel.json
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json existe"
else
    echo "❌ vercel.json não encontrado"
    exit 1
fi

# Verificar variáveis de ambiente
if [ -f ".env" ]; then
    echo "✅ Arquivo .env existe"
    if grep -q "SUPABASE_URL" .env && grep -q "SUPABASE_KEY" .env; then
        echo "✅ Variáveis do Supabase configuradas"
    else
        echo "⚠️  Verificar variáveis do Supabase no .env"
    fi
else
    echo "⚠️  Arquivo .env não encontrado"
fi

echo ""
echo "📋 CHECKLIST PARA VERCEL:"
echo "1. ✅ Confirme que as variáveis de ambiente estão na Vercel:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_KEY" 
echo "   - REACT_APP_SUPABASE_URL"
echo "   - REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
echo ""
echo "2. ✅ Faça o commit e push:"
echo "   git add ."
echo "   git commit -m 'fix: resolve 404 error with corrected vercel config'"
echo "   git push origin main"
echo ""
echo "3. ✅ Aguarde o deploy automático da Vercel"
echo ""
echo "🚀 Pronto para deploy!"

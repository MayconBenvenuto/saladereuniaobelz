#!/bin/bash

# Script de Deploy Otimizado - Sistema de Agendamento Belz
# Este script implementa todas as otimizações e faz o deploy

echo "🚀 Iniciando deploy otimizado do Sistema de Agendamento Belz..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto (onde está o package.json)"
fi

log "Verificando dependências..."

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    warning "Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

# Verificar variáveis de ambiente
if [ -z "$SUPABASE_URL" ]; then
    warning "SUPABASE_URL não definida. Configure no Vercel Dashboard."
fi

if [ -z "$SUPABASE_KEY" ]; then
    warning "SUPABASE_KEY não definida. Configure no Vercel Dashboard."
fi

# 1. Instalar dependências do backend
log "Instalando dependências do backend..."
npm install

# 2. Instalar dependências do frontend
log "Instalando dependências do frontend..."
cd frontend
npm install
cd ..

# 3. Build do frontend
log "Fazendo build do frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    error "Falha no build do frontend"
fi
cd ..
success "Build do frontend concluído"

# 4. Verificar se funções SQL existem no Supabase
log "Verificando configuração do Supabase..."
if [ -f "supabase-functions.sql" ]; then
    warning "Execute o arquivo supabase-functions.sql no Supabase SQL Editor antes de continuar"
    echo "Pressione Enter para continuar após executar as funções SQL..."
    read
else
    warning "Arquivo supabase-functions.sql não encontrado"
fi

# 5. Testar API localmente (opcional)
log "Iniciando teste local da API..."
timeout 10 npm start &
SERVER_PID=$!
sleep 5

# Testar endpoint otimizado
if curl -f http://localhost:3001/api/test > /dev/null 2>&1; then
    success "API local funcionando"
else
    warning "API local não responde (normal se já estiver em produção)"
fi

# Parar servidor local
kill $SERVER_PID 2>/dev/null

# 6. Deploy no Vercel
log "Fazendo deploy no Vercel..."
vercel --prod
if [ $? -ne 0 ]; then
    error "Falha no deploy do Vercel"
fi

success "Deploy concluído com sucesso!"

# 7. Testes pós-deploy
log "Executando testes pós-deploy..."

# Aguardar propagação
sleep 10

# Obter URL do projeto
PROJECT_URL=$(vercel ls --scope=team | grep saladereuniaobelz | awk '{print $2}' | head -1)
if [ -z "$PROJECT_URL" ]; then
    PROJECT_URL="https://saladereuniaobelz.vercel.app"
fi

echo ""
echo "🎉 Deploy finalizado!"
echo "📱 URL do projeto: $PROJECT_URL"
echo ""

# Testar endpoints otimizados
log "Testando endpoints otimizados..."

# Teste do endpoint de teste
if curl -f "$PROJECT_URL/api/test" > /dev/null 2>&1; then
    success "✅ Endpoint /api/test funcionando"
else
    warning "⚠️  Endpoint /api/test não responde"
fi

# Teste do endpoint otimizado
TODAY=$(date +%Y-%m-%d)
if curl -f "$PROJECT_URL/api/occupied-slots/$TODAY" > /dev/null 2>&1; then
    success "✅ Endpoint /api/occupied-slots funcionando"
else
    warning "⚠️  Endpoint /api/occupied-slots não responde"
fi

echo ""
echo "📋 Checklist pós-deploy:"
echo "□ Testar agendamento em dispositivo mobile"
echo "□ Verificar cache funcionando (DevTools > Network)"
echo "□ Testar navegação entre datas"
echo "□ Verificar retry automático em conexão lenta"
echo "□ Confirmar responsividade em diferentes telas"
echo ""

echo "🔧 Se houver problemas:"
echo "1. Verificar logs: vercel logs"
echo "2. Confirmar variáveis de ambiente no Vercel Dashboard"
echo "3. Verificar se funções SQL foram criadas no Supabase"
echo ""

success "Deploy otimizado concluído! 🚀"

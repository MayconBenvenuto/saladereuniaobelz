#!/bin/bash

# Script de build para Vercel - Otimizado
echo "🚀 Iniciando build para Vercel..."

# Definir variáveis de ambiente para produção
export NODE_ENV=production
export CI=true

# Verificar se o Node.js está na versão correta
node_version=$(node -v)
echo "📋 Versão do Node.js: $node_version"

# Verificar se o npm está funcionando
npm_version=$(npm -v)
echo "📋 Versão do npm: $npm_version"

# Navegar para o diretório frontend
echo "📁 Navegando para o diretório frontend..."
cd frontend || { echo "❌ Erro: Diretório frontend não encontrado"; exit 1; }

# Limpar cache do npm se necessário
echo "🧹 Limpando cache..."
npm cache clean --force

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
npm ci --production=false --silent

# Verificar se as dependências foram instaladas
if [ ! -d "node_modules" ]; then
    echo "❌ Erro: node_modules não foi criado"
    exit 1
fi

# Executar build
echo "🔨 Executando build do frontend..."
npm run build

# Verificar se o build foi criado
if [ ! -d "build" ]; then
    echo "❌ Erro: Diretório build não foi criado"
    exit 1
fi

# Verificar se o index.html foi criado
if [ ! -f "build/index.html" ]; then
    echo "❌ Erro: index.html não foi criado no build"
    exit 1
fi

echo "✅ Build concluído com sucesso!"
echo "📊 Tamanho do diretório build:"
du -sh build/
echo "📁 Conteúdo do diretório build:"
ls -la build/

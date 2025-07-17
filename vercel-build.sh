#!/bin/bash

# Script de pré-deploy para Vercel
echo "🚀 Iniciando pré-deploy..."

# Verificar se o Node.js está na versão correta
node_version=$(node -v)
echo "📋 Versão do Node.js: $node_version"

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm ci

# Executar build
echo "🔨 Executando build do frontend..."
npm run build

echo "✅ Pré-deploy concluído com sucesso!"

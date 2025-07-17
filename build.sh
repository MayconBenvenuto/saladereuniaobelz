#!/bin/bash

# Script para build do frontend na Vercel
echo "Iniciando build do frontend..."

# Navegar para o diretório do frontend
cd frontend

# Instalar dependências
echo "Instalando dependências..."
npm ci

# Construir o projeto
echo "Construindo o projeto..."
npm run build

# Mover arquivos para o diretório correto
echo "Organizando arquivos de build..."
cd ..

echo "Build concluído com sucesso!"

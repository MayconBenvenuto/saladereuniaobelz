# Script de Deploy Otimizado para Windows - Sistema de Agendamento Belz
# PowerShell Script

param(
    [switch]$SkipTests,
    [switch]$Force
)

# Configurações
$ErrorActionPreference = "Stop"
$ProjectUrl = "https://saladereuniaobelz.vercel.app"

# Função para log colorido
function Write-Log {
    param($Message, $Color = "Blue")
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Iniciando deploy otimizado do Sistema de Agendamento Belz..." -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (!(Test-Path "package.json")) {
    Write-Error "Execute este script na raiz do projeto (onde está o package.json)"
}

Write-Log "Verificando dependências..."

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
} catch {
    Write-Error "Node.js não encontrado. Instale o Node.js primeiro."
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-Success "npm instalado: $npmVersion"
} catch {
    Write-Error "npm não encontrado."
}

# Verificar Vercel CLI
try {
    $vercelVersion = vercel --version
    Write-Success "Vercel CLI instalado: $vercelVersion"
} catch {
    Write-Warning "Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
}

# Verificar variáveis de ambiente
if (-not $env:SUPABASE_URL) {
    Write-Warning "SUPABASE_URL não definida. Configure no Vercel Dashboard."
}

if (-not $env:SUPABASE_KEY) {
    Write-Warning "SUPABASE_KEY não definida. Configure no Vercel Dashboard."
}

# 1. Instalar dependências do backend
Write-Log "Instalando dependências do backend..."
try {
    npm install
    Write-Success "Dependências do backend instaladas"
} catch {
    Write-Error "Falha ao instalar dependências do backend"
}

# 2. Instalar dependências do frontend
Write-Log "Instalando dependências do frontend..."
try {
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Success "Dependências do frontend instaladas"
} catch {
    Write-Error "Falha ao instalar dependências do frontend"
}

# 3. Build do frontend
Write-Log "Fazendo build do frontend..."
try {
    Set-Location frontend
    npm run build
    Set-Location ..
    Write-Success "Build do frontend concluído"
} catch {
    Write-Error "Falha no build do frontend"
}

# 4. Verificar funções SQL
Write-Log "Verificando configuração do Supabase..."
if (Test-Path "supabase-functions.sql") {
    Write-Warning "Execute o arquivo supabase-functions.sql no Supabase SQL Editor antes de continuar"
    if (-not $Force) {
        Read-Host "Pressione Enter para continuar após executar as funções SQL..."
    }
} else {
    Write-Warning "Arquivo supabase-functions.sql não encontrado"
}

# 5. Testar API localmente (se não for pulado)
if (-not $SkipTests) {
    Write-Log "Iniciando teste local da API..."
    
    # Iniciar servidor em background
    $job = Start-Job -ScriptBlock {
        Set-Location $args[0]
        npm start
    } -ArgumentList (Get-Location)
    
    Start-Sleep 5
    
    # Testar endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "API local funcionando"
        }
    } catch {
        Write-Warning "API local não responde (normal se já estiver em produção)"
    }
    
    # Parar servidor
    Stop-Job $job -Force
    Remove-Job $job -Force
}

# 6. Deploy no Vercel
Write-Log "Fazendo deploy no Vercel..."
try {
    $deployOutput = vercel --prod --confirm 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deploy concluído com sucesso!"
        
        # Extrair URL do output
        $urlLine = $deployOutput | Where-Object { $_ -match "https://.*\.vercel\.app" }
        if ($urlLine) {
            $ProjectUrl = ($urlLine -split " " | Where-Object { $_ -match "https://.*\.vercel\.app" })[0]
        }
    } else {
        Write-Error "Falha no deploy do Vercel: $deployOutput"
    }
} catch {
    Write-Error "Erro durante deploy: $($_.Exception.Message)"
}

# 7. Testes pós-deploy
if (-not $SkipTests) {
    Write-Log "Executando testes pós-deploy..."
    
    # Aguardar propagação
    Start-Sleep 10
    
    Write-Host ""
    Write-Host "🎉 Deploy finalizado!" -ForegroundColor Green
    Write-Host "📱 URL do projeto: $ProjectUrl" -ForegroundColor Cyan
    Write-Host ""
    
    # Testar endpoints otimizados
    Write-Log "Testando endpoints otimizados..."
    
    # Teste do endpoint de teste
    try {
        $response = Invoke-WebRequest -Uri "$ProjectUrl/api/test" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ Endpoint /api/test funcionando"
        }
    } catch {
        Write-Warning "⚠️  Endpoint /api/test não responde"
    }
    
    # Teste do endpoint otimizado
    $today = Get-Date -Format "yyyy-MM-dd"
    try {
        $response = Invoke-WebRequest -Uri "$ProjectUrl/api/occupied-slots/$today" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ Endpoint /api/occupied-slots funcionando"
        }
    } catch {
        Write-Warning "⚠️  Endpoint /api/occupied-slots não responde"
    }
}

Write-Host ""
Write-Host "📋 Checklist pós-deploy:" -ForegroundColor Yellow
Write-Host "□ Testar agendamento em dispositivo mobile"
Write-Host "□ Verificar cache funcionando (DevTools > Network)"
Write-Host "□ Testar navegação entre datas"
Write-Host "□ Verificar retry automático em conexão lenta"
Write-Host "□ Confirmar responsividade em diferentes telas"
Write-Host ""

Write-Host "🔧 Se houver problemas:" -ForegroundColor Yellow
Write-Host "1. Verificar logs: vercel logs"
Write-Host "2. Confirmar variáveis de ambiente no Vercel Dashboard"
Write-Host "3. Verificar se funções SQL foram criadas no Supabase"
Write-Host "4. Executar novamente com: .\deploy-otimizado.ps1 -Force"
Write-Host ""

Write-Success "Deploy otimizado concluído! 🚀"

# Abrir URL no navegador
if (-not $SkipTests) {
    $openBrowser = Read-Host "Deseja abrir o projeto no navegador? (y/N)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process $ProjectUrl
    }
}

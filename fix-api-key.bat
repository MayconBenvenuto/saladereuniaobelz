@echo off
echo =============================================
echo VERIFICACAO E CORRECAO DA API KEY SUPABASE
echo =============================================
echo.
echo PROBLEMA IDENTIFICADO: Invalid API key
echo.
echo SOLUCAO:
echo 1. Acesse seu dashboard do Supabase: https://supabase.com/dashboard
echo 2. Selecione seu projeto: dumbpqwjhawkdqlqagoo
echo 3. Vá em Settings -^> API
echo 4. Copie as seguintes chaves:
echo.
echo    - Project URL: https://seu-projeto.supabase.co
echo    - Anon public key: eyJhbGciOiJIUzI1NiIs...
echo    - Service role key (opcional): eyJhbGciOiJIUzI1NiIs...
echo.
echo 5. Atualize o arquivo .env com as novas chaves
echo.
echo ARQUIVO ATUAL (.env):
echo =====================
type .env
echo.
echo =============================================
echo.
echo Pressione qualquer tecla para abrir o dashboard do Supabase...
pause >nul
start https://supabase.com/dashboard/projects
echo.
echo Apos copiar as chaves, execute: node update-env.js
echo.
pause

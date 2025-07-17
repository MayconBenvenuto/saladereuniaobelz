Write-Host "🔧 Testando correções para problema de carregamento..." -ForegroundColor Green

Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install
Set-Location frontend
npm install
Set-Location ..

Write-Host "🏗️ Fazendo build do frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..

Write-Host "✅ Correções aplicadas:" -ForegroundColor Green
Write-Host "1. ✅ Rota /api/availability/:date adicionada no backend"
Write-Host "2. ✅ API_BASE_URL configurada corretamente para prod/dev"
Write-Host "3. ✅ Logs de debug adicionados"
Write-Host "4. ✅ Tratamento de erro melhorado"
Write-Host "5. ✅ Rota de teste adicionada"

Write-Host ""
Write-Host "🚀 Para fazer deploy:" -ForegroundColor Blue
Write-Host "git add ."
Write-Host "git commit -m 'fix: corrige problema de carregamento de horários em produção'"
Write-Host "git push"

Write-Host ""
Write-Host "🔍 Para testar localmente:" -ForegroundColor Cyan
Write-Host "npm run dev"

Write-Host ""
Write-Host "🌐 Após o deploy, teste:" -ForegroundColor Magenta
Write-Host "1. Clique no botão 'Testar API'"
Write-Host "2. Verifique os logs no console do navegador"
Write-Host "3. Se a API funcionar, os horarios devem carregar"

# Script para rodar backend e frontend em janelas separadas
Start-Process powershell -ArgumentList 'cd api; node index.js'
Start-Process powershell -ArgumentList 'cd frontend; npm start'
Write-Host 'Backend e frontend iniciados em janelas separadas.' 
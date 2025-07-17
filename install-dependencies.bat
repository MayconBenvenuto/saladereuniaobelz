@echo off
echo Instalando dependencias do projeto...

echo.
echo ========================================
echo Instalando dependencias do backend...
echo ========================================
npm install

echo.
echo ========================================
echo Instalando dependencias do frontend...
echo ========================================
cd frontend
npm install

echo.
echo ========================================
echo Testando a aplicacao...
echo ========================================
cd ..
node test-connection-fix.js

echo.
echo ========================================
echo Instalacao concluida!
echo ========================================
echo.
echo Para iniciar a aplicacao:
echo 1. Backend: npm start
echo 2. Frontend: cd frontend && npm start
echo 3. Ou ambos: npm run dev
echo.
pause

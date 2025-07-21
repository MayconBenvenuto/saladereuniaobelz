# 🚨 CORREÇÕES PARA TIMEOUT NA VERCEL

## Problema Identificado:
- As requisições para `https://saladereuniaobelz.vercel.app/api/*` estão expirando (timeout)
- Frontend não consegue carregar dados da API
- Possível cold start muito lento ou erro na inicialização

## Soluções Implementadas:

### 1. API Ultra-Simples (`/api/simple`)
- **Arquivo:** `api/simple.js`
- **Propósito:** Endpoint de diagnóstico sem dependências
- **Resposta instantânea** sem carregar Express ou Supabase
- **URL de teste:** `https://saladereuniaobelz.vercel.app/api/simple`

### 2. Handler Vercel Robusto
- **Arquivo:** `api/vercel.js` (atualizado)
- **Timeout de inicialização:** 5 segundos
- **Fallback:** Resposta de emergência se app falhar
- **Logs detalhados** para diagnóstico

### 3. Configuração Vercel Otimizada
- **Arquivo:** `vercel.json` (atualizado)
- **maxDuration:** 30 segundos para todas as funções
- **Rota dedicada** para `/api/simple`
- **Build separado** para função simples

## Como Testar Após Deploy:

### Teste 1: API Ultra-Simples
```
https://saladereuniaobelz.vercel.app/api/simple
```
**Esperado:** Resposta em < 2 segundos

### Teste 2: API Principal
```
https://saladereuniaobelz.vercel.app/api/ping
```
**Esperado:** Resposta em < 10 segundos

### Teste 3: Debug de Variáveis
```
https://saladereuniaobelz.vercel.app/api/debug-env
```
**Esperado:** Mostrar se variáveis estão configuradas

## Verificar Logs na Vercel:
1. Dashboard → Projeto → Functions
2. Ver logs da função `api/vercel.js`
3. Procurar por mensagens de erro ou timeout

## ⚠️ IMPORTANTE:
**As variáveis de ambiente DEVEM estar configuradas na Vercel:**
- `SUPABASE_URL` = `https://dumbpqwjhawkdqlqagoo.supabase.co`
- `SUPABASE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bWJwcXdqaGF3a2RxbHFhZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MzYyMDgsImV4cCI6MjA2ODExMjIwOH0.MYDo15jh8jx9Vn9iWD7xCgSc4wGLPcbA_KuVEmPVW1o`

## Próximos Passos:
1. Fazer commit e push das mudanças
2. Aguardar redeploy automático
3. Testar `/api/simple` primeiro
4. Se simples funcionar, verificar logs do principal
5. Configurar variáveis se necessário

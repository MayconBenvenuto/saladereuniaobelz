# Script para deploy com logs detalhados

# Este arquivo contém as mudanças implementadas para debug:

## 1. Logs Detalhados Adicionados:

### api/index.js:
- ✅ Logs de inicialização com informações da Vercel
- ✅ Logs detalhados do carregamento de variáveis de ambiente
- ✅ Logs de configuração do CORS
- ✅ Logs detalhados da inicialização do Supabase
- ✅ Endpoint /api/debug-env para diagnóstico
- ✅ Logs melhorados nos endpoints /api/ping e /api/health

### api/vercel.js:
- ✅ Logs de inicialização da função serverless
- ✅ Logs de carregamento do app Express
- ✅ Wrapper com logs de requisições

## 2. Informações que serão logadas na Vercel:

- Variáveis de ambiente disponíveis
- Status da inicialização do Supabase
- Informações da região e ambiente Vercel
- Detalhes de cada requisição recebida
- Erros com stack trace completo

## 3. Como verificar os logs na Vercel:

1. Acesse https://vercel.com/dashboard
2. Vá para o projeto saladereuniaobelz
3. Clique em "Functions" ou "Serverless Functions"
4. Visualize os logs das execuções

## 4. Endpoints para teste após deploy:

- https://saladereuniaobelz.vercel.app/api/ping
- https://saladereuniaobelz.vercel.app/api/health
- https://saladereuniaobelz.vercel.app/api/debug-env

## 5. Variáveis de ambiente que devem estar configuradas na Vercel:

- SUPABASE_URL=https://dumbpqwjhawkdqlqagoo.supabase.co
- SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bWJwcXdqaGF3a2RxbHFhZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MzYyMDgsImV4cCI6MjA2ODExMjIwOH0.MYDo15jh8jx9Vn9iWD7xCgSc4wGLPcbA_KuVEmPVW1o

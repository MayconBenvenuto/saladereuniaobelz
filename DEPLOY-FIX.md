# 🔧 Instruções para corrigir o erro 404 na Vercel

## Problema identificado:
O arquivo `vercel.json` estava apontando para `api/minimal.js` que não existe. O arquivo correto é `api/vercel.js`.

## ✅ Correções feitas:

### 1. Corrigido o arquivo `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { 
        "distDir": "frontend/build"
      }
    },
    {
      "src": "api/vercel.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/test",
      "dest": "/api/test.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/vercel.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/index.html"
    }
  ]
}
```

### 2. Melhorado o arquivo `api/vercel.js`:
- Adicionado configuração automática do `NODE_ENV=production` na Vercel
- Configurado opções otimizadas para serverless functions

### 3. Criado arquivo de teste `api/test.js`:
- Para testar se a API está funcionando: `/api/test`

## 🚀 Próximos passos para o deploy:

### 1. Configurar variáveis de ambiente na Vercel:
Acesse o painel da Vercel → Settings → Environment Variables e adicione:

```
SUPABASE_URL=https://dumbpqwjhawkdqlqagoo.supabase.co
SUPABASE_KEY=SUA_CHAVE_SUPABASE_AQUI
NODE_ENV=production
```

### 2. Fazer o redeploy:
```bash
git add .
git commit -m "fix: corrigido vercel.json e configuração da API"
git push origin main
```

### 3. Testar as rotas após o deploy:
- `https://saladereuniaobelz.vercel.app/api/test` - Deve retornar status OK
- `https://saladereuniaobelz.vercel.app/api/ping` - Deve retornar "pong"
- `https://saladereuniaobelz.vercel.app/api/appointments?date=2025-07-21` - Deve retornar os agendamentos
- `https://saladereuniaobelz.vercel.app/api/availability/2025-07-21` - Deve retornar a disponibilidade

## 🔍 Debug adicional:
Se ainda houver problemas, verifique:
1. Se as variáveis de ambiente estão configuradas corretamente na Vercel
2. Se o Supabase está respondendo (teste a conexão direta)
3. Logs da função serverless no painel da Vercel

## ⚠️ Nota sobre a SUPABASE_KEY:
No arquivo `api/.env` local você tem uma chave diferente.
Configure a chave correta no painel da Vercel usando as variáveis de ambiente.

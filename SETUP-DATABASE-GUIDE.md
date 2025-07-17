# 🔨 GUIA PASSO A PASSO: CRIAR TABELA NO SUPABASE

## ❌ PROBLEMA CONFIRMADO
A tabela `appointments` não existe no seu banco Supabase. Por isso está dando erro 404 na Vercel.

## ✅ SOLUÇÃO IMEDIATA

### PASSO 1: Acessar o Dashboard do Supabase
1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard/project/dumbpqwjhawkdqlqagoo
3. Faça login com sua conta

### PASSO 2: Acessar o SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** (Nova consulta)

### PASSO 3: Executar o Script SQL
1. Copie todo o conteúdo do arquivo `create-table.sql`
2. Cole no editor SQL do Supabase
3. Clique em **"Run"** (Executar) ou pressione `Ctrl+Enter`

### PASSO 4: Verificar se Funcionou
Se tudo deu certo, você deve ver:
- ✅ Mensagem de sucesso
- ✅ Tabela criada
- ✅ 2 registros de teste inseridos

## 🧪 TESTAR APÓS CRIAÇÃO

Execute este comando no seu terminal para testar:
```bash
node diagnose-database.js
```

Você deve ver:
- ✅ Tabela appointments existe
- ✅ Todos os testes CRUD passaram
- ✅ Políticas de segurança OK

## 🚀 DEPLOY AUTOMÁTICO

Após criar a tabela:
1. Faça commit das mudanças:
   ```bash
   git add .
   git commit -m "fix: add database setup and improved error handling"
   git push origin main
   ```

2. A Vercel fará redeploy automático
3. Seu site funcionará perfeitamente!

## 📱 VERSÃO MOBILE/TABLET

Se estiver pelo celular:
1. Acesse supabase.com no navegador
2. Faça login
3. Vá em Projects → seu projeto
4. SQL Editor
5. Cole o código e execute

## ⚠️ SE DER ERRO

Se algum erro acontecer:
1. Verifique se está logado na conta correta
2. Verifique se o projeto existe
3. Tente executar linha por linha
4. Me avise qual erro apareceu

## 🎯 RESULTADO ESPERADO

Após executar o SQL, você terá:
- ✅ Tabela `appointments` criada
- ✅ Colunas: id, title, description, name, date, start_time, end_time, participants, created_at
- ✅ 2 agendamentos de exemplo
- ✅ Permissões configuradas
- ✅ Site funcionando na Vercel

---
**⏱️ Tempo estimado: 2-3 minutos**

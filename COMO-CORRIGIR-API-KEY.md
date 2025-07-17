# 🔧 Como corrigir o erro "Invalid API key"

## Problema
Sua aplicação está mostrando o erro: **Invalid API key**

## Solução Passo a Passo

### 1. Acesse o Dashboard do Supabase
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta

### 2. Selecione seu Projeto
- Clique no projeto: **dumbpqwjhawkdqlqagoo** (ou o nome que você deu)

### 3. Encontre as Chaves da API
- No menu lateral, clique em **Settings** (⚙️)
- Clique em **API**
- Você verá duas chaves importantes:

#### Project URL
```
https://seu-projeto-id.supabase.co
```

#### Anon (public) key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Atualize o arquivo .env
Abra o arquivo `.env` na raiz do projeto e substitua:

```env
SUPABASE_URL=https://sua-nova-url.supabase.co
SUPABASE_KEY=sua-nova-chave-aqui
```

### 5. Scripts Automáticos
Para facilitar, execute um dos scripts:

#### Windows:
```bash
fix-api-key.bat
```

#### Atualização guiada:
```bash
node update-env.js
```

### 6. Teste a Configuração
```bash
npm run test-connection
```

### 7. Reinicie a Aplicação
```bash
npm start
```

## Verificação Manual

Se preferir verificar manualmente, teste no navegador:
```
https://sua-url.supabase.co/rest/v1/
```

Com o header:
```
Authorization: Bearer sua-chave
apikey: sua-chave
```

## Dicas
- ✅ Use sempre a chave **anon (public)**
- ✅ Nunca use a chave **service_role** no frontend
- ✅ A URL deve terminar com `.supabase.co`
- ✅ A chave deve começar com `eyJ`

## Problemas Comuns
1. **Projeto pausado**: Reative no dashboard
2. **Chave expirada**: Gere uma nova
3. **URL incorreta**: Copie exatamente do dashboard
4. **Espaços em branco**: Remova espaços extras

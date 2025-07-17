# Sistema de Agendamento de Sala de Reunião - Belz Corretora de Seguros

Sistema completo para agendamento da sala de reunião da Belz Corretora de Seguros, desenvolvido com React.js e Express.js, usando Supabase como banco de dados.

## 🚀 Funcionalidades

- ✅ Visualização de disponibilidade por data
- ✅ Agendamento de reuniões com validação de conflitos
- ✅ Interface responsiva e moderna
- ✅ Integração completa com Supabase
- ✅ Deploy automático na Vercel

## 🏗️ Estrutura do Projeto

```
├── api/                 # Backend Express.js
│   ├── index.js        # Servidor principal
│   ├── vercel.js       # Adaptador para Vercel
│   └── .env            # Variáveis de ambiente
├── frontend/           # Frontend React
│   ├── src/
│   │   ├── App.js      # Componente principal
│   │   └── ...
│   └── package.json
├── vercel.json         # Configuração de deploy
└── package.json        # Dependências do projeto
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- React 19
- Tailwind CSS
- Axios para requisições HTTP
- CRACO para configuração personalizada

### Backend
- Node.js
- Express.js
- Supabase (PostgreSQL)
- CORS para comunicação cross-origin

### Deploy
- Vercel (Frontend + Serverless Functions)

## 🔧 Configuração Local

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd saladereuniaobelz
```

### 2. Instale as dependências
```bash
# Dependências do backend
npm install

# Dependências do frontend
cd frontend
npm install
cd ..
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `api/` com:
```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_publica_do_supabase
PORT=3001
```

Crie um arquivo `.env.local` na pasta `frontend/` com:
```
REACT_APP_SUPABASE_URL=sua_url_do_supabase
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sua_chave_publica_do_supabase
```

### 4. Configure o banco de dados Supabase

Crie uma tabela `appointments` no Supabase com a seguinte estrutura:

```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  participants TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Execute o projeto localmente

```bash
# Terminal 1 - Backend
cd api
node index.js

# Terminal 2 - Frontend
cd frontend
npm start
```

Ou use o script PowerShell:
```powershell
.\start-all.ps1
```

## 🚀 Deploy na Vercel

### 1. Conecte seu repositório à Vercel

### 2. Configure as variáveis de ambiente na Vercel:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

### 3. O deploy será automático a cada push

## 📋 Estrutura da API

### Endpoints Disponíveis

#### `GET /api/appointments?date=YYYY-MM-DD`
Busca agendamentos por data.

#### `GET /api/availability/:date`
Retorna disponibilidade de horários para uma data específica.

#### `POST /api/appointments`
Cria um novo agendamento.
```json
{
  "title": "Reunião de Vendas",
  "description": "Descrição da reunião",
  "name": "Nome do Responsável",
  "date": "2025-01-20",
  "start_time": "09:00",
  "end_time": "10:00",
  "participants": "Lista de participantes"
}
```

#### `DELETE /api/appointments/:id`
Remove um agendamento.

## 🎨 Interface

A interface foi desenvolvida com design moderno e responsivo, incluindo:
- Logo da empresa Belz Corretora de Seguros
- Imagem da sala de reunião
- Navegação por datas
- Grade de horários disponíveis/ocupados
- Modal para agendamento
- Botão flutuante para nova reunião

## 🔒 Segurança

- Validação de conflitos de horários
- Sanitização de dados de entrada
- Uso de variáveis de ambiente para credenciais
- CORS configurado adequadamente

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona perfeitamente em:
- Desktop
- Tablets
- Smartphones

## 🐛 Solução de Problemas

### Erro 404 na Vercel
Certifique-se de que:
1. As variáveis de ambiente estão configuradas
2. O `vercel.json` está correto
3. O build do frontend está sendo gerado corretamente

### Problemas de CORS
Verifique se o CORS está habilitado no backend e se as origens estão corretas.

### Problemas de conexão com Supabase
1. Verifique se as credenciais estão corretas
2. Confirme se a tabela `appointments` existe
3. Verifique as políticas de segurança (RLS) no Supabase

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

---

Desenvolvido para **Belz Corretora de Seguros** 🏢
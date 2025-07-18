# 📅 Sistema de Agendamento de Sala de Reunião - Belz Corretora

Sistema web moderno para agendamento de sala de reunião, desenvolvido com React e Node.js, integrado ao Supabase.

## 🚀 Funcionalidades

- **Visualização de horários** - Grade visual de 30 em 30 minutos (8h às 18h)
- **Agendamento intuitivo** - Clique no horário desejado para agendar
- **Detecção de conflitos** - Impede agendamentos sobrepostos
- **Interface responsiva** - Funciona em desktop, tablet e mobile
- **Navegação de datas** - Visualize disponibilidade de diferentes dias
- **Integração em tempo real** - Dados sincronizados com Supabase

## 🛠️ Tecnologias

### Frontend
- **React 19** - Interface de usuário
- **Tailwind CSS** - Estilização moderna
- **Axios** - Requisições HTTP
- **Craco** - Configuração personalizada

### Backend
- **Node.js** - Servidor
- **Express** - Framework web
- **Supabase** - Banco de dados e autenticação
- **CORS** - Compartilhamento de recursos

### Deploy
- **Vercel** - Hospedagem e deploy automático
- **Serverless Functions** - API escalável

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no Supabase
- Conta na Vercel (opcional, para deploy)

## ⚙️ Configuração

### 1. Instalação
```bash
# Instalar dependências do projeto
npm run install-all
```

### 2. Configuração do Banco de Dados
Execute o SQL do arquivo `create-table.sql` no seu projeto Supabase:

```sql
-- Criar tabela de agendamentos
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  participants TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (desenvolvimento)
CREATE POLICY "Enable all operations for appointments" ON appointments
FOR ALL USING (true);
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_anon_do_supabase

# Configurações do servidor
PORT=3001
NODE_ENV=development

# Frontend
REACT_APP_SUPABASE_URL=sua_url_do_supabase
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sua_chave_anon_do_supabase
```

> ⚠️ **Importante**: Nunca commite o arquivo `.env` no Git. Use apenas a chave **anon (public)** do Supabase.

## 🚦 Como Executar

### Desenvolvimento Local
```bash
# Iniciar backend e frontend simultaneamente
npm run dev

# Ou iniciar separadamente:
npm start              # Backend (porta 3001)
cd frontend && npm start  # Frontend (porta 3000)
```

### Build de Produção
```bash
npm run build
```

### Testes
```bash
npm run test-connection
```

## 📁 Estrutura do Projeto

```
saladereuniaobelz/
├── api/                 # Backend Node.js
│   ├── index.js         # Servidor principal
│   └── vercel.js        # Adaptador Vercel
├── frontend/            # Frontend React
│   ├── src/
│   │   ├── App.js       # Componente principal
│   │   ├── config.js    # Configurações
│   │   └── useApi.js    # Hook personalizado para API
│   └── build/           # Build de produção
├── create-table.sql     # Script SQL da tabela
├── package.json         # Dependências principais
├── vercel.json         # Configuração Vercel
└── .env                # Variáveis de ambiente (não versionado)
```

## 🌐 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente no dashboard da Vercel
3. Deploy automático a cada push na branch main

### Variáveis de Ambiente na Vercel
```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_anon_do_supabase
```

## 📱 Como Usar

1. **Selecionar Data**: Use as setas para navegar entre os dias
2. **Visualizar Disponibilidade**: 
   - ✅ Verde = Horário livre
   - 🔴 Vermelho = Horário ocupado
3. **Fazer Agendamento**: Clique em um horário livre e preencha o formulário
4. **Confirmar**: O sistema verifica conflitos automaticamente

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o backend
- `npm run dev` - Inicia backend + frontend
- `npm run build` - Build de produção
- `npm run install-all` - Instala todas as dependências
- `npm run test-connection` - Testa conexão com Supabase

## 📄 Licença

Este projeto é propriedade da **Belz Corretora de Seguros**.

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Faça commit das suas alterações
4. Abra um Pull Request

---

**Desenvolvido com ❤️ para Belz Corretora de Seguros**

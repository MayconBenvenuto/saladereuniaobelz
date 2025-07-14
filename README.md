# Sistema de Agendamento de Sala de Reunião Belz

Este projeto é uma aplicação completa para gerenciamento de reservas de salas de reunião, composta por um backend em Python (FastAPI) e um frontend em React. O objetivo é facilitar o agendamento, consulta e remoção de reservas, garantindo horários disponíveis e evitando conflitos.

## Funcionalidades

- Cadastro de agendamentos de sala
- Consulta de horários disponíveis e agendados
- Remoção de agendamentos
- Prevenção automática de conflitos de horário
- Interface web moderna e responsiva

## Arquitetura

**Backend:**
- FastAPI (Python)
- Banco de dados SQLite
- API RESTful

**Frontend:**
- React (Create React App)
- Tailwind CSS para estilização

## Como Executar

### Backend
1. Acesse a pasta `backend`.
2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicie o servidor:
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8001
   ```

### Frontend
1. Acesse a pasta `frontend`.
2. Instale as dependências:
   ```bash
   yarn install
   ```
3. Inicie o frontend:
   ```bash
   yarn start
   ```
4. Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
saladereuniaobelz/
├── backend/           # Backend FastAPI
├── frontend/          # Frontend React
├── backend_test.py    # Testes automatizados da API
├── test_result.md     # Resultados e protocolo de testes
└── tests/             # Inicialização de testes
```

## Testes

O backend possui testes automatizados em `backend_test.py`, que validam os principais endpoints da API.

## Observações

- O sistema não possui autenticação.
- O banco de dados é SQLite (ideal para testes e uso local).
- Recomenda-se documentar e customizar o frontend conforme as necessidades do negócio.

---
Desenvolvido por Maycon Benvenuto

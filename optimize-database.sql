-- Arquivo: optimize-database.sql
-- Script para otimizar o banco de dados e resolver problemas de timeout

-- 1. Criar índice na coluna 'date' para acelerar consultas por data
-- Este é o índice mais importante para sua aplicação
CREATE INDEX IF NOT EXISTS idx_agendamentos_date 
ON agendamentos (date);

-- 2. Criar índice composto para consultas de disponibilidade
-- Acelera consultas que filtram por data e ordenam por start_time
CREATE INDEX IF NOT EXISTS idx_agendamentos_date_start_time 
ON agendamentos (date, start_time);

-- 3. Criar índice no start_time para ordenação rápida
CREATE INDEX IF NOT EXISTS idx_agendamentos_start_time 
ON agendamentos (start_time);

-- 4. Atualizar estatísticas da tabela (PostgreSQL específico)
ANALYZE agendamentos;

-- 5. Verificar se os índices foram criados com sucesso
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'agendamentos'
ORDER BY indexname;

-- 6. Verificar o tamanho da tabela e performance
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'agendamentos';

/* 
INSTRUÇÕES PARA EXECUTAR:

1. Acesse o SQL Editor do Supabase (https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql)
2. Cole este código SQL completo
3. Clique em "Run" para executar
4. Verifique se os índices foram criados consultando a saída do script

EXPLICAÇÃO DOS ÍNDICES:

- idx_agendamentos_date: Acelera a consulta WHERE date = '2024-01-01'
- idx_agendamentos_date_start_time: Acelera consultas que filtram por data E ordenam por horário
- idx_agendamentos_start_time: Acelera ordenação por start_time

Estes índices vão reduzir significativamente o tempo de resposta das suas consultas,
especialmente conforme a tabela cresce em tamanho.
*/

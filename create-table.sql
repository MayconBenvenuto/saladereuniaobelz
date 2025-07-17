-- ========================================
-- SCRIPT SQL PARA CRIAR TABELA APPOINTMENTS
-- Execute este código no SQL Editor do Supabase
-- ========================================

-- 1. Criar a tabela appointments
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

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para permitir todas as operações (desenvolvimento)
CREATE POLICY "Enable all operations for appointments" ON appointments
FOR ALL USING (true);

-- 4. Inserir dados de teste (opcional)
INSERT INTO appointments (title, description, name, date, start_time, end_time, participants) VALUES
('Reunião de Teste', 'Teste do sistema de agendamento', 'Sistema', '2025-07-17', '09:00:00', '10:00:00', 'Equipe de desenvolvimento'),
('Reunião Comercial', 'Apresentação de produtos', 'João Silva', '2025-07-18', '14:00:00', '15:30:00', 'Cliente XYZ, Gerente de Vendas');

-- 5. Verificar se a tabela foi criada corretamente
SELECT * FROM appointments;

-- 6. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

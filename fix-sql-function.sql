-- Função SQL corrigida para criar agendamento de forma atômica
-- Execute este comando no SQL Editor do Supabase para corrigir o erro de ambiguidade

-- Primeiro, remover a função existente se houver
DROP FUNCTION IF EXISTS create_appointment_safe(TEXT, TEXT, TEXT, DATE, TIME, TIME);

-- Criar nova função com referências de coluna corrigidas
CREATE OR REPLACE FUNCTION create_appointment_safe(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_name TEXT,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conflict_count INTEGER;
  new_appointment JSON;
BEGIN
  -- Verificar conflitos de horário em uma única query (corrigindo ambiguidade)
  SELECT COUNT(*)
  INTO conflict_count
  FROM appointments a
  WHERE a.date = p_date
    AND (
      (p_start_time >= a.start_time AND p_start_time < a.end_time) OR
      (p_end_time > a.start_time AND p_end_time <= a.end_time) OR
      (p_start_time <= a.start_time AND p_end_time >= a.end_time)
    );
  
  -- Se houver conflito, retornar erro
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Horário já ocupado por outro agendamento'
      USING ERRCODE = 'P0001';
  END IF;
  
  -- Criar o agendamento
  INSERT INTO appointments (title, description, name, date, start_time, end_time)
  VALUES (p_title, p_description, p_name, p_date, p_start_time, p_end_time)
  RETURNING row_to_json(appointments.*) INTO new_appointment;
  
  RETURN new_appointment;
END;
$$;

-- Testar a função
SELECT create_appointment_safe(
  'Teste Função',
  'Descrição teste',
  'Sistema',
  '2025-07-18',
  '16:00:00',
  '17:00:00'
);

-- Função SQL para criar agendamento de forma atômica (verificar + criar em uma transação)
-- Execute este comando no SQL Editor do Supabase para otimizar o backend

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
  -- Verificar conflitos de horário em uma única query
  SELECT COUNT(*)
  INTO conflict_count
  FROM appointments
  WHERE date = p_date
    AND (
      (p_start_time >= start_time AND p_start_time < end_time) OR
      (p_end_time > start_time AND p_end_time <= end_time) OR
      (p_start_time <= start_time AND p_end_time >= end_time)
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

-- Criar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_appointments_date_time 
ON appointments (date, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_appointments_date 
ON appointments (date);

-- Função SQL otimizada para criar agendamento com verificação atômica
-- Esta função deve ser executada no Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_appointment_safe(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_name TEXT,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS TABLE(
  id BIGINT,
  title TEXT,
  description TEXT,
  name TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se há conflitos (operação atômica)
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE date = p_date 
    AND (
      (p_start_time >= start_time AND p_start_time < end_time) OR
      (p_end_time > start_time AND p_end_time <= end_time) OR
      (p_start_time <= start_time AND p_end_time >= end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Horário já ocupado por outro agendamento.';
  END IF;

  -- Inserir novo agendamento
  RETURN QUERY
  INSERT INTO appointments (title, description, name, date, start_time, end_time)
  VALUES (p_title, p_description, p_name, p_date, p_start_time, p_end_time)
  RETURNING 
    appointments.id,
    appointments.title,
    appointments.description,
    appointments.name,
    appointments.date,
    appointments.start_time,
    appointments.end_time,
    appointments.created_at;
END;
$$;

-- Função para buscar apenas agendamentos ocupados (mais eficiente)
CREATE OR REPLACE FUNCTION get_occupied_slots(p_date DATE)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  title TEXT,
  start_time TIME,
  end_time TIME
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    appointments.id,
    appointments.name,
    appointments.title,
    appointments.start_time,
    appointments.end_time
  FROM appointments
  WHERE appointments.date = p_date
  ORDER BY appointments.start_time ASC;
END;
$$;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointments_date_time 
ON appointments (date, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_appointments_date 
ON appointments (date);

-- Grants de segurança (ajustar conforme necessário)
GRANT EXECUTE ON FUNCTION create_appointment_safe TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_occupied_slots TO anon, authenticated;

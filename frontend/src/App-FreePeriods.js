import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css'; // Usando o CSS original
import { config, logDebug, logError } from './config';
import { useApi } from './useApi';

// Função para detectar se estamos offline
const isOnline = () => {
  return navigator.onLine;
};

// Cache simples para armazenar dados de agendamentos
const CACHE_KEY = 'meeting_room_cache';

const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const maxAge = isOnline() ? config.CACHE_DURATION : config.CACHE_DURATION_OFFLINE;
      if (Date.now() - timestamp < maxAge) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cache:', e);
  }
  return null;
};

const setToCache = (key, data) => {
  try {
    localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Erro ao salvar cache:', e);
  }
};

// Função para converter minutos desde o início do dia em hora legível
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// Função para converter hora em minutos desde o início do dia
const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  
  // Suporta tanto HH:MM quanto HH:MM:SS
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0]) || 0;
  const minutes = parseInt(timeParts[1]) || 0;
  // Ignora segundos se existir
  
  return hours * 60 + minutes;
};

// Função para gerar períodos de 30 minutos (como antes) mas com lógica flexível
const generateTimeSlots = (appointments, startHour = 8, endHour = 18, slotDuration = 30) => {
  const slots = [];
  
  console.log('[DEBUG] Gerando slots com agendamentos:', appointments);
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += slotDuration) {
      const start = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const endMin = min + slotDuration;
      let endHourSlot = hour;
      let endMinSlot = endMin;

      if (endMin >= 60) {
        endHourSlot++;
        endMinSlot = endMin - 60;
      }

      const end = `${String(endHourSlot).padStart(2, '0')}:${String(endMinSlot).padStart(2, '0')}`;

      // Verificar se há conflito com agendamentos (lógica flexível)
      const conflictingAppointment = appointments.find(appt => {
        const slotStart = timeToMinutes(start);
        const slotEnd = timeToMinutes(end);
        const apptStart = timeToMinutes(appt.start_time);
        const apptEnd = timeToMinutes(appt.end_time);
        
        console.log(`[DEBUG] Comparando slot ${start}-${end} (${slotStart}-${slotEnd}) com agendamento ${appt.start_time}-${appt.end_time} (${apptStart}-${apptEnd})`);
        
        const hasConflict = (
          (slotStart >= apptStart && slotStart < apptEnd) ||
          (slotEnd > apptStart && slotEnd <= apptEnd) ||
          (slotStart <= apptStart && slotEnd >= apptEnd)
        );
        
        if (hasConflict) {
          console.log(`[DEBUG] ✅ Conflito encontrado: slot ${start}-${end} ocupado por "${appt.title}"`);
        }
        
        return hasConflict;
      });

      slots.push({
        start_time: start,
        end_time: end,
        available: !conflictingAppointment,
        appointment: conflictingAppointment || null
      });
    }
  }

  console.log('[DEBUG] Slots gerados:', slots.length, 'total');
  console.log('[DEBUG] Slots ocupados:', slots.filter(s => !s.available).length);
  
  return slots;
};

// Componente BookingModal com design original
const BookingModal = ({ isOpen, onClose, selectedSlot, onConfirm, preSelectedRoom = 'grande' }) => {
  const [form, setForm] = useState({
    name: '',
    title: '',
    participants: '',
    description: '',
    sala: preSelectedRoom,
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    if (selectedSlot && isOpen) {
      setForm(prev => ({
        ...prev,
        sala: preSelectedRoom,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time
      }));
    }
  }, [selectedSlot, isOpen, preSelectedRoom]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    if (!form.title.trim()) {
      alert('Título da reunião é obrigatório');
      return;
    }
    if (!form.start_time || !form.end_time) {
      alert('Horários são obrigatórios');
      return;
    }
    if (form.start_time >= form.end_time) {
      alert('Horário de fim deve ser posterior ao horário de início');
      return;
    }
    
    onConfirm({
      name: form.name.trim(),
      title: form.title.trim(),
      participants: form.participants.trim(),
      description: form.description.trim(),
      sala: form.sala,
      start_time: form.start_time,
      end_time: form.end_time
    });
  };

  if (!isOpen || !selectedSlot) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Agendar Reunião</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="booking-form">
          <div className="form-group">
            <label>Horário Selecionado</label>
            <div style={{ 
              padding: '0.8rem', 
              background: '#e8f5e8', 
              borderRadius: '8px', 
              fontWeight: '600',
              color: '#2d5a3d'
            }}>
              {selectedSlot.start_time} - {selectedSlot.end_time}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome do Responsável *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Digite seu nome"
              />
            </div>

            <div className="form-group">
              <label>Título da Reunião *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Ex: Reunião de Vendas"
              />
            </div>

            <div className="form-group">
              <label>Participantes</label>
              <textarea
                value={form.participants}
                onChange={(e) => setForm(prev => ({ ...prev, participants: e.target.value }))}
                placeholder="Lista de participantes (opcional)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Descrição da Reunião</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva brevemente o assunto da reunião (opcional)"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Sala de Reunião *</label>
              <select
                value={form.sala}
                onChange={(e) => setForm(prev => ({ ...prev, sala: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="grande">🏢 Sala de Reunião Grande</option>
                <option value="pequena">🏠 Sala de Reunião Pequena</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Horário de Início *</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Horário de Término *</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancelar
              </button>
              <button type="submit" className="submit-button">
                Confirmar Agendamento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente EditModal para editar agendamentos
const EditModal = ({ isOpen, onClose, appointment, onConfirm }) => {
  const [form, setForm] = useState({
    name: '',
    title: '',
    participants: '',
    description: '',
    sala: 'grande',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    if (appointment && isOpen) {
      setForm({
        name: appointment.name || '',
        title: appointment.title || '',
        participants: appointment.participants || '',
        description: appointment.description || '',
        sala: appointment.sala || 'grande',
        start_time: appointment.start_time || '',
        end_time: appointment.end_time || ''
      });
    }
  }, [appointment, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    if (!form.title.trim()) {
      alert('Título da reunião é obrigatório');
      return;
    }
    if (!form.start_time || !form.end_time) {
      alert('Horários são obrigatórios');
      return;
    }
    if (form.start_time >= form.end_time) {
      alert('Horário de fim deve ser posterior ao horário de início');
      return;
    }
    
    onConfirm({
      name: form.name.trim(),
      title: form.title.trim(),
      participants: form.participants.trim(),
      description: form.description.trim(),
      sala: form.sala,
      start_time: form.start_time,
      end_time: form.end_time
    });
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Editar Agendamento</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="booking-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome do Responsável *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Digite seu nome"
              />
            </div>

            <div className="form-group">
              <label>Título da Reunião *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Ex: Reunião de Vendas"
              />
            </div>

            <div className="form-group">
              <label>Participantes</label>
              <textarea
                value={form.participants}
                onChange={(e) => setForm(prev => ({ ...prev, participants: e.target.value }))}
                placeholder="Lista de participantes (opcional)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Descrição da Reunião</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva brevemente o assunto da reunião (opcional)"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Sala de Reunião *</label>
              <select
                value={form.sala}
                onChange={(e) => setForm(prev => ({ ...prev, sala: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="grande">🏢 Sala de Reunião Grande</option>
                <option value="pequena">🏠 Sala de Reunião Pequena</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Horário de Início *</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Horário de Término *</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancelar
              </button>
              <button type="submit" className="submit-button">
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente principal
const AppFreePeriods = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState('todas'); // Estado para sala selecionada
  const [appointments, setAppointments] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [success, setSuccess] = useState(null);
  const [slotsConfig, setSlotsConfig] = useState({
    start_hour: 8,
    end_hour: 20,
    slot_duration: 30
  });
  
  // Hook personalizado para API
  const { loading, error, request, setError } = useApi();

  // Format date for API calls
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show success message
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Show error message
  const showError = (message) => {
    setError(message);
  };

  // Gerar slots com a nova lógica flexível
  const timeSlots = useMemo(() => {
    const { start_hour, end_hour, slot_duration } = slotsConfig;
    // Filtrar agendamentos por sala se uma sala específica estiver selecionada
    const filteredAppointments = selectedRoom === 'todas' 
      ? appointments 
      : appointments.filter(app => app.sala === selectedRoom);
    
    return generateTimeSlots(filteredAppointments, start_hour, end_hour, slot_duration);
  }, [appointments, slotsConfig, selectedRoom]);

  // Carregar configuração de slots do backend
  const loadSlotsConfig = useCallback(async () => {
    const dateStr = formatDateForAPI(selectedDate);
    
    try {
      logDebug(`Carregando configuração de slots para: ${dateStr}`);
      
      const data = await request(`${config.API_BASE_URL}/api/availability/${dateStr}`, {
        method: 'GET'
      });
      
      // Atualizar configuração se vier do backend
      if (data && data.slots_config) {
        setSlotsConfig(data.slots_config);
        logDebug('Configuração de slots atualizada:', data.slots_config);
      }
      
    } catch (error) {
      logError('Erro ao carregar configuração de slots:', error);
      // Manter configuração padrão em caso de erro
    }
  }, [selectedDate, request]);

  // Carregar agendamentos do dia
  const loadAppointments = useCallback(async () => {
    const dateStr = formatDateForAPI(selectedDate);
    
    // Verificar cache primeiro
    const cached = getFromCache(dateStr);
    if (cached) {
      setAppointments(cached);
      logDebug('Dados carregados do cache para:', dateStr);
      return;
    }
    
    try {
      logDebug(`Carregando agendamentos para: ${dateStr}`);
      
      const data = await request(`${config.API_BASE_URL}/api/appointments?date=${dateStr}`, {
        method: 'GET'
      });
      
      logDebug(`Dados recebidos para ${dateStr}:`, data);
      
      const appointmentsList = Array.isArray(data) ? data : [];
      console.log('[DEBUG] Appointments processados:', appointmentsList);
      setAppointments(appointmentsList);
      
      // Salvar no cache
      setToCache(dateStr, appointmentsList);
      
    } catch (error) {
      logError('Erro ao carregar agendamentos:', error);
      
      // Tentar usar dados em cache mesmo se expirado
      const expiredCache = localStorage.getItem(`${CACHE_KEY}_${dateStr}`);
      if (expiredCache) {
        try {
          const { data } = JSON.parse(expiredCache);
          setAppointments(data || []);
          showError('Usando dados em cache (pode estar desatualizado).');
        } catch {
          setAppointments([]);
          showError('Erro de conexão. Não foi possível carregar os dados.');
        }
      } else {
        setAppointments([]);
        showError('Erro de conexão. Tente novamente.');
      }
    }
  }, [selectedDate, request]);

  // Carregar agendamentos e configuração quando a data muda
  useEffect(() => {
    loadSlotsConfig();
    loadAppointments();
  }, [loadSlotsConfig, loadAppointments]);

  // Verificar se a imagem está acessível
  useEffect(() => {
    console.log('Verificando acesso à imagem...');
  }, []);

  // Manipular seleção de slot
  const handleSlotClick = (slot) => {
    if (slot.available) {
      setSelectedSlot(slot);
      setShowBookingModal(true);
    }
  };

  // Criar novo agendamento
  const handleCreateAppointment = async (formData) => {
    try {
      const appointmentData = {
        name: formData.name,
        title: formData.title,
        participants: formData.participants,
        description: formData.description,
        sala: formData.sala,
        date: formatDateForAPI(selectedDate),
        start_time: formData.start_time,
        end_time: formData.end_time
      };

      logDebug('Criando agendamento:', appointmentData);

      await request(`${config.API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      showSuccess('Agendamento criado com sucesso!');
      setShowBookingModal(false);
      setSelectedSlot(null);
      
      // Limpar cache ANTES de recarregar
      const dateStr = formatDateForAPI(selectedDate);
      localStorage.removeItem(`${CACHE_KEY}_${dateStr}`);
      
      // Forçar reload completo dos agendamentos com cache busting
      console.log('[DEBUG] Recarregando agendamentos após criação...');
      
      // Fazer requisição direta sem cache para garantir dados atualizados
      try {
        const cacheBuster = Date.now();
        const freshData = await request(`${config.API_BASE_URL}/api/appointments?date=${dateStr}&_cb=${cacheBuster}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('[DEBUG] Dados frescos recebidos:', freshData);
        const appointmentsList = Array.isArray(freshData) ? freshData : [];
        setAppointments(appointmentsList);
        
      } catch (reloadError) {
        console.error('[DEBUG] Erro ao recarregar, tentando método normal:', reloadError);
        await loadAppointments();
      }
      
    } catch (error) {
      logError('Erro ao criar agendamento:', error);
      showError('Erro ao criar agendamento. Tente novamente.');
    }
  };

  // Editar agendamento
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setSelectedSlot({
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      available: false
    });
    setShowEditModal(true);
  };

  // Salvar edição do agendamento
  const handleSaveEdit = async (formData) => {
    try {
      const updatedData = {
        ...formData,
        date: formatDateForAPI(selectedDate)
      };

      logDebug('Atualizando agendamento:', updatedData);

      await request(`${config.API_BASE_URL}/api/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      setShowEditModal(false);
      setEditingAppointment(null);
      setSelectedSlot(null);
      
      setSuccess('Agendamento atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);

      // Recarregar dados
      await loadAppointments();
      
    } catch (error) {
      logError('Erro ao atualizar agendamento:', error);
      showError('Erro ao atualizar agendamento. Tente novamente.');
    }
  };

  // Cancelar agendamento
  const handleCancelAppointment = async (appointmentId, appointmentTitle) => {
    const confirmed = window.confirm(`Tem certeza que deseja cancelar o agendamento "${appointmentTitle}"?`);
    
    if (!confirmed) return;

    try {
      logDebug('Cancelando agendamento:', appointmentId);

      await request(`${config.API_BASE_URL}/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      });

      setSuccess('Agendamento cancelado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);

      // Recarregar dados
      await loadAppointments();
      
    } catch (error) {
      logError('Erro ao cancelar agendamento:', error);
      showError('Erro ao cancelar agendamento. Tente novamente.');
    }
  };

  // Navegar entre datas
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  return (
    <div className="app">
      {/* Header com design original */}
      <div className="header">
        <div className="header-content">
          <div className="logo-container">
            <img 
              src="/logo-belz.png" 
              alt="Belz Logo" 
              className="logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h1>Agende sua Reunião</h1>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="main-content">
        {/* Status de conexão */}
        {!isOnline() && (
          <div className="notification error" style={{ position: 'relative', marginBottom: '1rem' }}>
            ⚠️ Modo offline - Dados podem estar desatualizados
          </div>
        )}

        {/* Navegação de datas */}
        <div className="date-navigation">
          <button 
            className="nav-button" 
            onClick={() => navigateDate(-1)}
            disabled={loading}
          >
            ‹
          </button>
          
          <div className="current-date">
            <h2>{formatDateForDisplay(selectedDate)}</h2>
            <input
              type="date"
              value={formatDateForAPI(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              style={{
                padding: '0.5rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <button 
            className="nav-button" 
            onClick={() => navigateDate(1)}
            disabled={loading}
          >
            ›
          </button>
        </div>

        {/* Seletor de Sala */}
        <div style={{ 
          margin: '1rem 0', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#333'
          }}>
            Filtrar por Sala:
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="todas">🏢🏠 Todas as Salas</option>
            <option value="grande">🏢 Sala de Reunião Grande</option>
            <option value="pequena">🏠 Sala de Reunião Pequena</option>
          </select>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            Carregando agendamentos...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="notification error" style={{ position: 'relative', marginBottom: '1rem' }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="notification success" style={{ position: 'relative', marginBottom: '1rem' }}>
            <span>✅ {success}</span>
          </div>
        )}

        {/* Lista de agendamentos do dia */}
        {appointments.filter(app => selectedRoom === 'todas' || app.sala === selectedRoom).length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#2a5298' }}>
              Agendamentos do Dia ({appointments.filter(app => selectedRoom === 'todas' || app.sala === selectedRoom).length})
              {selectedRoom !== 'todas' && (
                <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666', marginLeft: '0.5rem' }}>
                  - {selectedRoom === 'grande' ? 'Sala Grande' : 'Sala Pequena'}
                </span>
              )}
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1rem' 
            }}>
              {appointments
                .filter(app => selectedRoom === 'todas' || app.sala === selectedRoom)
                .map((appointment) => (
                <div 
                  key={appointment.id} 
                  style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#2a5298' }}>
                    {appointment.title}
                  </h4>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>Horário:</strong> {appointment.start_time} - {appointment.end_time}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>Responsável:</strong> {appointment.name}
                  </p>
                  {appointment.participants && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                      <strong>Participantes:</strong> {appointment.participants}
                    </p>
                  )}
                  {appointment.description && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                      <strong>Descrição:</strong> {appointment.description}
                    </p>
                  )}
                  {appointment.sala && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                      <strong>Sala:</strong> {appointment.sala === 'grande' ? '🏢 Sala Grande' : '🏠 Sala Pequena'}
                    </p>
                  )}
                  
                  {/* Botões de ação */}
                  <div style={{ 
                    marginTop: '1rem', 
                    display: 'flex', 
                    gap: '0.5rem',
                    borderTop: '1px solid #eee',
                    paddingTop: '0.75rem'
                  }}>
                    <button
                      onClick={() => handleEditAppointment(appointment)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleCancelAppointment(appointment.id, appointment.title)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                    >
                      🗑️ Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grade de horários com design original */}
        <div className="calendar-container">
          <div className="time-slots">
            {timeSlots.map((slot, index) => (
              <div
                key={index}
                className={`time-slot ${slot.available ? 'available' : 'occupied'}`}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="time-range">
                  {slot.start_time} - {slot.end_time}
                </div>
                {slot.available ? (
                  <div className="slot-status">Disponível</div>
                ) : (
                  <div className="appointment-info">
                    <div className="appointment-title">{slot.appointment.title}</div>
                    <div className="appointment-name">{slot.appointment.name}</div>
                    {slot.appointment.participants && (
                      <div className="appointment-participants" style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                        👥 {slot.appointment.participants}
                      </div>
                    )}
                    {slot.appointment.sala && (
                      <div className="appointment-room" style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                        {slot.appointment.sala === 'grande' ? '🏢 Sala Grande' : '🏠 Sala Pequena'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de agendamento */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedSlot(null);
        }}
        selectedSlot={selectedSlot}
        onConfirm={handleCreateAppointment}
        preSelectedRoom={selectedRoom !== 'todas' ? selectedRoom : 'grande'}
      />

      {/* Modal de edição */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAppointment(null);
          setSelectedSlot(null);
        }}
        appointment={editingAppointment}
        onConfirm={handleSaveEdit}
      />
    </div>
  );
};

export default AppFreePeriods;

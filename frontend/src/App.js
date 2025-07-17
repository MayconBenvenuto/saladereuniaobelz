import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App-mobile.css';
import { config, logDebug, logError } from './config';
import { useApi } from './useApi';

// Função para detectar se estamos offline
const isOnline = () => {
  return navigator.onLine;
};

// Cache simples para armazenar dados de disponibilidade
const CACHE_KEY = 'meeting_room_cache';

const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Se offline, aceitar cache mais antigo
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

const App = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [slotsConfig, setSlotsConfig] = useState({
    start_hour: 8,
    end_hour: 18,
    slot_duration: 30
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [success, setSuccess] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    title: '',
    participants: '',
    start_time: '',
    end_time: ''
  });
  
  // Hook personalizado para API
  const { loading, error, request, setError, connectionStatus, isOnline } = useApi();

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

  // Format time for display
  const formatTimeForDisplay = (timeString) => {
    return timeString.slice(0, 5);
  };

  // Show success message
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Função para mostrar erro usando o hook
  const showError = (message) => {
    setError(message);
  };

  // Gerar slots otimizado usando useMemo para cache
  const generateSlots = useMemo(() => {
    const slots = [];
    const { start_hour, end_hour, slot_duration } = slotsConfig;

    for (let hour = start_hour; hour < end_hour; hour++) {
      for (let min = 0; min < 60; min += slot_duration) {
        const start = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const endMin = min + slot_duration;
        let endHourSlot = hour;
        let endMinSlot = endMin;

        if (endMin >= 60) {
          endHourSlot++;
          endMinSlot = endMin - 60;
        }

        const end = `${String(endHourSlot).padStart(2, '0')}:${String(endMinSlot).padStart(2, '0')}`;

        // Verificar se há conflito com agendamentos
        const isOccupied = occupiedSlots.some(appointment =>
          (start >= appointment.start_time && start < appointment.end_time) ||
          (end > appointment.start_time && end <= appointment.end_time) ||
          (start <= appointment.start_time && end >= appointment.end_time)
        );

        const appointment = occupiedSlots.find(appt =>
          (start >= appt.start_time && start < appt.end_time) ||
          (end > appt.start_time && end <= appt.end_time) ||
          (start <= appt.start_time && end >= appt.end_time)
        );

        slots.push({
          start_time: start,
          end_time: end,
          available: !isOccupied,
          appointment: appointment || null
        });
      }
    }

    return slots;
  }, [occupiedSlots, slotsConfig]);

  // Load availability otimizado com cache e retry
  const loadAvailability = useCallback(async () => {
    const dateStr = formatDateForAPI(selectedDate);
    
    // Verificar cache primeiro
    const cached = getFromCache(dateStr);
    if (cached) {
      setOccupiedSlots(cached);
      logDebug('Dados carregados do cache para:', dateStr);
      return;
    }
    
    try {
      logDebug(`Carregando disponibilidade para: ${dateStr}`);
      
      const data = await request(`${config.API_BASE_URL}/api/occupied-slots/${dateStr}`, {
        method: 'GET'
      });
      
      logDebug(`Dados recebidos para ${dateStr}:`, data);
      
      // Processar apenas agendamentos ocupados
      const occupied = Array.isArray(data) ? data : [];
      setOccupiedSlots(occupied);
      
      // Salvar no cache
      setToCache(dateStr, occupied);
      
    } catch (error) {
      logError('Erro ao carregar disponibilidade:', error);
      
      // Tentar usar dados em cache mesmo se expirado
      const expiredCache = localStorage.getItem(`${CACHE_KEY}_${dateStr}`);
      if (expiredCache) {
        try {
          const { data } = JSON.parse(expiredCache);
          setOccupiedSlots(data || []);
          showError('Usando dados em cache (pode estar desatualizado).');
        } catch {
          setOccupiedSlots([]);
          showError('Erro de conexão. Não foi possível carregar os dados.');
        }
      } else {
        setOccupiedSlots([]);
        if (error.includes('timeout') || error.includes('Timeout')) {
          showError('Timeout na conexão. Tente novamente.');
        } else {
          showError('Erro de conexão. Tente novamente.');
        }
      }
    }
  }, [selectedDate, request]);

  // Load availability when date changes
  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Pre-fetch próximos dias para navegação rápida (desabilitado temporariamente)
  useEffect(() => {
    // Comentado temporariamente para reduzir carga na API
    /*
    const prefetchDays = async () => {
      const today = new Date(selectedDate);
      const promises = [];
      
      // Prefetch próximos 3 dias
      for (let i = 1; i <= 3; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i);
        const dateStr = formatDateForAPI(nextDay);
        
        // Só prefetch se não estiver em cache
        if (!getFromCache(dateStr)) {
          promises.push(
            fetch(`${API_BASE_URL}/api/occupied-slots/${dateStr}`)
              .then(res => res.json())
              .then(data => setToCache(dateStr, data))
              .catch(() => {}) // Ignorar erros de prefetch
          );
        }
      }
      
      await Promise.all(promises);
    };
    
    // Prefetch após 5 segundos para não atrapalhar carregamento inicial
    const timeoutId = setTimeout(prefetchDays, 5000);
    return () => clearTimeout(timeoutId);
    */
  }, [selectedDate]);

  // Handle date navigation
  const navigateDate = useCallback((direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  }, [selectedDate]);

  // Handle slot selection
  const handleSlotClick = useCallback((slot) => {
    if (slot.available) {
      setSelectedSlot(slot);
      setBookingForm({
        ...bookingForm,
        start_time: slot.start_time.slice(0, 5),
        end_time: slot.end_time.slice(0, 5)
      });
      setShowBookingModal(true);
    }
  }, [bookingForm]);

  // Validate booking form
  const validateForm = () => {
    if (!bookingForm.name.trim()) {
      showError('Nome é obrigatório');
      return false;
    }
    if (!bookingForm.title.trim()) {
      showError('Título da reunião é obrigatório');
      return false;
    }
    if (!bookingForm.start_time) {
      showError('Horário de início é obrigatório');
      return false;
    }
    if (!bookingForm.end_time) {
      showError('Horário de fim é obrigatório');
      return false;
    }
    if (bookingForm.start_time >= bookingForm.end_time) {
      showError('Horário de fim deve ser posterior ao horário de início');
      return false;
    }
    return true;
  };

  // Handle booking form submission com retry otimizado
  const handleBookingSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const bookingData = {
        name: bookingForm.name.trim(),
        date: formatDateForAPI(selectedDate),
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        title: bookingForm.title.trim(),
        description: bookingForm.participants.trim() || null,
        participants: bookingForm.participants.trim() || null
      };

      await request(`${config.API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      showSuccess('Agendamento realizado com sucesso!');
      setShowBookingModal(false);
      setBookingForm({
        name: '',
        title: '',
        participants: '',
        start_time: '',
        end_time: ''
      });
      
      // Invalidar cache e recarregar
      const dateStr = formatDateForAPI(selectedDate);
      localStorage.removeItem(`${CACHE_KEY}_${dateStr}`);
      setTimeout(() => loadAvailability(), 500);
      
    } catch (error) {
      if (error.includes('timeout') || error.includes('Timeout')) {
        showError('Timeout no agendamento. Verifique sua conexão e tente novamente.');
      } else if (error.includes('409') || error.includes('ocupado')) {
        showError('Horário já foi ocupado por outro usuário. Escolha outro horário.');
      } else {
        showError(error || 'Erro ao agendar reunião. Tente novamente.');
      }
    }
  }, [bookingForm, selectedDate, loadAvailability, request]);

  // Render time slot otimizado com React.memo
  const renderTimeSlot = useCallback((slot, index) => {
    const isAvailable = slot.available;
    const slotClass = isAvailable ? 'time-slot available' : 'time-slot occupied';
    
    return (
      <div
        key={`${slot.start_time}-${slot.end_time}`}
        className={slotClass}
        onClick={() => handleSlotClick(slot)}
        title={!isAvailable ? `${slot.appointment?.title} - ${slot.appointment?.name}` : 'Clique para agendar'}
      >
        <div className="time-range">
          {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
        </div>
        {!isAvailable && slot.appointment && (
          <div className="appointment-info">
            <div className="appointment-title">{slot.appointment.title}</div>
            <div className="appointment-name">{slot.appointment.name}</div>
          </div>
        )}
      </div>
    );
  }, [handleSlotClick]);

  return (
    <div className="app">
      {/* Status de Conexão */}
      {!isOnline && (
        <div className="notification warning" style={{backgroundColor: '#ff9800', color: 'white'}}>
          <span>⚠️ {connectionStatus === 'offline' ? 'Sem conexão' : 'Problema de conexão'}</span>
        </div>
      )}
      
      {/* Notification Messages */}
      {error && (
        <div className="notification error">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {success && (
        <div className="notification success">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <img 
              src="logo-belz.png"
              alt="Belz Corretora de Seguros"
              className="logo"
            />
            <h1>Belz Corretora de Seguros</h1>
          </div>
          <div className="room-image-container">
            <img 
              src="https://images.unsplash.com/photo-1517502884422-41eaead166d4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxjb25mZXJlbmNlJTIwcm9vbXxlbnwwfHx8fDE3NTI1MTU3NjZ8MA&ixlib=rb-4.1.0&q=85"
              alt="Sala de Reunião"
              className="room-image"
            />
            <div className="room-overlay">
              <h2>Sala de Reunião</h2>
              <p>Agendamento de Reuniões</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        {/* Date navigation */}
        <div className="date-navigation">
          <button 
            className="nav-button"
            onClick={() => navigateDate(-1)}
            disabled={loading}
          >
            ←
          </button>
          <h2 className="current-date">{formatDateForDisplay(selectedDate)}</h2>
          <button 
            className="nav-button"
            onClick={() => navigateDate(1)}
            disabled={loading}
          >
            →
          </button>
        </div>

        {/* Calendar/Time slots */}
        <div className="calendar-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              Carregando...
            </div>
          ) : (
            <div className="time-slots">
              {generateSlots.map((slot, index) => renderTimeSlot(slot, index))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <div className="floating-action-button-container">
          <button
            className="floating-action-button"
            onClick={() => setShowBookingModal(true)}
            disabled={loading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Agendar Reunião
          </button>
        </div>
      </main>

      {/* Booking modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Agendar Reunião</h3>
              <button 
                className="close-button"
                onClick={() => setShowBookingModal(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group">
                <label>Nome e Sobrenome *</label>
                <input
                  type="text"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                  placeholder="Digite seu nome completo"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={formatDateForAPI(selectedDate)}
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value + 'T00:00:00'))
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Horário de Início *</label>
                  <input
                    type="time"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({...bookingForm, start_time: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Horário de Fim *</label>
                  <input
                    type="time"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({...bookingForm, end_time: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Título da Reunião *</label>
                <input
                  type="text"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({...bookingForm, title: e.target.value})}
                  placeholder="Ex: Reunião de Vendas"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Participantes (opcional)</label>
                <textarea
                  value={bookingForm.participants}
                  onChange={(e) => setBookingForm({...bookingForm, participants: e.target.value})}
                  placeholder="Liste os participantes da reunião"
                  rows="3"
                  disabled={loading}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowBookingModal(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

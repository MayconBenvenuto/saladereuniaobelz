import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : '';

// Cache simples para armazenar dados de disponibilidade
const CACHE_KEY = 'meeting_room_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    title: '',
    participants: '',
    start_time: '',
    end_time: ''
  });

  // Format date for API calls
  const formatDateForAPI = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);

  // Format date for display
  const formatDateForDisplay = useCallback((date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Format time for display
  const formatTimeForDisplay = useCallback((timeString) => {
    return timeString.slice(0, 5);
  }, []);

  // Show error message
  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  // Show success message
  const showSuccess = useCallback((message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  // Generate time slots from occupied appointments (frontend-only generation)
  const generateTimeSlots = useCallback((occupiedAppointments, config) => {
    const slots = [];
    const { start_hour, end_hour, slot_duration } = config;

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

        // Check if this slot conflicts with any occupied appointment
        const appointment = occupiedAppointments.find(appt =>
          (start >= appt.start_time && start < appt.end_time) ||
          (end > appt.start_time && end <= appt.end_time) ||
          (start <= appt.start_time && end >= appt.end_time)
        );

        slots.push({
          start_time: start,
          end_time: end,
          available: !appointment,
          appointment: appointment ? {
            id: appointment.id,
            name: appointment.name,
            title: appointment.title
          } : null
        });
      }
    }

    return slots;
  }, []);

  // Memoized time slots
  const timeSlots = useMemo(() => {
    return generateTimeSlots(occupiedSlots, slotsConfig);
  }, [occupiedSlots, slotsConfig, generateTimeSlots]);

  // Load availability with retry and cache
  const loadAvailability = useCallback(async (retryCount = 0) => {
    const dateStr = formatDateForAPI(selectedDate);
    
    // Try cache first
    const cached = getFromCache(dateStr);
    if (cached && retryCount === 0) {
      setOccupiedSlots(cached.occupied || []);
      if (cached.slots_config) {
        setSlotsConfig(cached.slots_config);
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${API_BASE_URL}/api/availability/${dateStr}`;
      
      // Timeout aumentado para mobile
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state with optimized data
      setOccupiedSlots(data.occupied || []);
      if (data.slots_config) {
        setSlotsConfig(data.slots_config);
      }
      
      // Cache the result
      setToCache(dateStr, data);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        if (retryCount < 2) {
          console.log(`Timeout, tentando novamente... (${retryCount + 1}/3)`);
          setTimeout(() => loadAvailability(retryCount + 1), 2000);
          return;
        }
        showError('Conexão lenta. Mostrando dados padrão.');
      } else {
        if (retryCount < 2) {
          console.log(`Erro de conexão, tentando novamente... (${retryCount + 1}/3)`);
          setTimeout(() => loadAvailability(retryCount + 1), 2000);
          return;
        }
        showError('Problema de conexão. Mostrando dados padrão.');
      }
      
      // Fallback: use empty occupied slots
      setOccupiedSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, formatDateForAPI, showError]);

  // Pre-fetch adjacent dates for faster navigation
  const prefetchAdjacentDates = useCallback(async () => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(selectedDate.getDate() + 1);
    
    const yesterday = new Date(selectedDate);
    yesterday.setDate(selectedDate.getDate() - 1);
    
    [tomorrow, yesterday].forEach(async (date) => {
      const dateStr = formatDateForAPI(date);
      if (!getFromCache(dateStr)) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/availability/${dateStr}`);
          if (response.ok) {
            const data = await response.json();
            setToCache(dateStr, data);
          }
        } catch (e) {
          // Silent fail for prefetch
        }
      }
    });
  }, [selectedDate, formatDateForAPI]);

  // Load availability when date changes
  useEffect(() => {
    loadAvailability();
    // Prefetch adjacent dates after a short delay
    setTimeout(prefetchAdjacentDates, 1000);
  }, [loadAvailability, prefetchAdjacentDates]);

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
  const validateForm = useCallback(() => {
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
  }, [bookingForm, showError]);

  // Handle booking form submission with retry
  const handleBookingSubmit = useCallback(async (e, retryCount = 0) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    
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

      // Timeout aumentado para agendamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage;
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error || `Erro ${response.status}`;
        } catch {
          errorMessage = errorData || `Erro ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      showSuccess('Agendamento realizado com sucesso!');
      setShowBookingModal(false);
      setBookingForm({
        name: '',
        title: '',
        participants: '',
        start_time: '',
        end_time: ''
      });
      
      // Clear cache and reload
      const dateStr = formatDateForAPI(selectedDate);
      localStorage.removeItem(`${CACHE_KEY}_${dateStr}`);
      setTimeout(() => loadAvailability(), 500);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        if (retryCount < 2) {
          showSuccess('Tentando novamente...');
          setTimeout(() => handleBookingSubmit(e, retryCount + 1), 3000);
          return;
        }
        showError('Timeout no agendamento. Verifique sua conexão e tente novamente.');
      } else {
        if (retryCount < 2 && !error.message.includes('ocupado')) {
          showSuccess('Tentando novamente...');
          setTimeout(() => handleBookingSubmit(e, retryCount + 1), 3000);
          return;
        }
        showError(error.message || 'Erro ao agendar reunião.');
      }
    } finally {
      setLoading(false);
    }
  }, [bookingForm, selectedDate, formatDateForAPI, validateForm, showError, showSuccess, loadAvailability]);

  // Render time slot (memoized component would be better, but keeping simple)
  const renderTimeSlot = useCallback((slot, index) => {
    const isAvailable = slot.available;
    const slotClass = isAvailable ? 'time-slot available' : 'time-slot occupied';
    
    return (
      <div
        key={`${slot.start_time}-${slot.end_time}`}
        className={slotClass}
        onClick={() => handleSlotClick(slot)}
        title={!isAvailable ? `${slot.appointment.title} - ${slot.appointment.name}` : 'Clique para agendar'}
      >
        <div className="time-range">
          {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
        </div>
        {!isAvailable && (
          <div className="appointment-info">
            <div className="appointment-title">{slot.appointment.title}</div>
            <div className="appointment-name">{slot.appointment.name}</div>
          </div>
        )}
      </div>
    );
  }, [handleSlotClick, formatTimeForDisplay]);

  return (
    <div className="app">
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
              loading="lazy"
            />
            <h1>Belz Corretora de Seguros</h1>
          </div>
          <div className="room-image-container">
            <img 
              src="https://images.unsplash.com/photo-1517502884422-41eaead166d4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxjb25mZXJlbmNlJTIwcm9vbXxlbnwwfHx8fDE3NTI1MTU3NjZ8MA&ixlib=rb-4.1.0&q=85&w=400"
              alt="Sala de Reunião"
              className="room-image"
              loading="lazy"
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
            aria-label="Dia anterior"
          >
            ←
          </button>
          <h2 className="current-date">{formatDateForDisplay(selectedDate)}</h2>
          <button 
            className="nav-button"
            onClick={() => navigateDate(1)}
            disabled={loading}
            aria-label="Próximo dia"
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
          ) : timeSlots.length > 0 ? (
            <div className="time-slots">
              {timeSlots.map((slot, index) => renderTimeSlot(slot, index))}
            </div>
          ) : (
            <div className="no-data">
              <p>Nenhum horário disponível para este dia</p>
              <button onClick={() => loadAvailability()} className="retry-button">
                Tentar novamente
              </button>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <div className="floating-action-button-container">
          <button
            className="floating-action-button"
            onClick={() => setShowBookingModal(true)}
            disabled={loading}
            aria-label="Agendar nova reunião"
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
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowBookingModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Agendar Reunião</h3>
              <button 
                className="close-button"
                onClick={() => setShowBookingModal(false)}
                disabled={loading}
                aria-label="Fechar modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="name">Nome e Sobrenome *</label>
                <input
                  id="name"
                  type="text"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                  placeholder="Digite seu nome completo"
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Data</label>
                  <input
                    id="date"
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
                  <label htmlFor="start_time">Horário de Início *</label>
                  <input
                    id="start_time"
                    type="time"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({...bookingForm, start_time: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end_time">Horário de Fim *</label>
                  <input
                    id="end_time"
                    type="time"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({...bookingForm, end_time: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="title">Título da Reunião *</label>
                <input
                  id="title"
                  type="text"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({...bookingForm, title: e.target.value})}
                  placeholder="Ex: Reunião de Vendas"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="participants">Participantes (opcional)</label>
                <textarea
                  id="participants"
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

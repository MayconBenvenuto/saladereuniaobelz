import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // URLs relativas para produção no Vercel
  : 'http://localhost:3001'; // URL local para desenvolvimento

const App = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState(null);
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

  // Show error message
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Show success message
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Generate default time slots as fallback
  const generateDefaultSlots = () => {
    const slots = [];
    const startHour = 8;
    const endHour = 18;
    const slotDuration = 30;

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

        slots.push({
          start_time: start,
          end_time: end,
          available: true,
          appointment: null
        });
      }
    }

    return slots;
  };

  // Load availability with better error handling
  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateStr = formatDateForAPI(selectedDate);
      const apiUrl = `${API_BASE_URL}/api/availability/${dateStr}`;
      
      // Timeout reduzido para 8 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
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
      
      // Garantir que sempre temos um array válido
      if (Array.isArray(data)) {
        setAvailability({ slots: data });
      } else if (data && Array.isArray(data.slots)) {
        setAvailability(data);
      } else {
        // Fallback: criar horários padrão do lado do cliente
        setAvailability({ slots: generateDefaultSlots() });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showError('Conexão lenta. Mostrando horários padrão.');
      } else {
        showError('Problema de conexão. Mostrando horários padrão.');
      }
      
      // Em caso de erro, criar horários padrão do lado do cliente
      setAvailability({ slots: generateDefaultSlots() });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Load availability when date changes
  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

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

  // Handle booking form submission (otimizado)
  const handleBookingSubmit = useCallback(async (e) => {
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

      // Timeout de 12 segundos para agendamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

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
      
      // Recarregar disponibilidade
      setTimeout(() => loadAvailability(), 500);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        showError('Timeout no agendamento. Verifique sua conexão e tente novamente.');
      } else {
        showError(error.message || 'Erro ao agendar reunião.');
      }
    } finally {
      setLoading(false);
    }
  }, [bookingForm, selectedDate, loadAvailability]);

  // Render time slot
  const renderTimeSlot = (slot, index) => {
    const isAvailable = slot.available;
    const slotClass = isAvailable ? 'time-slot available' : 'time-slot occupied';
    
    return (
      <div
        key={index}
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
  };

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
            (() => {
              let slots = [];
              if (availability && Array.isArray(availability.slots)) {
                slots = availability.slots;
              } else if (Array.isArray(availability)) {
                slots = availability;
              }
              
              if (Array.isArray(slots) && slots.length > 0) {
                return (
                  <div className="time-slots">
                    {slots.map((slot, index) => renderTimeSlot(slot, index))}
                  </div>
                );
              } else {
                return (
                  <div className="no-data">
                    <p>Nenhum horário disponível para este dia</p>
                    <p>Por favor, verifique se o banco de dados está configurado corretamente.</p>
                  </div>
                );
              }
            })()
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

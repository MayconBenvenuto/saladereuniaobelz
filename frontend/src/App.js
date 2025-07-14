import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const App = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    title: '',
    participants: '',
    start_time: '',
    end_time: ''
  });

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? ''
    : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001');

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
    return timeString.slice(0, 5); // HH:MM
  };

  // useCallback to memoize the function and prevent re-creation
  const loadAvailability = useCallback(async () => {
      setLoading(true);
      try {
        const dateStr = formatDateForAPI(selectedDate);
        const response = await fetch(`${API_BASE_URL}/api/availability/${dateStr}`);
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        } else {
          // Sugestão: Usar um sistema de notificação mais robusto (ex: toast)
          console.error('Failed to load availability');
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setLoading(false);
      }
  }, [selectedDate, API_BASE_URL]); // Dependencies for useCallback

  // Load availability when date changes
  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]); // useEffect depends on the memoized function

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
    }
  }, [bookingForm]);

  // Handle booking form submission
  const handleBookingSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.title || !bookingForm.start_time || !bookingForm.end_time) {
      // Sugestão: Usar um sistema de notificação mais robusto (ex: toast)
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        name: bookingForm.name,
        date: formatDateForAPI(selectedDate),
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        title: bookingForm.title,
        participants: bookingForm.participants || null
      };

      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        // Sugestão: Usar um sistema de notificação mais robusto (ex: toast)
        alert('Agendamento realizado com sucesso!');
        setShowBookingModal(false);
        setBookingForm({
          name: '',
          title: '',
          participants: '',
          start_time: '',
          end_time: ''
        });
        // Reload availability by calling the memoized function
        loadAvailability();
      } else {
        const error = await response.json();
        // Sugestão: Usar um sistema de notificação mais robusto (ex: toast)
        alert(`Erro ao agendar: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [bookingForm, selectedDate, API_BASE_URL, loadAvailability]);

  // Render time slot
  const renderTimeSlot = (slot, index) => {
    const isAvailable = slot.available;
    const slotClass = isAvailable ? 'time-slot available' : 'time-slot occupied';
    
    return (
      <div
        key={index}
        className={slotClass}
        onClick={() => handleSlotClick(slot)}
        title={!isAvailable ? `${slot.appointment.title} - ${slot.appointment.name}` : 'Disponível'}
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
      {/* Sugestão: Extrair para um componente <Header /> */}
      {/* Header with meeting room image and logo */}
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <img 
              src="https://images.unsplash.com/photo-1701500096456-28186c4a306d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxpbnN1cmFuY2UlMjBsb2dvfGVufDB8fHx8MTc1MjUxNTgwM3ww&ixlib=rb-4.1.0&q=85"
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
        {/* Sugestão: Extrair para um componente <DateNavigator /> */}
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

        {/* Sugestão: Extrair para um componente <TimeSlotsGrid /> */}
        {/* Calendar/Time slots */}
        <div className="calendar-container">
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            (() => {
              // Suporte para resposta { slots: [...] } ou diretamente [...]
              let slots = [];
              if (availability && Array.isArray(availability.slots)) {
                slots = availability.slots;
              } else if (Array.isArray(availability)) {
                slots = availability;
              }
              // slots SEMPRE deve conter todos os horários do dia, disponíveis ou não
              if (Array.isArray(slots) && slots.length > 0) {
                return (
                  <div className="time-slots">
                    {slots.map((slot, index) => renderTimeSlot(slot, index))}
                  </div>
                );
              } else if (Array.isArray(slots) && slots.length === 0) {
                // Se slots veio vazio, provavelmente erro na API, mas nunca deve acontecer
                return <div className="no-data">Nenhum horário cadastrado para este dia</div>;
              } else {
                // Caso slots não seja array, erro de integração
                return <div className="no-data">Erro ao carregar horários</div>;
              }
            })()
          )}
        </div>
        {/* 
          Sugestão: Extrair para um componente <FloatingActionButton /> 
          e mover todos os estilos para um arquivo .css para melhor manutenibilidade.
        */}
        <div className="floating-action-button-container">
          <button
            className="floating-action-button"
            onClick={() => setShowBookingModal(true)}
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

      {/* Sugestão: Extrair para um componente <BookingModal /> */}
      {/* Booking modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Agendar Reunião</h3>
              <button 
                className="close-button"
                onClick={() => setShowBookingModal(false)}
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
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={formatDateForAPI(selectedDate)}
                    // Adiciona 'T00:00:00' para evitar problemas de fuso horário
                    // que podem fazer a data voltar um dia.
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value + 'T00:00:00'))
                    }}
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
                  />
                </div>
                <div className="form-group">
                  <label>Horário de Fim *</label>
                  <input
                    type="time"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({...bookingForm, end_time: e.target.value})}
                    required
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
                />
              </div>
              
              <div className="form-group">
                <label>Participantes (opcional)</label>
                <textarea
                  value={bookingForm.participants}
                  onChange={(e) => setBookingForm({...bookingForm, participants: e.target.value})}
                  placeholder="Liste os participantes da reunião"
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowBookingModal(false)}
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
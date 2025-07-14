import React, { useState, useEffect } from 'react';
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

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

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

  // Load availability when date changes
  useEffect(() => {
    const loadAvailability = async () => {
      setLoading(true);
      try {
        const dateStr = formatDateForAPI(selectedDate);
        const response = await fetch(`${API_BASE_URL}/api/availability/${dateStr}`);
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        } else {
          console.error('Failed to load availability');
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [selectedDate, API_BASE_URL]);

  // Handle date navigation
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Handle slot selection
  const handleSlotClick = (slot) => {
    if (slot.available) {
      setSelectedSlot(slot);
      setBookingForm({
        ...bookingForm,
        start_time: slot.start_time.slice(0, 5),
        end_time: slot.end_time.slice(0, 5)
      });
    }
  };

  // Handle booking form submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.title || !bookingForm.start_time || !bookingForm.end_time) {
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
        alert('Agendamento realizado com sucesso!');
        setShowBookingModal(false);
        setBookingForm({
          name: '',
          title: '',
          participants: '',
          start_time: '',
          end_time: ''
        });
        // Reload availability
        const dateStr = formatDateForAPI(selectedDate);
        const availabilityResponse = await fetch(`${API_BASE_URL}/api/availability/${dateStr}`);
        if (availabilityResponse.ok) {
          const data = await availabilityResponse.json();
          setAvailability(data);
        }
      } else {
        const error = await response.json();
        alert(`Erro ao agendar: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="loading">Carregando...</div>
          ) : availability ? (
            <div className="time-slots">
              {availability.slots.map((slot, index) => renderTimeSlot(slot, index))}
            </div>
          ) : (
            <div className="no-data">Nenhum dado disponível</div>
          )}
        </div>
      </main>

      {/* Fixed booking button */}
      <div className="booking-button-container">
        <button 
          className="booking-button"
          onClick={() => setShowBookingModal(true)}
          disabled={loading}
        >
          Agendar Reunião
        </button>
      </div>

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
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
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
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Configurações
app.use(cors());
app.use(bodyParser.json());

// Conectar ao banco de dados SQLite
const dbPath = path.join(__dirname, 'meeting_room.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        
        // Criar tabela se não existir
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            name TEXT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Rotas
app.get('/api/appointments', (req, res) => {
    const { date } = req.query;
    let query = 'SELECT * FROM appointments';
    let params = [];
    
    if (date) {
        query += ' WHERE date(start_time) = date(?)';
        params.push(date);
    }
    
    // Adicionar ordenação por data/hora
    query += ' ORDER BY start_time ASC';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Formatar as datas para ISO string para garantir compatibilidade
        const formattedRows = rows.map(row => ({
            ...row,
            start_time: new Date(row.start_time).toISOString(),
            end_time: new Date(row.end_time).toISOString()
        }));
        
        res.json(formattedRows);
    });
});

app.post('/api/appointments', (req, res) => {
    const { title, description, name, start_time, end_time, date } = req.body;
    
    // Validar dados obrigatórios
    if (!title || !name || !start_time || !end_time || !date) {
        res.status(400).json({ error: "Campos obrigatórios faltando" });
        return;
    }
    
    // Criar datas completas combinando a data com os horários
    const startDateTime = `${date}T${start_time}:00.000Z`;
    const endDateTime = `${date}T${end_time}:00.000Z`;
    
    // Verificar se já existe agendamento no mesmo horário
    db.get(
        `SELECT COUNT(*) as count 
         FROM appointments 
         WHERE date(start_time) = date(?) 
         AND (
            (start_time <= ? AND end_time > ?) OR
            (start_time < ? AND end_time >= ?) OR
            (start_time >= ? AND end_time <= ?)
         )`,
        [date, endDateTime, startDateTime, endDateTime, startDateTime, startDateTime, endDateTime],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (row.count > 0) {
                res.status(409).json({ error: "Já existe um agendamento neste horário" });
                return;
            }
            
            // Inserir novo agendamento
            db.run(
                `INSERT INTO appointments (title, description, name, start_time, end_time)
                 VALUES (?, ?, ?, ?, ?)`,
                [title, description || null, name, startDateTime, endDateTime],
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    res.json({
                        id: this.lastID,
                        message: "Agendamento criado com sucesso"
                    });
                }
            );
        }
    );
});

app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM appointments WHERE id = ?', id, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Agendamento excluído com sucesso" });
    });
});

// Rota para verificar disponibilidade de horários
app.get('/api/availability/:date', (req, res) => {
    const { date } = req.params;
    
    // Buscar todos os agendamentos para a data especificada
    db.all(
        'SELECT start_time, end_time FROM appointments WHERE date(start_time) = date(?)',
        [date],
        (err, rows) => {
            if (err) {
                console.error('Erro ao buscar agendamentos:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Definir horário de funcionamento (8h às 18h)
            const businessHours = {
                start: 8,
                end: 18
            };
            
            // Criar slots de 1 hora
            const slots = [];
            for (let hour = businessHours.start; hour < businessHours.end; hour++) {
                const slotStart = `${hour.toString().padStart(2, '0')}:00`;
                const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
                
                // Verificar se o slot está disponível
                const isAvailable = !rows.some(booking => {
                    const bookingStart = new Date(`${date}T${booking.start_time}`);
                    const bookingEnd = new Date(`${date}T${booking.end_time}`);
                    const slotStartDate = new Date(`${date}T${slotStart}`);
                    const slotEndDate = new Date(`${date}T${slotEnd}`);
                    
                    return (
                        (slotStartDate >= bookingStart && slotStartDate < bookingEnd) ||
                        (slotEndDate > bookingStart && slotEndDate <= bookingEnd) ||
                        (slotStartDate <= bookingStart && slotEndDate >= bookingEnd)
                    );
                });
                
                slots.push({
                    start_time: slotStart,
                    end_time: slotEnd,
                    available: isAvailable
                });
            }
            
            console.log(`Disponibilidade para ${date}: ${slots.length} slots gerados.`);
            res.json({ slots });
        }
    );
});

// Para produção, servir os arquivos estáticos do build
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../build', 'index.html'));
    });
}

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

module.exports = app;

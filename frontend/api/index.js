const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();

// Configurações
app.use(cors());
app.use(bodyParser.json());

// Cria o diretório 'data' na raiz do projeto se ele não existir
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Diretório de dados criado em: ${dataDir}`);
}

// Conectar ao banco de dados SQLite
const dbPath = path.join(dataDir, 'meeting_room.db');
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
        // Retornar as datas como estão no banco de dados
        res.json(rows);
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
    console.log('Recebida requisição de disponibilidade para data:', date);
    // Buscar todos os agendamentos para a data especificada
    db.all(
        'SELECT title, name, start_time, end_time FROM appointments WHERE date(start_time) = date(?)',
        [date],
        (err, rows) => {
            if (err) {
                console.error('Erro ao buscar agendamentos:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            console.log('Agendamentos encontrados:', rows.length, rows);
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
                // Encontrar o agendamento que conflita com o slot atual
                const booking = rows.find(b => {
                    // As datas do banco já estão no formato ISO completo
                    const bookingStart = new Date(b.start_time);
                    const bookingEnd = new Date(b.end_time);
                    const slotStartDate = new Date(`${date}T${slotStart}:00.000Z`);
                    const slotEndDate = new Date(`${date}T${slotEnd}:00.000Z`);
                    // Lógica de sobreposição de horários
                    return (
                        (slotStartDate >= bookingStart && slotStartDate < bookingEnd) ||
                        (slotEndDate > bookingStart && slotEndDate <= bookingEnd) ||
                        (slotStartDate <= bookingStart && slotEndDate >= bookingEnd)
                    );
                });
                slots.push({
                    start_time: slotStart,
                    end_time: slotEnd,
                    available: !booking,
                    appointment: booking ? { title: booking.title, name: booking.name } : null
                });
            }
            console.log(`Disponibilidade para ${date}: ${slots.length} slots gerados.`, slots);
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
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const bodyParser = require('body-parser');

const app = express();

// Configurazione del database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Inserisci il tuo nome utente del database
    password: '', // Inserisci la tua password del database
    database: 'progetto', // Inserisci il nome del tuo database
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware per il parsing del corpo della richiesta
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Route per gestire la richiesta di inserimento dei dati dal form
app.post('/register', async (req, res) => {
    const { nome, cognome, città, email, password, telefono, tipo_abbonamento, user_type, p_iva, categoria_servizi } = req.body;

    try {
        const connection = await pool.getConnection();

        // Inserimento dei dati nella tabella users
        const sqlInsertUser = 'INSERT INTO users (nome, cognome, città, email, password, telefono, tipo_abbonamento, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await connection.query(sqlInsertUser, [nome, cognome, città, email, password, telefono, tipo_abbonamento, user_type]);

        // Inserimento dei dati nella tabella professionals se l'utente è un professionista
        if (user_type === 'professionista') {
            const sqlInsertProfessional = 'INSERT INTO professionals (user_id, p_iva, categoria_servizi) VALUES ((SELECT LAST_INSERT_ID()), ?, ?)';
            await connection.query(sqlInsertProfessional, [p_iva, categoria_servizi]);
        }

        // Rilascia la connessione
        connection.release();

        res.status(201).json({ message: 'Dati inseriti correttamente' });
    } catch (error) {
        console.error('Errore durante l\'inserimento dei dati:', error);
        res.status(500).json({ error: 'Si è verificato un errore durante l\'inserimento dei dati' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});

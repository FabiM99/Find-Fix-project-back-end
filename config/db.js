const mysql = require('mysql2/promise');

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

module.exports = pool;
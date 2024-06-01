const mysql = require('mysql2/promise');


// Configurazione del database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, // Inserisci il tuo nome utente del database
  password: process.env.DB_PASSWORD, // Inserisci la tua password del database
  database: process.env.DB_NAME, // Inserisci il nome del tuo database
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
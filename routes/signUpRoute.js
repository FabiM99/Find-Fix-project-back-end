const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signUpRoute = {
  path: "/api/registrati",
  method: "post",
  handler: async (req, res) => {
    const { nome, cognome, email, password, emailMarketing } = req.body;

    // Converti il valore del campo emailMarketing in un valore booleano
    const emailMarketingValue = emailMarketing === 'true';

    try {
      // Controlla se l'utente esiste già
      const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).send('Utente già esistente');
      }

      // Calcola l'hash della password
      const hashedPassword = await bcrypt.hash(password, 10);// 10 è il costo del bcrypt, più alto è il costo, più lungo sarà il tempo di hashing

      const connection = await pool.getConnection();

      // Inserisce il nuovo utente nella tabella users per i clienti
      const sqlInsertUser = 'INSERT INTO users (nome, cognome, email, password, email_marketing, user_type) VALUES (?, ?, ?, ?, ?, ?)'
      const insertUserResult = await pool.query(sqlInsertUser, [nome, cognome, email, hashedPassword,  emailMarketingValue, 'cliente']);

       // Rilascia la connessione
       connection.release();

        // Ottieni l'ID del nuovo utente
      const userId = insertUserResult.insertId;

        const token = jwt.sign({ userId, nome, cognome, email }, process.env.JWT_SECRET, { expiresIn: '2d' }, (err, token) => {
          if(err){
            return res.status(500).json({ error: 'Si è verificato un errore durante la generazione del token JWT' });
          }
          res.status(201).json({ message: 'Dati inseriti correttamente', token });
        });

      
    } catch (error) {
      console.error('Errore durante l\'inserimento dei dati:',error);
      res.status(500).json({ error: 'Si è verificato un errore durante l\'inserimento dei dati' }); // Errore del server
    }
  }
};


module.exports = signUpRoute;
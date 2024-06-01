const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
require('dotenv').config();

const schema = Joi.object({
  nome: Joi.string().required(),
  cognome: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  email_marketing: Joi.boolean().required(),
});

const signUpRoute = {
  path: "/api/registrazione/cliente",
  method: "post",
  handler: async (req, res) => {
    const { nome, cognome, email, password, email_marketing } = req.body;
    
     // Validazione dei dati con Joi
     const { error } = schema.validate({ nome, cognome, email, password, email_marketing });
     if (error) {
      console.log('Errore di validazione:', error.details[0].message);
       return res.status(400).json({ error: error.details[0].message });
     }

    // Converti il valore del campo emailMarketing in un valore booleano
    const emailMarketingValue = email_marketing ||'false';

    try {
      // Controlla se l'utente esiste già
      const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).send('Utente già esistente');
      }

      // Calcola l'hash della password
      const hashedPassword = await bcrypt.hash(password, 10);// 10 è il costo del bcrypt, più alto è il costo, più lungo sarà il tempo di hashing
      console.log('Password hashed:', hashedPassword)

      const connection = await pool.getConnection();

      // Inserisce il nuovo utente nella tabella users per i clienti
      const sqlInsertUser = 'INSERT INTO users (nome, cognome, email, password, email_marketing, user_type) VALUES (?, ?, ?, ?, ?, ?)';
      const [insertUserResult] = await pool.query(sqlInsertUser, [nome, cognome, email, hashedPassword,  emailMarketingValue, 'cliente']);
      console.log('Risultato inserimento utente:', insertUserResult);
       // Rilascia la connessione
       connection.release();

        // Ottieni l'ID del nuovo utente
      const userId = insertUserResult.insertId;
      

      /*insertId: Dopo l'esecuzione della query, la funzione query restituisce un oggetto risultato. Se la query è un'operazione di inserimento, questo oggetto avrà una proprietà insertId che contiene l'ID del nuovo record inserito. Questo ID è generato automaticamente da MySQL se la tabella ha una colonna con la proprietà AUTO_INCREMENT. l'inserimento del nuovo utente nel database viene ottenuto il suo ID unico tramite insertUserResult.insertId, che viene poi utilizzato per generare un token JWT.*/

         jwt.sign({ userId, nome, cognome, email }, process.env.JWT_SECRET.trim(), { expiresIn: '2d' }, (err, token) => {
          if(err){
            console.error('Errore durante la generazione del token JWT:', err);
            return res.status(500).json({ error: 'Si è verificato un errore durante la generazione del token JWT' });
          }
          console.log('Token generato:', token);
          res.status(201).json({ message: 'Dati inseriti correttamente', token: token });
        });

      
    } catch (error) {
      console.error('Errore durante l\'inserimento dei dati:',error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Email già in uso' });
      } else {
        res.status(500).json({ error: 'Si è verificato un errore durante l\'inserimento dei dati' }); // Errore del server
      }
    }
  }
};


module.exports = signUpRoute;
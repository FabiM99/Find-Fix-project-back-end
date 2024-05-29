const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const registerProSchema = Joi.object({
  nome: Joi.string().required(),
  cognome: Joi.string().required(),
  città: Joi.string().required(),
  provincia: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  telefono: Joi.string(),
  tipo_abbonamento: Joi.string().valid('mensile', 'annuale', 'nessuno').default('nessuno'),
  user_type: Joi.string().valid('cliente', 'professionista').required(),
  p_iva: Joi.string().required(),
  categoria_servizi: Joi.string().required()
});

const registerPro = {
  path: "/api/registratazione/professionale",
  method: "post",
  handler: async (req, res) => {
    const { nome, cognome, città, email, password, telefono, tipo_abbonamento, user_type, p_iva, categoria_servizi } = req.body;

    const { error } = registerProSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try {
      // Controlla se l'utente esiste già
      const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(409).send('Utente già esistente');
      }
      // Hash della password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 è il costo del bcrypt, più alto è il costo, più lungo sarà il tempo di hashing

      const connection = await pool.getConnection();

      // Inserimento dei dati nella tabella users
      const sqlInsertUser = 'INSERT INTO users (nome, cognome, città, email, password, telefono, tipo_abbonamento, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      await connection.query(sqlInsertUser, [nome, cognome, città, email, hashedPassword, telefono, tipo_abbonamento, user_type]);

      // Inserimento dei dati nella tabella professionals se l'utente è un professionista
      if (user_type === 'professionista') {
        const sqlInsertProfessional = 'INSERT INTO professionals (user_id, p_iva, categoria_servizi) VALUES ((SELECT LAST_INSERT_ID()), ?, ?)';
        await connection.query(sqlInsertProfessional, [p_iva, categoria_servizi]);
      }

      // Rilascia la connessione
      connection.release();

      // Genera il token JWT
      jwt.sign({ nome, cognome, email, tipo_abbonamento }, process.env.JWT_SECRET, { expiresIn: '2d' }, (err, token) => {
        if (err) {
          console.error('Errore durante la generazione del token JWT:', err);
          return res.status(500).json({ error: 'Si è verificato un errore durante la generazione del token JWT' });
        }
        res.status(201).json({ message: 'Dati inseriti correttamente', token: token });
      });
    } catch (error) {
      console.error('Errore durante l\'inserimento dei dati:', error);
      // l’errore ER_DUP_ENTRY, che viene generato quando si tenta di inserire un valore duplicato in un campo che dovrebbe essere unico
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Email già in uso' });
      } else {
        res.status(500).json({ error: 'Si è verificato un errore durante l\'inserimento dei dati' });
      }
    }
  }
};

module.exports = registerPro;

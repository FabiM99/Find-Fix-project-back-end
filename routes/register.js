const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const multer = require('multer');
require('dotenv').config();

// Configura multer per salvare le immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // cartella dove verranno salvate le immagini
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

const registerProSchema = Joi.object({
  nome: Joi.string().required(),
  cognome: Joi.string().required(),
  città: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  provincia: Joi.string().required(),
  telefono: Joi.number(),
  categoria_servizi: Joi.string().required(),
  nome_azienda: Joi.string().optional(),
  p_iva: Joi.string().required(),
  codiceFiscale: Joi.string().required(),
  descrizioneProfessionista: Joi.string().required(),
  tipo_abbonamento: Joi.string().valid('mensile', 'annuale', 'nessuno').default('nessuno'),
  profilePhotoName: Joi.string().optional(),
  profilePhotoPath: Joi.string().optional(),
  costo: Joi.number().required(),
});

const registerPro = {
  path: "/api/registratazione/professionale",
  method: "post",
  handler: async (req, res) => {
    // Multer gestisce i file nel campo 'profilePhoto'
    upload.single('profilePhoto')(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: 'Errore durante il caricamento del file' });
      }

      const {
        nome, cognome, città, email, password, provincia, telefono, categoria_servizi,
        nome_azienda, p_iva, codiceFiscale, descrizioneProfessionista, tipo_abbonamento, costo,
      } = req.body;
      const profilePhotoName = req.file ? req.file.filename : null;
      const profilePhotoPath = req.file ? req.file.path : null;

      const { error } = registerProSchema.validate({
        nome, cognome, città, email, password, provincia, telefono, categoria_servizi,
        nome_azienda, p_iva, codiceFiscale, descrizioneProfessionista, tipo_abbonamento, costo,
        profilePhotoName, profilePhotoPath,
      });

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
        const hashedPassword = await bcrypt.hash(password, 10);

        const connection = await pool.getConnection();

        // Inserimento dei dati nella tabella users
        const sqlInsertUser = 'INSERT INTO users (nome, cognome, città, email, password, telefono, tipo_abbonamento, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await connection.query(sqlInsertUser, [nome, cognome, città, email, hashedPassword, telefono, tipo_abbonamento, "professionista"]);

        // Recupera l'ID dell'utente appena creato
        const [user] = await connection.query('SELECT LAST_INSERT_ID() AS id');
        const userId = user[0].id;

        // Inserimento dei dati nella tabella professionals
        const sqlInsertProfessional = 'INSERT INTO professionals (user_id, nome_azienda, p_iva, codiceFiscale, categoria_servizi, città, provincia, descrizioneProfessionista) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await connection.query(sqlInsertProfessional, [userId, nome_azienda, p_iva, codiceFiscale, categoria_servizi, città, provincia, descrizioneProfessionista]);

        // Inserimento dei dati nella tabella abbonamento
        const sqlInsertAbbonamento = 'INSERT INTO abbonamento (professional_id, tipo, inizio_abbonamento, fine_abbonamento) VALUES (?, ?, ?, ?)';
        await connection.query(sqlInsertAbbonamento, [userId, tipo_abbonamento, null, null]);

        // Inserimento dei dati nella tabella abbonamento_prezzo
        const sqlInsertAbbonamentoPrezzo = 'INSERT INTO abbonamento_prezzo (tipo, costo) VALUES (?, ?)';
        await connection.query(sqlInsertAbbonamentoPrezzo, [tipo_abbonamento, costo]);

        // Inserimento dei dati nella tabella profile_images
        if (profilePhotoName && profilePhotoPath) {
          const sqlInsertProfileImage = 'INSERT INTO profile_images (user_id, profilePhotoName, profilePhotoPath) VALUES (?, ?, ?)';
          await connection.query(sqlInsertProfileImage, [userId, profilePhotoName, profilePhotoPath]);
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
        if (error.code === 'ER_DUP_ENTRY') {
          res.status(409).json({ error: 'Email già in uso' });
        } else {
          res.status(500).json({ error: 'Si è verificato un errore durante l\'inserimento dei dati' });
        }
      }
    });
  }
};

module.exports = registerPro;
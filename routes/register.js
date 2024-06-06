const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const multer = require('multer');
require('dotenv').config();

// Configura multer per salvare le immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_DIRECTORY || 'uploads/');  // cartella dove verranno salvate le immagini
  },
  filename: function (req, file, cb) {
     // Specifica il nome del file, aggiungendo un timestamp per renderlo unico
    cb(null, Date.now() + '-' + file.originalname);
  }
});

//gestione upload
const upload = multer({ storage: storage });

// Definisce lo schema di validazione usando Joi
const registerProSchema = Joi.object({
  nome: Joi.string().required(),
  cognome: Joi.string().required(),
  citta: Joi.string().required(), 
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  provincia: Joi.string().required(),
  telefono: Joi.string().optional(),
  categoria_servizi: Joi.array().items(Joi.string()).required(),
  nome_azienda: Joi.string().allow(null, '').optional(),
  p_iva: Joi.string().required(),
  codiceFiscale: Joi.string().required(),
  descrizioneProfessionista: Joi.string().required(),
  tipo_abbonamento: Joi.string().valid('mensile', 'annuale', 'nessuno').default('nessuno'),
  profilePhotoName: Joi.string().optional().allow(null, ''),
  profilePhotoPath: Joi.string().optional().allow(null, ''),
  costo: Joi.number().required(),
});

// Rotta per registrare un professionista
const registerPro = {
  path: "/api/registratazione/professionale",
  method: "post",
  handler: async (req, res) => {
    // Multer gestisce i file nel campo 'profilePhoto'
    upload.single('profilePhoto')(req, res, async (err) => {
      if (err) {
        console.log('errore nel caricamento del file')
        return res.status(500).json({ error: 'Errore durante il caricamento del file' });
      }
      console.log('File caricato:', req.file); // Log per debug

      // Estrazione dei dati dal corpo della richiesta
      const {
        nome, cognome, citta, email, password, provincia, telefono, categoria_servizi,
        nome_azienda, p_iva, codiceFiscale, descrizioneProfessionista, tipo_abbonamento, costo,
      } = req.body;
       // Se il file è stato caricato, estrai il nome del file e il percorso
      const profilePhotoName = req.file ? req.file.filename : null;
      const profilePhotoPath = req.file ? req.file.path : null;

      /* req.file ==> questo oggetto è disponibile grazie a multer quando un file viene caricato tramite una richiesta POST o PUT.  */

 // Validazione dei dati usando Joi
      const { error } = registerProSchema.validate({
        nome, cognome, citta, email, password, provincia, telefono, categoria_servizi,
        nome_azienda, p_iva, codiceFiscale, descrizioneProfessionista, tipo_abbonamento, costo,
        profilePhotoName, profilePhotoPath,
      });

      if (error) {
        console.log('Validation Error:', error.details[0].message);
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
        try {
          // Inizia una transazione
          await connection.beginTransaction();

          // Inserimento dei dati nella tabella users
          const sqlInsertUser = 'INSERT INTO users (nome, cognome, email, password, telefono, user_type) VALUES (?, ?, ?, ?, ?, ?)';
          const [insertUserResult] = await connection.query(sqlInsertUser, [nome, cognome, email, hashedPassword, telefono, "professionista"]);
          
          console.log('Risultato inserimento utente:', insertUserResult);
          // Recupera l'ID dell'utente appena creato
          const [user] = await connection.query('SELECT LAST_INSERT_ID() AS id');
          const userId = user[0].id;

          // Inserimento dei dati nella tabella professionals
          const sqlInsertProfessional = 'INSERT INTO professionals (user_id, nome_azienda, p_iva, codiceFiscale, categoria_servizi, citta, provincia, descrizioneProfessionista) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
          await connection.query(sqlInsertProfessional, [userId, nome_azienda, p_iva, codiceFiscale, JSON.stringify(categoria_servizi), citta, provincia, descrizioneProfessionista]);

          // Recupera l'ID del professional appena creato
          const [professional] = await connection.query('SELECT LAST_INSERT_ID() AS id');
          const professionalId = professional[0].id;

          // Inserimento dei dati nella tabella abbonamento_prezzo
          const sqlInsertAbbonamentoPrezzo = 'INSERT INTO abbonamento_prezzo (tipo, costo) VALUES (?, ?) ON DUPLICATE KEY UPDATE costo = VALUES(costo)';
          await connection.query(sqlInsertAbbonamentoPrezzo, [tipo_abbonamento, costo]);

          // Inserimento dei dati nella tabella abbonamento
          const sqlInsertAbbonamento = 'INSERT INTO abbonamento (professional_id, tipo, inizio_abbonamento, fine_abbonamento) VALUES (?, ?, ?, ?)';
          await connection.query(sqlInsertAbbonamento, [professionalId, tipo_abbonamento, null, null]);

          // Inserimento dei dati nella tabella profile_images
          if (profilePhotoName && profilePhotoPath) {
            const sqlInsertProfileImage = 'INSERT INTO profile_images (user_id, profilePhotoName, profilePhotoPath) VALUES (?, ?, ?)';
            await connection.query(sqlInsertProfileImage, [userId, profilePhotoName, profilePhotoPath]);
          }

          // Commit della transazione
          await connection.commit();

          // Genera il token JWT
          jwt.sign({ id: userId, email, user_type: 'professionista' }, process.env.JWT_SECRET, { expiresIn: '2d' }, (err, token) => {
            if (err) {
              console.error('Errore durante la generazione del token JWT:', err);
              console.log('Si è verificato un errore durante la generazione del token JWT')
              return res.status(500).json({ error: 'Si è verificato un errore durante la generazione del token JWT' });
            }
            res.status(201).json({ message: 'Dati inseriti correttamente', token: token });
          });
        } catch (error) {
           // Se c'è un errore, annulla tutte le operazioni della transazione
          await connection.rollback();
          throw error;
        } finally {
          // Rilascia la connessione
          connection.release();
        }
      } catch (error) {
        console.error('Errore durante l\'inserimento dei dati:', error);
        if (error.code === 'ER_DUP_ENTRY') {
          res.status(409).json({ error: 'Email già in uso' });
        } else {
          console.log('Si è verificato un errore durante l\'inserimento dei dati')
          res.status(500).json({ error: 'Si è verificato un errore durante l\'inserimento dei dati' });
        }
      }
    });
  }
};

module.exports = registerPro;

/*L'errore ER_DUP_ENTRY è un codice di errore di MySQL che indica che stai tentando di inserire un valore duplicato in una colonna che ha un vincolo di unicità. Questo può accadere quando tenti di inserire un valore in una colonna UNIQUE o in una colonna che fa parte di una chiave primaria (PRIMARY KEY) e il valore esiste già in quella colonna. */
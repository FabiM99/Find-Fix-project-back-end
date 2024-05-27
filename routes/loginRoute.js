const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const Joi = require('joi');

// Schema di validazione dei dati della richiesta di login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const loginRoute = {
  path: "/api/login",
  method: "post",
  handler: async (req, res) => {
    const { email, password } = req.body;
    
    // Validazione dei dati della richiesta di login
    const { error } = loginSchema.validate(req.body);

    // Se ci sono errori di validazione, restituisci una risposta con stato 400 (Bad Request)
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    try {
      // Controlla se l'utente esiste nel database
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

      // Se non esiste un utente con quell'email, restituisci uno stato 401 (Non autorizzato)
      if (!users || users.length === 0) {
        return res.sendStatus(401);
      }

      const user = users[0]; // Prendi il primo utente trovato (dovrebbe essercene solo uno)

      // Confronta la password fornita dall'utente con quella nel database
      const isCorrect = await bcrypt.compare(password, user.password);

      if (isCorrect) {
        // Se la password è corretta, genera il token JWT
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2d' });

        // Invia il token come risposta
        res.status(200).json({ token });
      } else {
        // Se la password non è corretta, restituisci uno stato 401 (Non autorizzato)
        res.sendStatus(401);
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      res.status(500).json({ error: 'Si è verificato un errore durante il login' });
    }
  }
}

module.exports = loginRoute;

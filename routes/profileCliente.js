
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticate');


//endpoint per ottenere i dati del profilo utente
//Router: È utile per organizzare e modulare il codice dell'applicazione.
const profileCliente = {
  path: '/api/profile/cliente',
  method: 'get',
  handler: [ authenticateToken, async (req, res) =>{
   try {
    console.log('Authenticated user ID:', req.user.userId);
     const [rows] = await pool.query('SELECT id, nome, cognome, email, user_type FROM users WHERE id = ?', [req.user.userId]);
     const user = rows[0];
   
     console.log('User data:', user);
     
     if(!user){
       return res.status(404).json({message: 'User not Found'});
     }
     res.json(user);
   } catch (error) {
     console.error('Error fetching profile:', error);
     res.status(500).json({message: 'Server Error' });
     
   }

  }]
};


module.exports = profileCliente   
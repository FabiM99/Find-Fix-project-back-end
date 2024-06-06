const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticate');

const profileProfessionista = {
  path: '/api/profile/professionista',
  method: 'get',
  handler: [authenticateToken, async (req, res) => {
    try {
      console.log('Authenticated user ID:', req.user.id);
      
      const [userRows] = await pool.query(
        'SELECT id, nome, cognome, email, user_type FROM users WHERE id = ?', 
        [req.user.id]
      );
      const user = userRows[0];
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const [profRows] = await pool.query(
        'SELECT nome_azienda, p_iva, codiceFiscale, categoria_servizi, citta, provincia, descrizioneProfessionista FROM professionals WHERE user_id = ?', 
        [req.user.id]
      );
      const professional = {
        ...profRows[0],
        categoria_servizi: JSON.parse(profRows[0].categoria_servizi || '[]')
      };

      if (!professional) {
        return res.status(404).json({ message: 'Professional details not found' });
      }

      const [imageRows] = await pool.query(
        'SELECT profilePhotoName, profilePhotoPath FROM profile_images WHERE user_id = ?', 
        [req.user.id]
      );
      

      const profileData = {
        ...user,
        ...professional,
        profileImage: imageRows.length > 0 ? `${req.protocol}://${req.get('host')}/uploads/${imageRows[0].profilePhotoName}` : null
      };

/*==> ${req.protocol}: variabile che contiene il protocollo http o https
  ==> ${req.get('host')} : recupera l'host dalla richiesta corrente (include dominio e porta) ---> example.com:3000
  ==> /uploads/ : il percorso della cartella delle immagine salvate sul server
  ==> ${imageRows[0].profilePhotoName} : il nome del file dellímmagine come salvato nel database 
  questa èlàintera construzione dell'URL
  
  assicurarsi che il server abbia il middleware per i file statici. questo significa che qualsiasi file in quella cartella può essere ccessibile pubblicamente tramite un URL */

      console.log('Profile data:', profileData);

      res.json(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }]
};

module.exports = profileProfessionista;
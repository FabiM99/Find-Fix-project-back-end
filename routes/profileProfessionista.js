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
      const professional = profRows[0];

      if (!professional) {
        return res.status(404).json({ message: 'Professional details not found' });
      }

      const [imageRows] = await pool.query(
        'SELECT profilePhotoName, profilePhotoPath FROM profile_images WHERE user_id = ?', 
        [req.user.id]
      );
      const profileImage = imageRows[0];

      const profileData = {
        ...user,
        ...professional,
        profileImage: profileImage ? {
          profilePhotoName: profileImage.profilePhotoName,
          profilePhotoPath: profileImage.profilePhotoPath
        } : null
      };

      console.log('Profile data:', profileData);

      res.json(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }]
};

module.exports = profileProfessionista;
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Token mancante');
    return res.sendStatus(401).json({ message: 'Token non fornito' });;
  }

  console.log('Token ricevuto:', token); // Log per il debug
  console.log('Segreto JWT:', process.env.JWT_SECRET.trim()); // Verifica che il segreto JWT sia caricato correttamente

  jwt.verify(token, process.env.JWT_SECRET.trim(), (err, user) => {
    if (err) {
      console.log('Token non valido:', err);
      return res.sendStatus(403);
    }
    console.log('Payload decodificato:', user);
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
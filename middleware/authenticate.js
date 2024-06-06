const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Header di autorizzazione mancante' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato dell\'header di autorizzazione non valido' });
  }

  const token = tokenParts[1];


  //console.log('Token ricevuto:', token); // Log per il debug
  //console.log('Segreto JWT:', process.env.JWT_SECRET.trim()); // Verifica che il segreto JWT sia caricato correttamente

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
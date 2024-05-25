const bodyParser = require('body-parser');
const cors = require('cors');

// Middleware per il parsing del corpo della richiesta
module.exports = (app) => {
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
};
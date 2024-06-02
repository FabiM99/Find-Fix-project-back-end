const signUpRoute = require('./signUpRoute');
const registerPro = require('./register');
const loginRoute = require('./loginRoute');
const profileCliente = require('./profileCliente');
const profileProfessionista = require('./profileProfessionista');

const routes = [
  signUpRoute,
  registerPro,
  loginRoute,
  {...profileCliente, protected:true},
  {...profileProfessionista, protected:true}

];

module.exports = routes;
const signUpRoute = require('./signUpRoute');
const registerPro = require('./register');
const loginRoute = require('./loginRoute');
const profileCliente = require('./profileCliente');

const routes = [
  signUpRoute,
  registerPro,
  loginRoute,
  {...profileCliente, protected:true}
];

module.exports = routes;
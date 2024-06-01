require('dotenv').config();
const express = require('express');
const app = express();
const bodyParserMiddleware = require('./middleware/bodyParser');
const routes = require('./routes/index');


// This allows us to access the body of POST/PUT
// requests in our route handlers (as req.body)
app.use(express.json());

// Configurazione del middleware
bodyParserMiddleware(app);


// Add all the routes to our Express server
// exported from routes/index.js
routes.forEach(route => {
    if(route.protected){
        app[route.method](route.path, require('./middleware/authenticate'), route.handler);
    }else {
        app[route.method](route.path, route.handler);
    }
   
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});


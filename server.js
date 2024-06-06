require('dotenv').config();
const express = require('express');
const app = express();
const routes = require('./routes/index');

require('./middleware/basicMiddleware')(app);


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


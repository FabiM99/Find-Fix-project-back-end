const express = require('express');
const cors = require('cors');

// Middleware per il parsing del corpo della richiesta
module.exports = (app) => {
  app.use(cors());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use('/uploads', express.static('uploads'));
};


/*CORS ==> è una tecnologia di sicurezza che permette o limita le richieste risorse da domini esterni.
  express.urlencoded ==> analizza i corpi delle richieste che sono condificate come application/x-www-form-urlencoded. 
  extended: false ==> significa che utilizzerai la libreria querystring per analizzare i dati, che non permette l'uso di array o oggetti (solo stringhe e valori).
   express.json ==>  Analizza i corpi delle richieste che sono formattati come JSON, rendendoli accessibili tramite req.body
   express.static ==> se vuoi i file statici siano accessibili da un percorso base specifico,puoi specificarlo come primo argomento di app.use */ 

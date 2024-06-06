CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    user_type ENUM('cliente', 'professionista') NOT NULL,
    email_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- the date when the user was created
);


CREATE TABLE professionals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, --reference the corresponding user in the "users" table
    nome_azienda VARCHAR(100),
    p_iva VARCHAR(50) NOT NULL,
    codiceFiscale VARCHAR(50) NOT NULL,
    categoria_servizi NOT NULL, --prende un JSON 
    citta VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    descrizioneProfessionista TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE --ensures that the professional record is linked to a valis user. --on delete cascade means that id the user is deleted, their associated professional record is also deleted.
);

CREATE TABLE profile_images (
    id INT AUTO_INCREMENT PRIMARY KEY, --unique identifier for each profile image
    user_id INT NOT NULL,
    profilePhotoName VARCHAR(255),
    profilePhotoPath VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE abbonamento_prezzo (
  tipo ENUM('mensile', 'annuale') PRIMARY KEY, -- La colonna 'tipo' diventa la chiave primaria
  costo DECIMAL(10, 2) NOT NULL,
  INDEX tipo_index (tipo) 
);

CREATE TABLE abbonamento (
  id INT AUTO_INCREMENT PRIMARY KEY,
   professional_id INT NOT NULL, -- References the corresponding user in the professional table
  tipo ENUM('mensile', 'annuale') NOT NULL,
  inizio_abbonamento DATE,  --metto senza not null perche ci serviera al pagamento
  fine_abbonamento DATE, --metto senza not null perche ci serviera al pagamento 
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
  FOREIGN KEY ( tipo) REFERENCES abbonamento_prezzo(tipo)  -- Foreign key referencing tipo
  ON DELETE CASCADE
);



--non è necessario aggiungere una chiave esterna dalla tabella abbonamento_prezzo alla tabella abbonamento. Le tabelle abbonamento e abbonamento_prezzo sono collegate attraverso la colonna tipo nella tabella abbonamento che funge da riferimento per il tipo di abbonamento e il relativo costo.
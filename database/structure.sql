CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    user_type ENUM('cliente', 'professionista') NOT NULL,
    email_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE professionals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nome_azienda VARCHAR(100) NOT NULL,
    p_iva VARCHAR(50) NOT NULL,
    codiceFiscale VARCHAR(50) NOT NULL,
    categoria_servizi VARCHAR(100) NOT NULL,
    città VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    descrizioneProfessionista TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE profile_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE abbonamento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,  -- Foreign key to users table
  tipo ENUM('mensile', 'annuale') NOT NULL,
  inizio_abbonamento DATE,  --metto senza not null perche ci serviera al pagamento
  fine_abbonamento DATE, --metto senza not null perche ci serviera al pagamento 
  FOREIGN KEY (user_id, tipo) REFERENCES subscription_prices(tipo, costo)  -- Foreign key referencing tipo
  ON DELETE CASCADE
);

CREATE TABLE abbonamento_prezzo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('mensile', 'annuale') NOT NULL,
  costo DECIMAL(10, 2) NOT NULL
);
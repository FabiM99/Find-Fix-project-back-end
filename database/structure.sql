CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    città VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    tipo_abbonamento ENUM('mensile', 'annuale', 'nessuno') DEFAULT 'nessuno',
    user_type ENUM('cliente', 'professionista') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE professionals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    p_iva VARCHAR(50) NOT NULL,
    categoria_servizi VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create User table
CREATE TABLE `User` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'profesor') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (`email`),
  INDEX idx_role (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Profesor table
CREATE TABLE `Profesor` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `nume` VARCHAR(100) NOT NULL,
  `prenume` VARCHAR(100) NOT NULL,
  `limita_studenti` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_profesor_user FOREIGN KEY (`user_id`) 
    REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_nume_prenume (`nume`, `prenume`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Student table
CREATE TABLE `Student` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `nume` VARCHAR(100) NOT NULL,
  `prenume` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_user FOREIGN KEY (`user_id`) 
    REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_nume_prenume (`nume`, `prenume`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create SesiuneInscriere table
CREATE TABLE `SesiuneInscriere` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `profesor_id` INT NOT NULL,
  `data_inceput` DATETIME NOT NULL,
  `data_sfarsit` DATETIME NOT NULL,
  `limita_studenti` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sesiune_profesor FOREIGN KEY (`profesor_id`) 
    REFERENCES `Profesor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_profesor_id (`profesor_id`),
  INDEX idx_data_inceput (`data_inceput`),
  INDEX idx_data_sfarsit (`data_sfarsit`),
  CONSTRAINT check_date_range CHECK (`data_inceput` < `data_sfarsit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create CerereDisertatie table
CREATE TABLE `CerereDisertatie` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `sesiune_id` INT NOT NULL,
  `profesor_id` INT NOT NULL,
  `status` ENUM('pending', 'aprobat', 'respins') NOT NULL DEFAULT 'pending',
  `justificare_respingere` TEXT,
  `fisier_semnat_url` VARCHAR(500),
  `fisier_raspuns_url` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cerere_student FOREIGN KEY (`student_id`) 
    REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cerere_sesiune FOREIGN KEY (`sesiune_id`) 
    REFERENCES `SesiuneInscriere` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cerere_profesor FOREIGN KEY (`profesor_id`) 
    REFERENCES `Profesor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uk_student_sesiune (student_id, sesiune_id),
  INDEX idx_status (`status`),
  INDEX idx_profesor_id (`profesor_id`),
  INDEX idx_created_at (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

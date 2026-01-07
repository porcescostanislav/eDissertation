-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('student', 'profesor') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profesor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `nume` VARCHAR(191) NOT NULL,
    `prenume` VARCHAR(191) NOT NULL,
    `limita_studenti` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Profesor_user_id_key`(`user_id`),
    INDEX `Profesor_nume_prenume_idx`(`nume`, `prenume`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `nume` VARCHAR(191) NOT NULL,
    `prenume` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Student_user_id_key`(`user_id`),
    INDEX `Student_nume_prenume_idx`(`nume`, `prenume`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SesiuneInscriere` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profesor_id` INTEGER NOT NULL,
    `data_inceput` DATETIME(3) NOT NULL,
    `data_sfarsit` DATETIME(3) NOT NULL,
    `limita_studenti` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SesiuneInscriere_profesor_id_idx`(`profesor_id`),
    INDEX `SesiuneInscriere_data_inceput_idx`(`data_inceput`),
    INDEX `SesiuneInscriere_data_sfarsit_idx`(`data_sfarsit`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CerereDisertatie` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `sesiune_id` INTEGER NOT NULL,
    `profesor_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `justificare_respingere` TEXT NULL,
    `fisier_semnat_url` VARCHAR(500) NULL,
    `fisier_raspuns_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CerereDisertatie_status_idx`(`status`),
    INDEX `CerereDisertatie_profesor_id_idx`(`profesor_id`),
    INDEX `CerereDisertatie_created_at_idx`(`created_at`),
    UNIQUE INDEX `uk_student_sesiune`(`student_id`, `sesiune_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Profesor` ADD CONSTRAINT `Profesor_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SesiuneInscriere` ADD CONSTRAINT `SesiuneInscriere_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `Profesor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CerereDisertatie` ADD CONSTRAINT `CerereDisertatie_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CerereDisertatie` ADD CONSTRAINT `CerereDisertatie_sesiune_id_fkey` FOREIGN KEY (`sesiune_id`) REFERENCES `SesiuneInscriere`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CerereDisertatie` ADD CONSTRAINT `CerereDisertatie_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `Profesor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

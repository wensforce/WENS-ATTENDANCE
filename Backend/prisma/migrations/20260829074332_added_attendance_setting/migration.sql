-- CreateTable
CREATE TABLE `attendance_setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lateBufferMinutes` INTEGER NOT NULL DEFAULT 15,
    `checkInRadius` INTEGER NOT NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

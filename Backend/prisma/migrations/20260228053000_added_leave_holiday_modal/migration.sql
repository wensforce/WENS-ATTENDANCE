-- CreateTable
CREATE TABLE `LeaveAndHoliday` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeIds` TEXT NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('LEAVE', 'HOLIDAY') NOT NULL DEFAULT 'LEAVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

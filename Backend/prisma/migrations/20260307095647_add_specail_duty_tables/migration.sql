-- AlterTable
ALTER TABLE `attendance` MODIFY `status` ENUM('PRESENT', 'OVERTIME', 'LATE') NOT NULL DEFAULT 'PRESENT';

-- CreateTable
CREATE TABLE `SpecialAttendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `checkInTime` DATETIME(3) NULL,
    `checkOutTime` DATETIME(3) NULL,
    `checkInLocation` VARCHAR(191) NULL,
    `checkOutLocation` VARCHAR(191) NULL,
    `checkInPhoto` VARCHAR(191) NULL,
    `checkOutPhoto` VARCHAR(191) NULL,
    `extraTime` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

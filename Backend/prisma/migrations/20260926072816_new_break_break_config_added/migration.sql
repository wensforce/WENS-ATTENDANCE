-- CreateTable
CREATE TABLE `break_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NULL,
    `breakType` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `maxDurationMins` INTEGER NOT NULL,
    `maxPerDay` INTEGER NOT NULL,
    `isPaid` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `graceMins` INTEGER NOT NULL DEFAULT 5,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `applicableRoles` VARCHAR(191) NULL,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `break_config_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_break_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NULL,
    `userId` INTEGER NOT NULL,
    `breakConfigId` INTEGER NOT NULL,
    `isAllowed` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_break_config_userId_breakConfigId_key`(`userId`, `breakConfigId`),
    UNIQUE INDEX `user_break_config_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `break` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NULL,
    `attendanceId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `breakConfigId` INTEGER NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `durationMins` INTEGER NULL,
    `isOverLimit` BOOLEAN NOT NULL DEFAULT false,
    `autoClosed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `break_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `break_config` ADD CONSTRAINT `break_config_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_break_config` ADD CONSTRAINT `user_break_config_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_break_config` ADD CONSTRAINT `user_break_config_breakConfigId_fkey` FOREIGN KEY (`breakConfigId`) REFERENCES `break_config`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `break` ADD CONSTRAINT `break_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `break` ADD CONSTRAINT `break_breakConfigId_fkey` FOREIGN KEY (`breakConfigId`) REFERENCES `break_config`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `break` ADD CONSTRAINT `break_attendanceId_fkey` FOREIGN KEY (`attendanceId`) REFERENCES `attendance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

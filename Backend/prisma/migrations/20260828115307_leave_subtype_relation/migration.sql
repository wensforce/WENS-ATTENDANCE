-- AlterTable
ALTER TABLE `leave_and_holiday` ADD COLUMN `subTypeId` INTEGER NULL;

-- CreateTable
CREATE TABLE `leave_sub_type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `leave_sub_type_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `leave_and_holiday_subTypeId_idx` ON `leave_and_holiday`(`subTypeId`);

-- AddForeignKey
ALTER TABLE `leave_and_holiday` ADD CONSTRAINT `leave_and_holiday_subTypeId_fkey` FOREIGN KEY (`subTypeId`) REFERENCES `leave_sub_type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

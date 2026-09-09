/*
  Warnings:

  - A unique constraint covering the columns `[tenantId]` on the table `attendance_setting` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `designation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `leave_sub_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,employeeId]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `department_name_key` ON `department`;

-- DropIndex
DROP INDEX `designation_name_key` ON `designation`;

-- DropIndex
DROP INDEX `leave_sub_type_name_key` ON `leave_sub_type`;

-- DropIndex
DROP INDEX `user_employeeId_key` ON `user`;

-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `tenantId` INTEGER NULL,
    MODIFY `status` ENUM('PRESENT', 'OVERTIME', 'WORK_FROM_HOME', 'HALF_DAY', 'LATE', 'ABSENT') NOT NULL DEFAULT 'PRESENT';

-- AlterTable
ALTER TABLE `attendance_setting` ADD COLUMN `tenantId` INTEGER NULL;

-- AlterTable
ALTER TABLE `department` ADD COLUMN `tenantId` INTEGER NULL;

-- AlterTable
ALTER TABLE `designation` ADD COLUMN `tenantId` INTEGER NULL;

-- AlterTable
ALTER TABLE `leave_and_holiday` ADD COLUMN `tenantId` INTEGER NULL;

-- AlterTable
ALTER TABLE `leave_sub_type` ADD COLUMN `tenantId` INTEGER NULL;

-- AlterTable
ALTER TABLE `special_attendance` ADD COLUMN `tenantId` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `tenantId` INTEGER NULL,
    MODIFY `userType` ENUM('EMPLOYEE', 'ADMIN', 'BODYGUARD', 'SUPERADMIN') NOT NULL DEFAULT 'EMPLOYEE';

-- AlterTable
ALTER TABLE `webhook` ADD COLUMN `tenantId` INTEGER NULL;

-- CreateTable
CREATE TABLE `tenant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenant_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attendance_tenantId_idx` ON `attendance`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `attendance_setting_tenantId_key` ON `attendance_setting`(`tenantId`);

-- CreateIndex
CREATE INDEX `department_tenantId_idx` ON `department`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `department_tenantId_name_key` ON `department`(`tenantId`, `name`);

-- CreateIndex
CREATE INDEX `designation_tenantId_idx` ON `designation`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `designation_tenantId_name_key` ON `designation`(`tenantId`, `name`);

-- CreateIndex
CREATE INDEX `leave_and_holiday_tenantId_idx` ON `leave_and_holiday`(`tenantId`);

-- CreateIndex
CREATE INDEX `leave_sub_type_tenantId_idx` ON `leave_sub_type`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `leave_sub_type_tenantId_name_key` ON `leave_sub_type`(`tenantId`, `name`);

-- CreateIndex
CREATE INDEX `special_attendance_tenantId_idx` ON `special_attendance`(`tenantId`);

-- CreateIndex
CREATE INDEX `user_tenantId_idx` ON `user`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `user_tenantId_employeeId_key` ON `user`(`tenantId`, `employeeId`);

-- CreateIndex
CREATE INDEX `webhook_tenantId_idx` ON `webhook`(`tenantId`);

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `special_attendance` ADD CONSTRAINT `special_attendance_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_and_holiday` ADD CONSTRAINT `leave_and_holiday_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_sub_type` ADD CONSTRAINT `leave_sub_type_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department` ADD CONSTRAINT `department_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `designation` ADD CONSTRAINT `designation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webhook` ADD CONSTRAINT `webhook_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_setting` ADD CONSTRAINT `attendance_setting_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

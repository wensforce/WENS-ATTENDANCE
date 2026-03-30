/*
  Warnings:

  - You are about to drop the column `employeeIds` on the `leaveandholiday` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `leaveandholiday` DROP COLUMN `employeeIds`;

-- CreateTable
CREATE TABLE `LeaveEmployee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaveId` INTEGER NOT NULL,
    `employeeId` INTEGER NOT NULL,

    INDEX `LeaveEmployee_leaveId_idx`(`leaveId`),
    INDEX `LeaveEmployee_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeaveEmployee` ADD CONSTRAINT `LeaveEmployee_leaveId_fkey` FOREIGN KEY (`leaveId`) REFERENCES `LeaveAndHoliday`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

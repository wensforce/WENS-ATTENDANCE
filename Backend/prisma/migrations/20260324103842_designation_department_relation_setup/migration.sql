/*
  Warnings:

  - You are about to drop the column `department` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `designation` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `department`,
    DROP COLUMN `designation`,
    ADD COLUMN `departmentId` INTEGER NULL,
    ADD COLUMN `designationId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_designationId_fkey` FOREIGN KEY (`designationId`) REFERENCES `Designation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

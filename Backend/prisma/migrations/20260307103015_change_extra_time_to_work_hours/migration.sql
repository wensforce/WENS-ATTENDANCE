/*
  Warnings:

  - You are about to drop the column `extraTime` on the `specialattendance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `specialattendance` DROP COLUMN `extraTime`,
    ADD COLUMN `workHours` VARCHAR(191) NULL;

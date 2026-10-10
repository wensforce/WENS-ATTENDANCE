/*
  Warnings:

  - You are about to alter the column `checkInLocation` on the `attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - You are about to alter the column `checkOutLocation` on the `attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - You are about to alter the column `checkInLocation` on the `special_attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - You are about to alter the column `checkOutLocation` on the `special_attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `attendance` MODIFY `checkInLocation` JSON NULL,
    MODIFY `checkOutLocation` JSON NULL;

-- AlterTable
ALTER TABLE `special_attendance` MODIFY `checkInLocation` JSON NULL,
    MODIFY `checkOutLocation` JSON NULL;

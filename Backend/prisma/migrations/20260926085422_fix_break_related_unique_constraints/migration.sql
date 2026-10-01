/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,breakType]` on the table `break_config` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `break` DROP FOREIGN KEY `break_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `break_config` DROP FOREIGN KEY `break_config_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `user_break_config` DROP FOREIGN KEY `user_break_config_tenantId_fkey`;

-- DropIndex
DROP INDEX `break_tenantId_key` ON `break`;

-- DropIndex
DROP INDEX `break_config_tenantId_key` ON `break_config`;

-- DropIndex
DROP INDEX `user_break_config_tenantId_key` ON `user_break_config`;

-- CreateIndex
CREATE INDEX `break_tenantId_idx` ON `break`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `break_config_tenantId_breakType_key` ON `break_config`(`tenantId`, `breakType`);

-- CreateIndex
CREATE INDEX `user_break_config_tenantId_idx` ON `user_break_config`(`tenantId`);

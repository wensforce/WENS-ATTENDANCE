-- AlterTable
ALTER TABLE `leave_sub_type` ADD COLUMN `type` ENUM('LEAVE', 'HOLIDAY') NULL DEFAULT 'LEAVE';

-- DropForeignKey
ALTER TABLE `leaveemployee` DROP FOREIGN KEY `LeaveEmployee_leaveId_fkey`;

-- AddForeignKey
ALTER TABLE `LeaveEmployee` ADD CONSTRAINT `LeaveEmployee_leaveId_fkey` FOREIGN KEY (`leaveId`) REFERENCES `LeaveAndHoliday`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveEmployee` ADD CONSTRAINT `LeaveEmployee_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

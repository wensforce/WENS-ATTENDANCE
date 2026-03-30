-- AddForeignKey
ALTER TABLE `SpecialAttendance` ADD CONSTRAINT `SpecialAttendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

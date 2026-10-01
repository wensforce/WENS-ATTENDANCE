-- CreateIndex
CREATE INDEX `break_userId_idx` ON `break`(`userId`);

-- AddForeignKey
ALTER TABLE `break` ADD CONSTRAINT `break_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

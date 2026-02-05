-- Pre-existing table:
--CREATE TABLE `whitelist` (
--    `uuid` VARCHAR(60) NOT NULL,
--    `name` VARCHAR(20) NOT NULL,
--    `whitelisted` INTEGER NOT NULL,
--
--    PRIMARY KEY (`uuid`)
--) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ai_ci;
--...needs a little change:
ALTER TABLE whitelist MODIFY COLUMN uuid varchar(60) COLLATE utf8mb4_unicode_ci;


-- CreateTable
CREATE TABLE `users` (
    `discordsnowflakeid` VARCHAR(191) NOT NULL,
    `altOf` VARCHAR(191) NULL,
    `invitedBy` VARCHAR(191) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `reason` VARCHAR(512) NULL,

    PRIMARY KEY (`discordsnowflakeid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `owner` VARCHAR(191) NOT NULL,
    `mcuuid` VARCHAR(60) NOT NULL,
    `altreason` VARCHAR(512) NULL,
    `playtime` VARCHAR(512) NOT NULL,

    UNIQUE INDEX `accounts_mcuuid_key`(`mcuuid`),
    PRIMARY KEY (`owner`, `mcuuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_altOf_fkey` FOREIGN KEY (`altOf`) REFERENCES `users`(`discordsnowflakeid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_invitedBy_fkey` FOREIGN KEY (`invitedBy`) REFERENCES `users`(`discordsnowflakeid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`discordsnowflakeid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_mcuuid_fkey` FOREIGN KEY (`mcuuid`) REFERENCES `whitelist`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_owner_fkey` FOREIGN KEY (`owner`) REFERENCES `users`(`discordsnowflakeid`) ON DELETE RESTRICT ON UPDATE CASCADE;

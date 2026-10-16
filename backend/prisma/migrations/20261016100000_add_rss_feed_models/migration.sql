-- CreateTable
CREATE TABLE `rss_sources` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `pollingInterval` INTEGER NOT NULL DEFAULT 60,
    `lastFetchedAt` DATETIME(3) NULL,
    `lastSuccessAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `etag` VARCHAR(191) NULL,
    `lastModified` VARCHAR(191) NULL,
    `itemCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rss_sources_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rss_items` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `guid` VARCHAR(500) NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `title` TEXT NOT NULL,
    `titleGu` TEXT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NULL,
    `author` VARCHAR(191) NULL,
    `imageUrl` TEXT NULL,
    `categoryName` VARCHAR(191) NULL,
    `targetCategoryId` VARCHAR(191) NULL,
    `pubDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED') NOT NULL DEFAULT 'PENDING',
    `publishedPostId` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rss_items_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `rss_items_sourceId_status_idx`(`sourceId`, `status`),
    INDEX `rss_items_targetCategoryId_fkey`(`targetCategoryId`),
    UNIQUE INDEX `rss_items_sourceId_guid_key`(`sourceId`, `guid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rss_fetch_logs` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `itemsFound` INTEGER NOT NULL DEFAULT 0,
    `itemsImported` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rss_fetch_logs_sourceId_createdAt_idx`(`sourceId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rss_sources` ADD CONSTRAINT `rss_sources_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rss_items` ADD CONSTRAINT `rss_items_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `rss_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rss_items` ADD CONSTRAINT `rss_items_targetCategoryId_fkey` FOREIGN KEY (`targetCategoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rss_fetch_logs` ADD CONSTRAINT `rss_fetch_logs_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `rss_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

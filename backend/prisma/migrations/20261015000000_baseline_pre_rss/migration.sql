-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'EDITOR', 'REPORTER', 'SEO', 'ADVERTISEMENT', 'PHOTOGRAPHER') NOT NULL DEFAULT 'REPORTER',
    `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `isFirstLogin` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_tokenHash_key`(`tokenHash`),
    INDEX `sessions_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authors` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameGu` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NOT NULL,
    `image` TEXT NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `designationGu` VARCHAR(191) NOT NULL,
    `designationHi` VARCHAR(191) NOT NULL,
    `bio` TEXT NOT NULL,
    `bioGu` TEXT NOT NULL,
    `bioHi` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `authors_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameGu` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `descriptionGu` TEXT NULL,
    `descriptionHi` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `headerOrder` INTEGER NOT NULL DEFAULT 0,
    `homeOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `showInHome` BOOLEAN NOT NULL DEFAULT true,
    `showInHeader` BOOLEAN NOT NULL DEFAULT true,
    `headerType` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `articleNumber` INTEGER NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'gu',
    `title` VARCHAR(191) NOT NULL,
    `titleGu` VARCHAR(191) NOT NULL,
    `titleHi` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `excerptGu` TEXT NULL,
    `excerptHi` TEXT NULL,
    `content` TEXT NOT NULL,
    `contentGu` TEXT NOT NULL,
    `contentHi` TEXT NOT NULL,
    `featuredImage` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'SCHEDULED') NOT NULL DEFAULT 'DRAFT',
    `scheduledAt` DATETIME(3) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `readingTime` INTEGER NOT NULL DEFAULT 0,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `isTrending` BOOLEAN NOT NULL DEFAULT false,
    `isBreaking` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `views` INTEGER NOT NULL DEFAULT 0,
    `seoTitle` TEXT NULL,
    `seoDescription` TEXT NULL,
    `seoKeywords` TEXT NULL,
    `canonicalUrl` TEXT NULL,
    `metaRobots` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    UNIQUE INDEX `posts_articleNumber_key`(`articleNumber`),
    INDEX `posts_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `posts_categoryId_status_createdAt_idx`(`categoryId`, `status`, `createdAt`),
    INDEX `posts_isTrending_status_createdAt_idx`(`isTrending`, `status`, `createdAt`),
    INDEX `posts_isFeatured_status_createdAt_idx`(`isFeatured`, `status`, `createdAt`),
    INDEX `posts_isBreaking_status_createdAt_idx`(`isBreaking`, `status`, `createdAt`),
    INDEX `posts_status_views_createdAt_idx`(`status`, `views`, `createdAt`),
    INDEX `posts_status_articleNumber_idx`(`status`, `articleNumber`),
    INDEX `posts_categoryId_status_articleNumber_idx`(`categoryId`, `status`, `articleNumber`),
    INDEX `posts_status_isFeatured_articleNumber_idx`(`status`, `isFeatured`, `articleNumber`),
    INDEX `posts_categoryId_status_isFeatured_articleNumber_idx`(`categoryId`, `status`, `isFeatured`, `articleNumber`),
    INDEX `posts_authorId_fkey`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameGu` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_tags` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    INDEX `post_tags_tagId_fkey`(`tagId`),
    UNIQUE INDEX `post_tags_postId_tagId_key`(`postId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `videos` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `titleGu` VARCHAR(191) NOT NULL,
    `titleHi` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `thumbnail` TEXT NOT NULL,
    `youtubeId` VARCHAR(191) NOT NULL,
    `embedUrl` TEXT NOT NULL,
    `duration` VARCHAR(191) NOT NULL DEFAULT '0:00',
    `type` VARCHAR(191) NOT NULL DEFAULT 'video',
    `categoryId` VARCHAR(191) NULL,
    `categoryName` VARCHAR(191) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `channel` VARCHAR(191) NULL DEFAULT 'Gujarat Post News',
    `views` INTEGER NOT NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `videos_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_photos` (
    `id` VARCHAR(191) NOT NULL,
    `src` TEXT NOT NULL,
    `alt` VARCHAR(191) NOT NULL,
    `caption` TEXT NOT NULL,
    `captionGu` TEXT NOT NULL,
    `captionHi` TEXT NOT NULL,
    `category` VARCHAR(191) NULL DEFAULT 'સમાચાર',
    `photographer` VARCHAR(191) NOT NULL,
    `copyright` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instagram_stories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameGu` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NOT NULL,
    `avatar` TEXT NOT NULL,
    `hasUnseen` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instagram_story_slides` (
    `id` VARCHAR(191) NOT NULL,
    `storyId` VARCHAR(191) NOT NULL,
    `mediaType` VARCHAR(191) NOT NULL DEFAULT 'image',
    `mediaUrl` TEXT NOT NULL,
    `captionEn` TEXT NOT NULL,
    `captionGu` TEXT NOT NULL,
    `captionHi` TEXT NOT NULL,
    `timestampGu` VARCHAR(191) NOT NULL DEFAULT 'હમણાં જ',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `instagram_story_slides_storyId_fkey`(`storyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `web_stories` (
    `id` VARCHAR(191) NOT NULL,
    `heading` VARCHAR(191) NOT NULL,
    `headingGu` VARCHAR(191) NULL,
    `headingHi` VARCHAR(191) NULL,
    `image1` TEXT NOT NULL,
    `image2` TEXT NULL,
    `image3` TEXT NULL,
    `image4` TEXT NULL,
    `image5` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `breaking_ticker_items` (
    `id` VARCHAR(191) NOT NULL,
    `en` TEXT NOT NULL,
    `gu` TEXT NOT NULL,
    `hi` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `astrology_signs` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameGu` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NOT NULL,
    `image` TEXT NOT NULL,
    `prediction` TEXT NOT NULL,
    `predictionGu` TEXT NOT NULL,
    `detailsJson` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `astrology_signs_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hero_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `slot1Id` VARCHAR(191) NULL,
    `slot2Id` VARCHAR(191) NULL,
    `slot3Id` VARCHAR(191) NULL,
    `tickerLabel` TEXT NULL,
    `trendingTopics` TEXT NULL,
    `trendingNewsIds` TEXT NULL,
    `popularNewsIds` TEXT NULL,
    `mostReadIds` TEXT NULL,
    `heroGridIds` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reels` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'INSTAGRAM',
    `heading` TEXT NOT NULL,
    `headingGu` TEXT NOT NULL,
    `headingHi` TEXT NOT NULL,
    `videoUrl` TEXT NULL,
    `instaUrl` TEXT NULL,
    `thumbnail` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `scheduledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `advertisements` (
    `id` VARCHAR(191) NOT NULL,
    `section` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `includeInRandom` BOOLEAN NOT NULL DEFAULT false,
    `mediaType` VARCHAR(191) NOT NULL DEFAULT 'IMAGE',
    `image1` TEXT NULL,
    `link1` TEXT NULL,
    `image2` TEXT NULL,
    `link2` TEXT NULL,
    `image3` TEXT NULL,
    `link3` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `advertisements_section_key`(`section`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `epaper_editions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT 'City Edition',
    `city` VARCHAR(191) NOT NULL,
    `cityGu` VARCHAR(191) NULL,
    `cityHi` VARCHAR(191) NULL,
    `date` VARCHAR(191) NOT NULL,
    `pages` INTEGER NOT NULL DEFAULT 24,
    `fileUrl` TEXT NOT NULL,
    `thumbnailUrl` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `publishTime` VARCHAR(191) NULL DEFAULT '06:00 AM',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `editionType` VARCHAR(191) NOT NULL DEFAULT 'PDF',
    `templateData` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `epaper_editions_city_date_status_idx`(`city`, `date`, `status`),
    INDEX `epaper_editions_isActive_status_date_idx`(`isActive`, `status`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `epaper_cities` (
    `id` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `cityGu` VARCHAR(191) NULL,
    `cityHi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `epaper_cities_city_key`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `qrCodeImage` TEXT NULL,
    `upiId` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `branchName` VARCHAR(191) NULL,
    `noteGu` TEXT NULL,
    `noteEn` TEXT NULL,
    `noteHi` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `about_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `titleGu` TEXT NULL,
    `titleEn` TEXT NULL,
    `titleHi` TEXT NULL,
    `subtitleGu` TEXT NULL,
    `subtitleEn` TEXT NULL,
    `subtitleHi` TEXT NULL,
    `descriptionGu` LONGTEXT NULL,
    `descriptionEn` LONGTEXT NULL,
    `descriptionHi` LONGTEXT NULL,
    `bannerImage` TEXT NULL,
    `missionGu` TEXT NULL,
    `missionEn` TEXT NULL,
    `missionHi` TEXT NULL,
    `visionGu` TEXT NULL,
    `visionEn` TEXT NULL,
    `visionHi` TEXT NULL,
    `rulesTitle` VARCHAR(255) NULL DEFAULT 'અમારા અડગ નિયમો',
    `rulesJson` LONGTEXT NULL,
    `valuesJson` LONGTEXT NULL,
    `statsJson` LONGTEXT NULL,
    `teamJson` LONGTEXT NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `contactAddress` TEXT NULL,
    `whatsappNumber` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `pageTitle` VARCHAR(255) NULL DEFAULT 'સંપર્ક કરો (Contact Us)',
    `pageSubtitle` TEXT NULL,
    `headOfficeAddress` TEXT NULL,
    `primaryPhone` VARCHAR(191) NULL DEFAULT '+91 99099 07237',
    `whatsappNumber` VARCHAR(191) NULL DEFAULT '+91 99099 07237',
    `primaryEmail` VARCHAR(191) NULL DEFAULT 'contact@gujaratpost.in',
    `workingHours` VARCHAR(255) NULL DEFAULT 'સોમવાર - શનિવાર: 9:00 AM - 9:00 PM | રવિવાર: 24x7 ન્યૂઝ ડેસ્ક',
    `mapEmbedUrl` TEXT NULL,
    `editorialEmail` VARCHAR(191) NULL DEFAULT 'editorial@gujaratpost.in',
    `editorialPhone` VARCHAR(191) NULL DEFAULT '+91 99099 07237',
    `adsEmail` VARCHAR(191) NULL DEFAULT 'ads@gujaratpost.in',
    `adsPhone` VARCHAR(191) NULL DEFAULT '+91 99099 07237',
    `grievanceName` VARCHAR(191) NULL DEFAULT 'મહેશ પટેલ (Mahesh Patel)',
    `grievanceDesignation` VARCHAR(191) NULL DEFAULT 'તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)',
    `grievanceEmail` VARCHAR(191) NULL DEFAULT 'grievance@gujaratpost.in',
    `grievanceAddress` TEXT NULL,
    `bureauOfficesJson` LONGTEXT NULL,
    `socialLinksJson` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `advertise_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `pageTitle` VARCHAR(255) NULL DEFAULT 'Advertise With Us',
    `description` LONGTEXT NULL,
    `officeAddress` TEXT NULL,
    `locationUrl` TEXT NULL,
    `contactPhone` VARCHAR(191) NULL DEFAULT '079 4000 4000 / +91 99099 07237',
    `onlineAdsEmail` VARCHAR(191) NULL DEFAULT 'digital.advertising@gujaratpost.in',
    `printAdsEmail` VARCHAR(191) NULL DEFAULT 'advt@gujaratpost.in & epaper@gujaratpost.in',
    `websiteUrl` VARCHAR(255) NULL DEFAULT 'https://gujaratpost.in/',
    `socialLinksJson` LONGTEXT NULL,
    `appLinksJson` LONGTEXT NULL,
    `badgeText` VARCHAR(255) NULL DEFAULT 'Partner With Gujarat Post',
    `pageSubtitle` TEXT NULL,
    `contactEmail` VARCHAR(191) NULL DEFAULT 'ads@gujaratpost.in',
    `whatsappNumber` VARCHAR(191) NULL DEFAULT '+91 99099 07237',
    `workingHours` VARCHAR(255) NULL DEFAULT 'Monday - Saturday: 9:00 AM - 8:00 PM',
    `rateCardNote` TEXT NULL,
    `rateCardPdfUrl` TEXT NULL,
    `statsJson` LONGTEXT NULL,
    `adOptionsJson` LONGTEXT NULL,
    `benefitsJson` LONGTEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL DEFAULT 'General',
    `subject` VARCHAR(255) NOT NULL,
    `message` LONGTEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legal_pages` (
    `id` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(255) NOT NULL,
    `lastUpdated` VARCHAR(191) NULL,
    `introText` LONGTEXT NULL,
    `sectionsJson` LONGTEXT NULL,
    `contentHtml` LONGTEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tributes` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'BIRTHDAY',
    `name` VARCHAR(255) NOT NULL,
    `photo` TEXT NULL,
    `date` VARCHAR(100) NULL,
    `info` TEXT NULL,
    `templateId` VARCHAR(50) NOT NULL DEFAULT 'golden',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `startDate` VARCHAR(50) NULL,
    `endDate` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tributes_type_isActive_idx`(`type`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authors` ADD CONSTRAINT `authors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `authors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `videos` ADD CONSTRAINT `videos_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instagram_story_slides` ADD CONSTRAINT `instagram_story_slides_storyId_fkey` FOREIGN KEY (`storyId`) REFERENCES `instagram_stories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


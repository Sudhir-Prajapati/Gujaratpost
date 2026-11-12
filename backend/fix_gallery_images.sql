-- Dailyhunt & Gallery Fix: Touch updatedAt for top galleries so Dailyhunt RSS picks up fresh news
START TRANSACTION;

-- Touch Megha Shukla & Varun Dhawan so Dailyhunt re-fetches and replaces the blank thumbnail
UPDATE gallery_photos SET updatedAt = NOW() WHERE id = '387c75e2-6a0d-41fd-b87e-8bd64eeeb3b7';
UPDATE gallery_photos SET updatedAt = NOW() WHERE id = '70edf945-3919-4df2-b714-1c329c776765';

-- Touch top 25 recent photo galleries so Dailyhunt immediately detects them as newly published
UPDATE gallery_photos SET updatedAt = NOW() ORDER BY createdAt DESC LIMIT 25;

COMMIT;

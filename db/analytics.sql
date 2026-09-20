-- ==========================================================
-- DORMIE UBU ANALYTICS EVENTS SCHEMA
-- ระบบบันทึกสถิติการใช้งานเว็บไซต์ หอพัก ม.อุบลฯ
-- ==========================================================

USE `ubu_dormitory_db`;

CREATE TABLE IF NOT EXISTS `analytics_events` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `event_name` VARCHAR(50) NOT NULL COMMENT 'page_view, search, dormitory_view, map_click, navigation_click',
    `session_id` VARCHAR(64) NOT NULL COMMENT 'Anonymous session identifier for counting sessions',
    `visitor_id` VARCHAR(64) NOT NULL COMMENT 'Anonymous unique visitor identifier for counting unique visitors',
    `user_id` VARCHAR(64) NULL COMMENT 'Authenticated user identifier if any (nullable)',
    `page` VARCHAR(255) NULL COMMENT 'Page path or URL',
    `dormitory_id` INT NULL COMMENT 'Target dormitory ID (nullable)',
    `dormitory_name` VARCHAR(150) NULL COMMENT 'Target dormitory name (nullable)',
    `search_keyword` VARCHAR(255) NULL COMMENT 'Search keyword (nullable)',
    `metadata` JSON NULL COMMENT 'Additional context data (nullable)',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_analytics_event_name` (`event_name`),
    INDEX `idx_analytics_created_at` (`created_at`),
    INDEX `idx_analytics_visitor_id` (`visitor_id`),
    INDEX `idx_analytics_dormitory_id` (`dormitory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

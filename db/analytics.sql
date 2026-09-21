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
    `actor_type` VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT 'user, admin, system',
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
    INDEX `idx_analytics_dormitory_id` (`dormitory_id`),
    INDEX `idx_analytics_actor_type` (`actor_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `analytics_reset_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `reset_at` VARCHAR(50) NOT NULL COMMENT 'ISO timestamp of reset point',
    `created_by` VARCHAR(100) NOT NULL COMMENT 'Admin username',
    `created_at` VARCHAR(50) NOT NULL COMMENT 'ISO timestamp',
    `note` TEXT NULL,
    INDEX `idx_analytics_reset_at` (`reset_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` VARCHAR(100) NOT NULL,
    `action` VARCHAR(100) NOT NULL COMMENT 'LOGIN, LOGOUT, RESET_ANALYTICS, VIEW_ANALYTICS_HISTORY',
    `created_at` VARCHAR(50) NOT NULL COMMENT 'ISO timestamp',
    `metadata` JSON NULL,
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_identifiers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `identifier_type` VARCHAR(50) NOT NULL COMMENT 'visitor_id, session_id',
    `identifier_value` VARCHAR(100) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_admin_id_type_val` (`identifier_type`, `identifier_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

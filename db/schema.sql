-- ==========================================================
-- UBU WHITE DORMITORY DATABASE SCHEMA (CHEN'S MODEL DESIGN)
-- ระบบฐานข้อมูลหอพักสีขาว มหาวิทยาลัยอุบลราชธานี
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `ubu_dormitory_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `ubu_dormitory_db`;

-- 1. Entity: ZONE (โซนพื้นที่รอบมหาวิทยาลัย)
CREATE TABLE IF NOT EXISTS `zones` (
    `zone_id` INT AUTO_INCREMENT PRIMARY KEY,
    `zone_name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'ชื่อโซน เช่น โซนบ้านแมด, โซนบ้านศรีไคออก, โซนประตู 1',
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Entity: DORMITORY (ข้อมูลหลักหอพัก)
CREATE TABLE IF NOT EXISTS `dormitories` (
    `dorm_id` INT AUTO_INCREMENT PRIMARY KEY,
    `zone_id` INT NOT NULL,
    `dorm_name` VARCHAR(150) NOT NULL COMMENT 'ชื่อหอพัก',
    `gender_type` ENUM('หอพักชาย', 'หอพักหญิง', 'หอพักรวม') NOT NULL DEFAULT 'หอพักรวม',
    `room_type` VARCHAR(100) NOT NULL COMMENT 'ห้องพัดลม / ห้องแอร์ / พัดลมและแอร์',
    `min_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาเริ่มต้น (บาท/เดือน)',
    `max_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาสูงสุด (บาท/เดือน)',
    `water_rate` VARCHAR(50) NOT NULL COMMENT 'ค่าน้ำ (เช่น 150 บาท/คน หรือ 25 บาท/หน่วย)',
    `electric_rate` VARCHAR(50) NOT NULL COMMENT 'ค่าไฟ (เช่น 8 บาท/หน่วย)',
    `deposit_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'ค่ามัดจำ',
    `min_lease_period` VARCHAR(50) NOT NULL DEFAULT '6 เดือน' COMMENT 'สัญญาขั้นต่ำ',
    `latitude` DECIMAL(10, 8) NOT NULL COMMENT 'พิกัดละติจูด',
    `longitude` DECIMAL(11, 8) NOT NULL COMMENT 'พิกัดลองจิจูด',
    `phone_number` VARCHAR(50) NULL COMMENT 'เบอร์โทรศัพท์ติดต่อ',
    `line_id` VARCHAR(50) NULL COMMENT 'Line ID',
    `facebook_page` VARCHAR(150) NULL COMMENT 'ชื่อ Facebook หรือ ลิงก์เพจ',
    `allow_pet` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'การเลี้ยงสัตว์ (ได้/ไม่ได้)',
    `allow_cooking` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'การประกอบอาหาร (ได้/ไม่ได้)',
    `gate_closing_time` VARCHAR(50) NOT NULL DEFAULT 'ไม่ปิด' COMMENT 'เวลาเปิด-ปิดประตูหอ',
    `cover_image` VARCHAR(255) NULL COMMENT 'รูปภาพหน้าปกหอพัก',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`zone_id`) REFERENCES `zones`(`zone_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Entity: WHITE_DORM_EVALUATION (ผลประเมินหอพักสีขาว)
CREATE TABLE IF NOT EXISTS `white_dorm_evaluations` (
    `eval_id` INT AUTO_INCREMENT PRIMARY KEY,
    `dorm_id` INT NOT NULL UNIQUE,
    `eval_date` VARCHAR(50) NULL COMMENT 'วันที่ประเมิน เช่น 5-พ.ค.-69',
    `required_standards` VARCHAR(50) NOT NULL DEFAULT 'ครบ' COMMENT 'มาตรฐานที่ต้องมี (ครบ/ไม่ครบ)',
    `additional_standards` VARCHAR(50) NOT NULL DEFAULT 'ครบ' COMMENT 'มาตรฐานเพิ่มเติม (ครบ/ไม่ครบ)',
    `eval_result` ENUM('ผ่าน', 'ไม่ผ่าน', 'ปรับปรุง') NOT NULL DEFAULT 'ผ่าน' COMMENT 'ผลการประเมินหอพักสีขาว',
    `remarks` TEXT NULL COMMENT 'หมายเหตุข้อเสนอแนะ',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`dorm_id`) REFERENCES `dormitories`(`dorm_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Entity: DORM_FACILITIES (สิ่งอำนวยความสะดวกและความปลอดภัย)
CREATE TABLE IF NOT EXISTS `dorm_facilities` (
    `facility_id` INT AUTO_INCREMENT PRIMARY KEY,
    `dorm_id` INT NOT NULL UNIQUE,
    `has_water_heater` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'เครื่องทำน้ำอุ่น',
    `has_fridge` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'ตู้เย็น',
    `has_wardrobe` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'ตู้เสื้อผ้า',
    `has_bed` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'เตียง',
    `has_desk` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'โต๊ะเขียนหนังสือ',
    `has_free_wifi` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Wi-Fi ฟรี',
    `has_elevator` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'ลิฟต์',
    `has_common_area` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'พื้นที่ส่วนกลาง',
    `has_washing_machine` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'เครื่องซักผ้าหยอดเหรียญ',
    `has_parking` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'ที่จอดรถยนต์/มอเตอร์ไซค์',
    `has_keycard` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'ระบบคีย์การ์ด',
    `has_cctv` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'กล้อง CCTV',
    `has_security_guard` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'เจ้าหน้าที่ รปภ.',
    FOREIGN KEY (`dorm_id`) REFERENCES `dormitories`(`dorm_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Entity: DORM_SURROUNDINGS (สภาพแวดล้อมและสถานที่ใกล้เคียง)
CREATE TABLE IF NOT EXISTS `dorm_surroundings` (
    `surrounding_id` INT AUTO_INCREMENT PRIMARY KEY,
    `dorm_id` INT NOT NULL UNIQUE,
    `near_main_road` VARCHAR(100) NULL COMMENT 'อยู่ใกล้ถนนใหญ่ (เช่น ถนนสถลมาร์ค)',
    `near_pub` VARCHAR(50) NULL COMMENT 'ระยะห่างร้านเหล้า (ใกล้ / ไกล / ไม่มี)',
    `noise_level` ENUM('เงียบสงบ', 'ปานกลาง', 'พลุกพล่าน') NOT NULL DEFAULT 'เงียบสงบ',
    `dist_7eleven` VARCHAR(50) NULL COMMENT 'ระยะทางไป 7-Eleven (เช่น 300 ม. หรือ 1.2 กม.)',
    `dist_lotus` VARCHAR(50) NULL COMMENT 'ระยะทางไป Lotus go fresh',
    `dist_bigc` VARCHAR(50) NULL COMMENT 'ระยะทางไป Big C mini',
    `dist_market` VARCHAR(50) NULL COMMENT 'ระยะทางไป ตลาดบังเอิญ',
    `dist_food_court` VARCHAR(50) NULL COMMENT 'ระยะทางไป ศูนย์อาหารมีเจริญ',
    `is_flood_risk` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'อยู่ในพื้นที่ลุ่มต่ำ/เสี่ยงน้ำท่วมขังช่วงหน้าฝนหรือไม่',
    FOREIGN KEY (`dorm_id`) REFERENCES `dormitories`(`dorm_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View สำหรับ Query ข้อมูลหอพักพร้อมผลประเมินหอพักสีขาวและสิ่งอำนวยความสะดวกแบบรวดเร็ว
CREATE OR REPLACE VIEW `vw_dormitories_full` AS
SELECT 
    d.dorm_id,
    d.dorm_name,
    z.zone_name,
    d.gender_type,
    d.room_type,
    d.min_price,
    d.max_price,
    d.water_rate,
    d.electric_rate,
    d.deposit_fee,
    d.min_lease_period,
    d.latitude,
    d.longitude,
    d.phone_number,
    d.line_id,
    d.facebook_page,
    d.allow_pet,
    d.allow_cooking,
    d.gate_closing_time,
    d.cover_image,
    e.eval_date,
    e.required_standards,
    e.additional_standards,
    e.eval_result,
    (e.eval_result = 'ผ่าน') AS is_white_dorm,
    f.has_water_heater,
    f.has_fridge,
    f.has_free_wifi,
    f.has_elevator,
    f.has_washing_machine,
    f.has_parking,
    f.has_keycard,
    f.has_cctv,
    f.has_security_guard,
    s.near_main_road,
    s.noise_level,
    s.dist_7eleven,
    s.dist_market,
    s.is_flood_risk
FROM dormitories d
LEFT JOIN zones z ON d.zone_id = z.zone_id
LEFT JOIN white_dorm_evaluations e ON d.dorm_id = e.dorm_id
LEFT JOIN dorm_facilities f ON d.dorm_id = f.dorm_id
LEFT JOIN dorm_surroundings s ON d.dorm_id = s.dorm_id;

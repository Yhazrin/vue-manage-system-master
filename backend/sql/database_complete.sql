-- =====================================================
-- 完整数据库初始化脚本
-- 包含所有表结构、数据和系统配置
-- 创建时间: 2025-08-09
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `author_center` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `author_center`;

-- =====================================================
-- 1. 基础表结构
-- =====================================================

-- 管理员表
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('super_admin','admin','manager') DEFAULT 'admin',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 游戏表
CREATE TABLE `games` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `logo_url` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 玩家表
CREATE TABLE `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','banned') DEFAULT 'active',
  `balance` decimal(10,2) DEFAULT '0.00',
  `total_spent` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 礼品表
CREATE TABLE `gifts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `stock` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. 客服系统表
-- =====================================================

-- 超级统一客服表
CREATE TABLE `customer_services_super_unified` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `plain_password` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','banned') DEFAULT 'active',
  `hourly_rate` decimal(8,2) DEFAULT '20.00',
  `total_earnings` decimal(12,2) DEFAULT '0.00',
  `available_balance` decimal(12,2) DEFAULT '0.00',
  `withdrawn_amount` decimal(12,2) DEFAULT '0.00',
  `pending_withdrawal` decimal(12,2) DEFAULT '0.00',
  `today_status` enum('not_clocked','clocked_in','clocked_out') DEFAULT 'not_clocked',
  `today_clock_in_time` timestamp NULL DEFAULT NULL,
  `today_clock_out_time` timestamp NULL DEFAULT NULL,
  `today_work_hours` decimal(8,4) DEFAULT '0.0000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 客服提现记录表
CREATE TABLE `customer_service_withdrawals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_service_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `description` text,
  `reject_reason` text,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_service_id` (`customer_service_id`),
  KEY `processed_by` (`processed_by`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `customer_service_withdrawals_ibfk_1` FOREIGN KEY (`customer_service_id`) REFERENCES `customer_services_super_unified` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_service_withdrawals_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. 订单和交易表
-- =====================================================

-- 订单表
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` int(11) NOT NULL,
  `customer_service_id` int(11) DEFAULT NULL,
  `game_id` int(11) NOT NULL,
  `gift_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `service_hours` decimal(8,2) DEFAULT '0.00',
  `status` enum('pending','processing','completed','cancelled','refunded') DEFAULT 'pending',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `player_id` (`player_id`),
  KEY `customer_service_id` (`customer_service_id`),
  KEY `game_id` (`game_id`),
  KEY `gift_id` (`gift_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`customer_service_id`) REFERENCES `customer_services_super_unified` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 玩家提现记录表
CREATE TABLE `player_withdrawals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `description` text,
  `reject_reason` text,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `player_id` (`player_id`),
  KEY `processed_by` (`processed_by`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `player_withdrawals_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_withdrawals_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. 系统配置表
-- =====================================================

-- 系统设置表
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('string','number','boolean','json') DEFAULT 'string',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 收藏夹表
CREATE TABLE `favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` int(11) NOT NULL,
  `gift_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `player_gift_unique` (`player_id`,`gift_id`),
  KEY `gift_id` (`gift_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. 初始数据插入
-- =====================================================

-- 插入默认管理员账户
INSERT INTO `admins` (`username`, `password`, `email`, `role`, `status`) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', 'super_admin', 'active'),
('manager', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager@example.com', 'manager', 'active');

-- 插入默认游戏
INSERT INTO `games` (`name`, `description`, `logo_url`, `status`) VALUES
('王者荣耀', '热门MOBA游戏', '/logo/wzry.png', 'active'),
('和平精英', '战术竞技游戏', '/logo/hpjy.png', 'active'),
('原神', '开放世界冒险游戏', '/logo/ys.png', 'active'),
('英雄联盟', '经典MOBA游戏', '/logo/lol.png', 'active');

-- 插入默认礼品
INSERT INTO `gifts` (`name`, `description`, `price`, `image_url`, `category`, `status`, `stock`) VALUES
('游戏币 x100', '通用游戏币', 10.00, '/default-gift.svg', '游戏币', 'active', 1000),
('皮肤礼包', '限定皮肤礼包', 50.00, '/default-gift.svg', '皮肤', 'active', 100),
('装备强化石', '装备强化材料', 20.00, '/default-gift.svg', '道具', 'active', 500),
('经验加成卡', '双倍经验卡', 15.00, '/default-gift.svg', '道具', 'active', 200);

-- 插入测试客服账户
INSERT INTO `customer_services_super_unified` (`username`, `password`, `plain_password`, `email`, `hourly_rate`, `total_earnings`, `available_balance`, `status`) VALUES
('cs001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'password123', 'cs001@example.com', 20.00, 0.00, 0.00, 'active'),
('cs002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'password123', 'cs002@example.com', 25.00, 0.00, 0.00, 'active');

-- 插入测试玩家账户
INSERT INTO `players` (`username`, `password`, `email`, `balance`, `status`) VALUES
('player001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'player001@example.com', 100.00, 'active'),
('player002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'player002@example.com', 200.00, 'active');

-- 插入系统设置
INSERT INTO `system_settings` (`key`, `value`, `description`, `type`) VALUES
('site_name', '游戏服务平台', '网站名称', 'string'),
('default_hourly_rate', '20.00', '默认客服时薪', 'number'),
('min_withdrawal_amount', '1.00', '最低提现金额', 'number'),
('max_withdrawal_amount', '10000.00', '最高提现金额', 'number'),
('withdrawal_fee_rate', '0.00', '提现手续费率', 'number'),
('auto_approve_threshold', '100.00', '自动审批阈值', 'number');

-- =====================================================
-- 6. 创建索引优化
-- =====================================================

-- 为常用查询字段创建索引
CREATE INDEX `idx_orders_status_created` ON `orders` (`status`, `created_at`);
CREATE INDEX `idx_orders_customer_service_status` ON `orders` (`customer_service_id`, `status`);
CREATE INDEX `idx_withdrawals_status_created` ON `customer_service_withdrawals` (`status`, `created_at`);
CREATE INDEX `idx_player_withdrawals_status_created` ON `player_withdrawals` (`status`, `created_at`);
CREATE INDEX `idx_customer_services_status` ON `customer_services_super_unified` (`status`);
CREATE INDEX `idx_players_status` ON `players` (`status`);
CREATE INDEX `idx_gifts_status_category` ON `gifts` (`status`, `category`);

-- =====================================================
-- 7. 创建视图
-- =====================================================

-- 客服收益统计视图
CREATE VIEW `customer_service_earnings_view` AS
SELECT 
    cs.id,
    cs.username,
    cs.total_earnings,
    cs.available_balance,
    cs.withdrawn_amount,
    cs.pending_withdrawal,
    cs.hourly_rate,
    COALESCE(SUM(CASE WHEN o.status = 'completed' AND DATE(o.completed_at) = CURDATE() THEN o.service_hours * cs.hourly_rate ELSE 0 END), 0) as today_earnings,
    COALESCE(SUM(CASE WHEN o.status = 'completed' AND YEAR(o.completed_at) = YEAR(CURDATE()) AND MONTH(o.completed_at) = MONTH(CURDATE()) THEN o.service_hours * cs.hourly_rate ELSE 0 END), 0) as month_earnings,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as total_orders,
    COUNT(CASE WHEN o.status = 'completed' AND DATE(o.completed_at) = CURDATE() THEN 1 END) as today_orders
FROM customer_services_super_unified cs
LEFT JOIN orders o ON cs.id = o.customer_service_id
WHERE cs.status = 'active'
GROUP BY cs.id;

-- =====================================================
-- 8. 存储过程
-- =====================================================

DELIMITER //

-- 处理订单完成的存储过程
CREATE PROCEDURE `ProcessOrderCompletion`(
    IN order_id INT,
    IN service_hours DECIMAL(8,2)
)
BEGIN
    DECLARE customer_service_id INT;
    DECLARE hourly_rate DECIMAL(8,2);
    DECLARE earnings DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 获取订单信息
    SELECT o.customer_service_id, cs.hourly_rate
    INTO customer_service_id, hourly_rate
    FROM orders o
    JOIN customer_services_super_unified cs ON o.customer_service_id = cs.id
    WHERE o.id = order_id;
    
    -- 计算收益
    SET earnings = service_hours * hourly_rate;
    
    -- 更新订单状态
    UPDATE orders 
    SET status = 'completed', 
        service_hours = service_hours,
        completed_at = NOW()
    WHERE id = order_id;
    
    -- 更新客服收益
    UPDATE customer_services_super_unified
    SET total_earnings = total_earnings + earnings,
        available_balance = available_balance + earnings
    WHERE id = customer_service_id;
    
    COMMIT;
END //

-- 处理提现申请的存储过程
CREATE PROCEDURE `ProcessWithdrawal`(
    IN withdrawal_id INT,
    IN admin_id INT,
    IN new_status ENUM('approved', 'rejected'),
    IN reason TEXT
)
BEGIN
    DECLARE customer_service_id INT;
    DECLARE withdrawal_amount DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 获取提现信息
    SELECT customer_service_id, amount
    INTO customer_service_id, withdrawal_amount
    FROM customer_service_withdrawals
    WHERE id = withdrawal_id AND status = 'pending';
    
    -- 更新提现状态
    UPDATE customer_service_withdrawals
    SET status = new_status,
        processed_by = admin_id,
        processed_at = NOW(),
        reject_reason = CASE WHEN new_status = 'rejected' THEN reason ELSE NULL END
    WHERE id = withdrawal_id;
    
    -- 如果批准，更新客服余额
    IF new_status = 'approved' THEN
        UPDATE customer_services_super_unified
        SET available_balance = available_balance - withdrawal_amount,
            withdrawn_amount = withdrawn_amount + withdrawal_amount,
            pending_withdrawal = pending_withdrawal - withdrawal_amount
        WHERE id = customer_service_id;
    ELSE
        -- 如果拒绝，释放冻结金额
        UPDATE customer_services_super_unified
        SET pending_withdrawal = pending_withdrawal - withdrawal_amount
        WHERE id = customer_service_id;
    END IF;
    
    COMMIT;
END //

DELIMITER ;

-- =====================================================
-- 9. 触发器
-- =====================================================

DELIMITER //

-- 提现申请创建时冻结余额
CREATE TRIGGER `freeze_balance_on_withdrawal` 
AFTER INSERT ON `customer_service_withdrawals`
FOR EACH ROW
BEGIN
    IF NEW.status = 'pending' THEN
        UPDATE customer_services_super_unified
        SET pending_withdrawal = pending_withdrawal + NEW.amount
        WHERE id = NEW.customer_service_id;
    END IF;
END //

DELIMITER ;

-- =====================================================
-- 数据库初始化完成
-- =====================================================

-- 显示创建的表
SHOW TABLES;

-- 显示数据库信息
SELECT 'Database initialization completed successfully!' as message;
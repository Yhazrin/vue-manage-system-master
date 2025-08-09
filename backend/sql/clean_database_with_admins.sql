-- =============================================
-- 干净的数据库导出文件（只包含管理员账户）
-- 导出时间: 2025/8/10 01:08:25
-- 数据库: author_center
-- 说明: 此文件包含完整的数据库结构和4个管理员账户
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 表的结构 `attendance_records`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `admin_name` varchar(255) NOT NULL,
  `clock_in_time` timestamp NULL DEFAULT NULL,
  `clock_out_time` timestamp NULL DEFAULT NULL,
  `work_hours` decimal(4,2) DEFAULT '0.00',
  `date` date NOT NULL,
  `status` enum('not_clocked','clocked_in','clocked_out') DEFAULT 'not_clocked',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_admin_date` (`admin_id`,`date`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- 表的结构 `comments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `player_id` int NOT NULL,
  `order_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `rating` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_order` (`user_id`,`order_id`),
  KEY `fk_comment_player` (`player_id`),
  KEY `fk_comment_order` (`order_id`),
  CONSTRAINT `fk_comment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `commission_config`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `commission_config`;
CREATE TABLE `commission_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_commission_rate` decimal(5,2) DEFAULT '10.00',
  `gift_commission_rate` decimal(5,2) DEFAULT '30.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 转存表中的数据 `commission_config`
-- --------------------------------------------------------

INSERT INTO `commission_config` (`id`, `order_commission_rate`, `gift_commission_rate`, `created_at`, `updated_at`) VALUES
(1, '10.00', '30.00', '2025-08-06 05:41:08', '2025-08-06 05:41:08');

-- --------------------------------------------------------
-- 表的结构 `customer_service_daily_earnings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `customer_service_daily_earnings`;
CREATE TABLE `customer_service_daily_earnings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_service_id` int NOT NULL COMMENT '客服ID - 只使用客服ID',
  `date` date NOT NULL,
  `work_hours` decimal(5,2) DEFAULT '0.00' COMMENT '工作时长',
  `hourly_rate` decimal(10,2) NOT NULL COMMENT '时薪',
  `base_earnings` decimal(15,2) DEFAULT '0.00' COMMENT '基础收入',
  `commission_earnings` decimal(15,2) DEFAULT '0.00' COMMENT '提成收入',
  `bonus_earnings` decimal(15,2) DEFAULT '0.00' COMMENT '奖金收入',
  `total_earnings` decimal(15,2) NOT NULL COMMENT '总收入',
  `clock_in_time` timestamp NULL DEFAULT NULL COMMENT '上班时间',
  `clock_out_time` timestamp NULL DEFAULT NULL COMMENT '下班时间',
  `attendance_record_id` int DEFAULT NULL COMMENT '关联的打卡记录ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_service_date` (`customer_service_id`,`date`),
  KEY `idx_date` (`date`),
  KEY `idx_customer_service_id` (`customer_service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服每日收入汇总 - 只使用客服ID';

-- --------------------------------------------------------
-- 表的结构 `customer_service_earnings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `customer_service_earnings`;
CREATE TABLE `customer_service_earnings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `admin_name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `work_hours` decimal(4,2) NOT NULL DEFAULT '0.00',
  `hourly_rate` decimal(8,2) NOT NULL DEFAULT '20.00',
  `earnings` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_admin_date` (`admin_id`,`date`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- 表的结构 `customer_service_history_logs`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `customer_service_history_logs`;
CREATE TABLE `customer_service_history_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_service_id` int NOT NULL COMMENT '客服ID',
  `action_type` enum('clock_in','clock_out','earning','withdrawal','balance_change','status_change') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型',
  `action_date` date NOT NULL COMMENT '操作日期',
  `action_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `clock_in_time` timestamp NULL DEFAULT NULL COMMENT '上班时间',
  `clock_out_time` timestamp NULL DEFAULT NULL COMMENT '下班时间',
  `work_hours` decimal(5,2) DEFAULT '0.00' COMMENT '工作时长',
  `hourly_rate` decimal(10,2) DEFAULT '0.00' COMMENT '时薪',
  `base_earnings` decimal(10,2) DEFAULT '0.00' COMMENT '基础收益',
  `commission_earnings` decimal(10,2) DEFAULT '0.00' COMMENT '提成收益',
  `bonus_earnings` decimal(10,2) DEFAULT '0.00' COMMENT '奖金收益',
  `total_earnings` decimal(10,2) DEFAULT '0.00' COMMENT '总收益',
  `balance_before` decimal(15,2) DEFAULT '0.00' COMMENT '变动前余额',
  `balance_after` decimal(15,2) DEFAULT '0.00' COMMENT '变动后余额',
  `amount` decimal(15,2) DEFAULT '0.00' COMMENT '变动金额',
  `withdrawal_amount` decimal(15,2) DEFAULT '0.00' COMMENT '提现金额',
  `withdrawal_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '提现状态',
  `alipay_account` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '支付宝账号',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '操作描述',
  `reference_id` int DEFAULT NULL COMMENT '关联记录ID',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text COLLATE utf8mb4_unicode_ci COMMENT '用户代理',
  PRIMARY KEY (`id`),
  KEY `idx_customer_service_id` (`customer_service_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_action_date` (`action_date`),
  KEY `idx_action_time` (`action_time`),
  CONSTRAINT `customer_service_history_logs_ibfk_1` FOREIGN KEY (`customer_service_id`) REFERENCES `customer_services_super_unified` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服历史操作日志表 - 用于审计和详细查询';

-- --------------------------------------------------------
-- 表的结构 `customer_service_salaries`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `customer_service_salaries`;
CREATE TABLE `customer_service_salaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `admin_name` varchar(255) NOT NULL,
  `hourly_rate` decimal(8,2) NOT NULL DEFAULT '20.00',
  `updated_by` int DEFAULT NULL,
  `updated_by_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_admin_id` (`admin_id`),
  KEY `idx_admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- 表的结构 `customer_services_super_unified`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `customer_services_super_unified`;
CREATE TABLE `customer_services_super_unified` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '客服ID',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码',
  `plain_passwd` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '??????(??????)',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '手机号',
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '账户状态',
  `is_online` tinyint(1) DEFAULT '0' COMMENT '是否在线',
  `last_login_time` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '最后登录IP',
  `can_view_orders` tinyint(1) DEFAULT '1' COMMENT '查看订单权限',
  `can_edit_orders` tinyint(1) DEFAULT '0' COMMENT '编辑订单权限',
  `can_view_players` tinyint(1) DEFAULT '1' COMMENT '查看玩家权限',
  `can_edit_players` tinyint(1) DEFAULT '0' COMMENT '编辑玩家权限',
  `can_view_games` tinyint(1) DEFAULT '1' COMMENT '查看游戏权限',
  `can_manage_gifts` tinyint(1) DEFAULT '0' COMMENT '管理礼品权限',
  `can_view_statistics` tinyint(1) DEFAULT '1' COMMENT '查看统计权限',
  `can_withdraw` tinyint(1) DEFAULT '1' COMMENT '提现权限',
  `hourly_rate` decimal(10,2) DEFAULT '20.00' COMMENT '时薪',
  `base_salary` decimal(10,2) DEFAULT '0.00' COMMENT '基本工资',
  `commission_rate` decimal(5,2) DEFAULT '0.00' COMMENT '提成比例(%)',
  `performance_bonus` decimal(10,2) DEFAULT '0.00' COMMENT '绩效奖金',
  `available_balance` decimal(15,2) DEFAULT '0.00' COMMENT '可用余额',
  `frozen_balance` decimal(15,2) DEFAULT '0.00' COMMENT '冻结余额',
  `total_earnings` decimal(15,2) DEFAULT '0.00' COMMENT '历史总收益',
  `total_withdrawals` decimal(15,2) DEFAULT '0.00' COMMENT '历史总提现',
  `pending_withdrawals` decimal(15,2) DEFAULT '0.00' COMMENT '待处理提现金额',
  `total_work_hours` decimal(10,2) DEFAULT '0.00' COMMENT '历史总工作时长',
  `total_work_days` int DEFAULT '0' COMMENT '历史总工作天数',
  `current_month_hours` decimal(10,2) DEFAULT '0.00' COMMENT '本月工作时长',
  `current_month_earnings` decimal(15,2) DEFAULT '0.00' COMMENT '本月收益',
  `current_month_days` int DEFAULT '0' COMMENT '本月工作天数',
  `today_status` enum('not_clocked','clocked_in','clocked_out') COLLATE utf8mb4_unicode_ci DEFAULT 'not_clocked' COMMENT '今日打卡状态',
  `today_clock_in_time` timestamp NULL DEFAULT NULL COMMENT '今日上班时间',
  `today_clock_out_time` timestamp NULL DEFAULT NULL COMMENT '今日下班时间',
  `today_work_hours` decimal(5,2) DEFAULT '0.00' COMMENT '今日工作时长',
  `today_base_earnings` decimal(10,2) DEFAULT '0.00' COMMENT '今日基础收益',
  `today_commission_earnings` decimal(10,2) DEFAULT '0.00' COMMENT '今日提成收益',
  `today_bonus_earnings` decimal(10,2) DEFAULT '0.00' COMMENT '今日奖金收益',
  `today_total_earnings` decimal(10,2) DEFAULT '0.00' COMMENT '今日总收益',
  `last_withdrawal_time` timestamp NULL DEFAULT NULL COMMENT '最后提现时间',
  `last_withdrawal_amount` decimal(15,2) DEFAULT '0.00' COMMENT '最后提现金额',
  `withdrawal_count` int DEFAULT '0' COMMENT '提现次数',
  `monthly_target_hours` decimal(10,2) DEFAULT '160.00' COMMENT '月度目标工作时长',
  `monthly_target_earnings` decimal(15,2) DEFAULT '3200.00' COMMENT '月度目标收益',
  `performance_score` decimal(5,2) DEFAULT '0.00' COMMENT '绩效评分',
  `attendance_rate` decimal(5,2) DEFAULT '100.00' COMMENT '出勤率',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` int DEFAULT NULL COMMENT '创建者ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_status` (`status`),
  KEY `idx_is_online` (`is_online`),
  KEY `idx_today_status` (`today_status`),
  KEY `idx_phone` (`phone`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_last_login` (`last_login_time`),
  KEY `idx_available_balance` (`available_balance`),
  KEY `idx_total_earnings` (`total_earnings`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='超级统一客服表 - 包含所有客服相关信息的单一表';

-- --------------------------------------------------------
-- 表的结构 `customer_services_unified`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `customer_services_unified`;
CREATE TABLE `customer_services_unified` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `plain_password` varchar(255) DEFAULT NULL,
  `available_balance` decimal(15,2) DEFAULT '0.00',
  `total_earnings` decimal(15,2) DEFAULT '0.00',
  `hourly_rate` decimal(8,2) DEFAULT '20.00',
  `status` enum('active','inactive') DEFAULT 'active',
  `last_login_time` timestamp NULL DEFAULT NULL,
  `today_clock_in_time` timestamp NULL DEFAULT NULL,
  `today_clock_out_time` timestamp NULL DEFAULT NULL,
  `today_work_hours` decimal(4,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_phone` (`phone`),
  UNIQUE KEY `unique_username` (`username`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- 表的结构 `favorites`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `player_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_player` (`user_id`,`player_id`),
  KEY `fk_favorite_user` (`user_id`),
  KEY `fk_favorite_player` (`player_id`),
  CONSTRAINT `fk_favorite_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorite_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `games`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `games`;
CREATE TABLE `games` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `image_url` longtext COLLATE utf8mb4_general_ci COMMENT '游戏图片URL，支持base64编码',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `gift_records`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `gift_records`;
CREATE TABLE `gift_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `player_id` int NOT NULL,
  `order_id` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '关联的订单ID',
  `gift_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `platform_fee` decimal(10,2) DEFAULT '0.00' COMMENT '打赏抽成',
  `final_amount` decimal(10,2) GENERATED ALWAYS AS ((`total_price` - `platform_fee`)) STORED COMMENT '到手收入',
  `is_settled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_gift_user` (`user_id`),
  KEY `fk_gift_player` (`player_id`),
  KEY `fk_gift_item` (`gift_id`),
  KEY `fk_gift_order` (`order_id`),
  KEY `idx_gift_records_order_settled` (`order_id`,`is_settled`),
  CONSTRAINT `fk_gift_item` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`id`),
  CONSTRAINT `fk_gift_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gift_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gift_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `gifts`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `gifts`;
CREATE TABLE `gifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` longtext COLLATE utf8mb4_general_ci COMMENT '礼物图片URL，支持base64编码',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `global_hourly_rate_settings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `global_hourly_rate_settings`;
CREATE TABLE `global_hourly_rate_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hourly_rate` decimal(10,2) NOT NULL,
  `updated_by` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- 转存表中的数据 `global_hourly_rate_settings`
-- --------------------------------------------------------

INSERT INTO `global_hourly_rate_settings` (`id`, `hourly_rate`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, '20.00', 'system', '2025-08-04 17:20:17', '2025-08-04 17:20:17'),
(2, '72000.00', 'system', '2025-08-05 12:57:48', '2025-08-05 12:57:48'),
(3, '40.00', 'system', '2025-08-05 13:28:12', '2025-08-06 06:31:08');

-- --------------------------------------------------------
-- 表的结构 `managers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `managers`;
CREATE TABLE `managers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `passwd` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `phone_num` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` tinyint(1) DEFAULT '1',
  `photo_img` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `plain_passwd` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '明文密码',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 转存表中的数据 `managers`
-- --------------------------------------------------------

INSERT INTO `managers` (`id`, `name`, `passwd`, `phone_num`, `status`, `photo_img`, `created_at`, `plain_passwd`, `last_login`) VALUES
(14, '超级管理员2', '$2b$10$o0j0SmxE.M6Ay2YMTzr14usN2eFpIl7Q9emLBRS240M7GHXPcVjlS', '13800000002', 1, NULL, '2025-08-05 03:02:17', 'admin123456', '2025-08-09 15:46:30'),
(15, '超级管理员3', '$2b$10$o0j0SmxE.M6Ay2YMTzr14usN2eFpIl7Q9emLBRS240M7GHXPcVjlS', '13800000003', 1, NULL, '2025-08-05 03:02:17', 'admin123456', NULL),
(16, '超级管理员4', '$2b$10$o0j0SmxE.M6Ay2YMTzr14usN2eFpIl7Q9emLBRS240M7GHXPcVjlS', '13800000004', 1, NULL, '2025-08-05 03:02:17', 'admin123456', NULL),
(21, '超级管理员1', '$2b$10$o0j0SmxE.M6Ay2YMTzr14usN2eFpIl7Q9emLBRS240M7GHXPcVjlS', '13800000001', 1, NULL, '2025-08-09 10:43:24', 'admin123456', NULL);

-- --------------------------------------------------------
-- 表的结构 `order_revenue_config`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `order_revenue_config`;
CREATE TABLE `order_revenue_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_service_commission_rate` decimal(5,2) DEFAULT '5.00' COMMENT '瀹㈡湇浠庤?鍗曚腑鑾峰緱鐨勬敹鐩婃瘮渚?%)',
  `min_order_amount` decimal(10,2) DEFAULT '1.00' COMMENT '鍙備笌鍒嗛厤鐨勬渶灏忚?鍗曢噾棰',
  `max_order_amount` decimal(10,2) DEFAULT '50000.00' COMMENT '鍙備笌鍒嗛厤鐨勬渶澶ц?鍗曢噾棰',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '鏄?惁鍚?敤',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='璁㈠崟鏀剁泭鍒嗛厤閰嶇疆';

-- --------------------------------------------------------
-- 转存表中的数据 `order_revenue_config`
-- --------------------------------------------------------

INSERT INTO `order_revenue_config` (`id`, `customer_service_commission_rate`, `min_order_amount`, `max_order_amount`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '5.00', '1.00', '50000.00', 1, '2025-08-04 20:30:31', '2025-08-04 20:30:31'),
(2, '5.00', '1.00', '50000.00', 1, '2025-08-04 20:31:49', '2025-08-04 20:31:49');

-- --------------------------------------------------------
-- 表的结构 `order_revenue_distributions`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `order_revenue_distributions`;
CREATE TABLE `order_revenue_distributions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) NOT NULL,
  `admin_id` int NOT NULL COMMENT '瀹㈡湇ID',
  `admin_name` varchar(255) NOT NULL,
  `order_amount` decimal(10,2) NOT NULL COMMENT '璁㈠崟閲戦?',
  `commission_rate` decimal(5,2) NOT NULL COMMENT '鏀剁泭姣斾緥',
  `commission_amount` decimal(10,2) NOT NULL COMMENT '鏀剁泭閲戦?',
  `distribution_date` date NOT NULL COMMENT '鍒嗛厤鏃ユ湡',
  `status` enum('pending','distributed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_admin` (`order_id`,`admin_id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_distribution_date` (`distribution_date`),
  CONSTRAINT `order_revenue_distributions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `managers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='璁㈠崟鏀剁泭鍒嗛厤璁板綍';

-- --------------------------------------------------------
-- 表的结构 `orders`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `order_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` int DEFAULT NULL COMMENT '???ID??ULL?????????',
  `player_id` int NOT NULL,
  `game_id` int NOT NULL,
  `service_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'service.price×hours 结果',
  `status` enum('pending','in_progress','completed','cancelled','pending_review') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending' COMMENT '订单状态：pending-待接单，in_progress-进行中，completed-已完成，cancelled-已取消，pending_review-待审核',
  `is_paid` tinyint(1) DEFAULT '0' COMMENT '是否已打款',
  `user_confirmed_end` tinyint(1) DEFAULT '0' COMMENT '用户确认结束',
  `player_confirmed_end` tinyint(1) DEFAULT '0' COMMENT '陪玩确认结束',
  `customer_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '客户姓名（匿名用户）',
  `customer_phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '客户电话（匿名用户）',
  `customer_note` text COLLATE utf8mb4_general_ci COMMENT '客户备注（匿名用户）',
  `is_anonymous` tinyint(1) DEFAULT '0' COMMENT '是否为匿名用户订单',
  `service_hours` decimal(6,2) DEFAULT NULL COMMENT '??????????????????',
  `reviewed_by` int DEFAULT NULL COMMENT '审核人ID（管理员或客服）',
  `review_note` text COLLATE utf8mb4_general_ci COMMENT '审核备注',
  `reviewed_at` timestamp NULL DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`order_id`),
  KEY `fk_order_user` (`user_id`),
  KEY `fk_order_player` (`player_id`),
  KEY `fk_order_game` (`game_id`),
  KEY `fk_orders_service` (`service_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_reviewed_by` (`reviewed_by`),
  KEY `idx_orders_reviewed_at` (`reviewed_at`),
  CONSTRAINT `fk_order_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `platform_config`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `platform_config`;
CREATE TABLE `platform_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `commission_rate` decimal(5,2) NOT NULL COMMENT '平台抽成百分比，例如10表示10%',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `order_commission_rate` decimal(5,2) DEFAULT '15.00' COMMENT '订单抽成百分比',
  `gift_commission_rate` decimal(5,2) DEFAULT '15.00' COMMENT '礼物抽成百分比',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 转存表中的数据 `platform_config`
-- --------------------------------------------------------

INSERT INTO `platform_config` (`id`, `commission_rate`, `updated_at`, `order_commission_rate`, `gift_commission_rate`) VALUES
(1, '20.00', '2025-08-05 05:59:39', '10.00', '30.00');

-- --------------------------------------------------------
-- 表的结构 `players`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `players`;
CREATE TABLE `players` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `passwd` text COLLATE utf8mb4_general_ci,
  `phone_num` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` tinyint(1) DEFAULT '1',
  `QR_img` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `game_id` int DEFAULT NULL,
  `money` decimal(10,2) DEFAULT '0.00',
  `profit` decimal(10,2) DEFAULT '0.00',
  `voice` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `intro` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `photo_img` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'player' COMMENT '陪玩标识，普通陪玩为player',
  `plain_passwd` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '明文密码，仅用于演示',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `online_status` tinyint(1) DEFAULT '0' COMMENT '在线状态: 0=离线, 1=在线',
  PRIMARY KEY (`id`),
  KEY `fk_game_id` (`game_id`),
  CONSTRAINT `fk_game_id` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `services`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player_id` int NOT NULL,
  `game_id` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `hours` decimal(6,2) NOT NULL COMMENT '服务时长，支持小数，如2.5小时',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_service_player` (`player_id`),
  KEY `fk_service_game` (`game_id`),
  CONSTRAINT `fk_service_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_service_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `statistics`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `statistics`;
CREATE TABLE `statistics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `user_order_count` int DEFAULT '0',
  `player_total_income` decimal(10,2) DEFAULT '0.00',
  `total_order_count` int DEFAULT '0',
  `total_income` decimal(10,2) DEFAULT '0.00',
  `total_withdrawn` decimal(10,2) DEFAULT '0.00',
  `platform_profit` decimal(10,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_statistics_user` (`user_id`),
  KEY `fk_statistics_player` (`player_id`),
  CONSTRAINT `fk_statistics_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_statistics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `users`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `passwd` text COLLATE utf8mb4_general_ci,
  `status` tinyint(1) DEFAULT '1',
  `photo_img` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone_num` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'user' COMMENT '角色标识，普通用户为user',
  `plain_passwd` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '明文密码，仅用于演示',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 表的结构 `withdrawals`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `withdrawals`;
CREATE TABLE `withdrawals` (
  `withdrawal_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `user_type` enum('player','customer_service') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'player' COMMENT '用户类型：陪玩或客服',
  `customer_service_id` int DEFAULT NULL COMMENT '客服ID（当user_type为customer_service时使用）',
  `player_id` int DEFAULT NULL COMMENT '陪玩ID（当user_type为player时使用）',
  `amount` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) DEFAULT '0.00',
  `final_amount` decimal(10,2) GENERATED ALWAYS AS ((`amount` - `platform_fee`)) STORED,
  `alipay_account` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '支付宝账号',
  `status` enum('待审核','已批准','已拒绝','已打款') COLLATE utf8mb4_general_ci DEFAULT '待审核',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_general_ci COMMENT '??????',
  `processed_by` int DEFAULT NULL COMMENT '处理人ID',
  `processed_by_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '处理人姓名',
  `processed_at` timestamp NULL DEFAULT NULL COMMENT '处理时间',
  `reject_reason` text COLLATE utf8mb4_general_ci COMMENT '拒绝原因',
  `approval_notes` text COLLATE utf8mb4_general_ci COMMENT '批准备注',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '??????',
  PRIMARY KEY (`withdrawal_id`),
  KEY `fk_withdrawal_player` (`player_id`),
  KEY `idx_user_type` (`user_type`),
  KEY `idx_customer_service_id` (`customer_service_id`),
  CONSTRAINT `fk_withdrawal_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

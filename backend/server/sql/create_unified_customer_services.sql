-- 创建统一的客服表，完全独立于管理员系统
-- 确保所有客服操作都使用 customer_service_id

DROP TABLE IF EXISTS customer_services_unified;

CREATE TABLE customer_services_unified (
  -- 基本信息
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '客服ID - 独立的客服标识',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  plain_passwd VARCHAR(50) COMMENT '明文密码(用于显示)',
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  phone VARCHAR(20) COMMENT '手机号',
  email VARCHAR(100) COMMENT '邮箱',
  avatar VARCHAR(255) COMMENT '头像URL',
  
  -- 状态信息
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '状态',
  is_online BOOLEAN DEFAULT FALSE COMMENT '是否在线',
  last_login_time TIMESTAMP NULL COMMENT '最后登录时间',
  last_login_ip VARCHAR(45) COMMENT '最后登录IP',
  
  -- 权限信息 (整合权限表)
  can_view_orders BOOLEAN DEFAULT TRUE COMMENT '查看订单权限',
  can_edit_orders BOOLEAN DEFAULT FALSE COMMENT '编辑订单权限',
  can_view_players BOOLEAN DEFAULT TRUE COMMENT '查看玩家权限',
  can_edit_players BOOLEAN DEFAULT FALSE COMMENT '编辑玩家权限',
  can_view_games BOOLEAN DEFAULT TRUE COMMENT '查看游戏权限',
  can_manage_gifts BOOLEAN DEFAULT FALSE COMMENT '管理礼品权限',
  can_view_statistics BOOLEAN DEFAULT TRUE COMMENT '查看统计权限',
  can_withdraw BOOLEAN DEFAULT TRUE COMMENT '提现权限',
  
  -- 薪资信息 (整合薪资表)
  hourly_rate DECIMAL(10,2) DEFAULT 20.00 COMMENT '时薪',
  base_salary DECIMAL(10,2) DEFAULT 0.00 COMMENT '基本工资',
  commission_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '提成比例(%)',
  performance_bonus DECIMAL(10,2) DEFAULT 0.00 COMMENT '绩效奖金',
  
  -- 余额信息
  current_balance DECIMAL(15,2) DEFAULT 0.00 COMMENT '当前余额',
  total_earnings DECIMAL(15,2) DEFAULT 0.00 COMMENT '总收入',
  total_withdrawals DECIMAL(15,2) DEFAULT 0.00 COMMENT '总提现',
  pending_withdrawals DECIMAL(15,2) DEFAULT 0.00 COMMENT '待处理提现',
  
  -- 工作统计
  total_work_hours DECIMAL(10,2) DEFAULT 0.00 COMMENT '总工作时长',
  total_work_days INT DEFAULT 0 COMMENT '总工作天数',
  current_month_hours DECIMAL(10,2) DEFAULT 0.00 COMMENT '本月工作时长',
  current_month_earnings DECIMAL(15,2) DEFAULT 0.00 COMMENT '本月收入',
  
  -- 打卡状态 (简化打卡记录)
  today_status ENUM('not_clocked', 'clocked_in', 'clocked_out') DEFAULT 'not_clocked' COMMENT '今日打卡状态',
  today_clock_in_time TIMESTAMP NULL COMMENT '今日上班时间',
  today_clock_out_time TIMESTAMP NULL COMMENT '今日下班时间',
  today_work_hours DECIMAL(5,2) DEFAULT 0.00 COMMENT '今日工作时长',
  
  -- 系统字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  created_by INT COMMENT '创建者ID',
  
  -- 索引
  INDEX idx_username (username),
  INDEX idx_status (status),
  INDEX idx_is_online (is_online),
  INDEX idx_today_status (today_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一客服表 - 完全独立的客服系统';

-- 客服余额变动日志 (只使用customer_service_id)
DROP TABLE IF EXISTS customer_service_balance_logs_new;
CREATE TABLE customer_service_balance_logs_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_service_id INT NOT NULL COMMENT '客服ID - 只使用客服ID',
  amount DECIMAL(15,2) NOT NULL COMMENT '变动金额',
  type ENUM('earning', 'withdrawal', 'adjustment', 'bonus', 'penalty') NOT NULL COMMENT '变动类型',
  description TEXT COMMENT '变动描述',
  balance_before DECIMAL(15,2) NOT NULL COMMENT '变动前余额',
  balance_after DECIMAL(15,2) NOT NULL COMMENT '变动后余额',
  reference_id INT COMMENT '关联记录ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_customer_service_id (customer_service_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服余额变动日志 - 只使用客服ID';

-- 客服提现记录 (只使用customer_service_id)
DROP TABLE IF EXISTS customer_service_withdrawals_new;
CREATE TABLE customer_service_withdrawals_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_service_id INT NOT NULL COMMENT '客服ID - 只使用客服ID',
  amount DECIMAL(15,2) NOT NULL COMMENT '提现金额',
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending' COMMENT '状态',
  alipay_account VARCHAR(255) COMMENT '支付宝账号(可选)',
  description TEXT COMMENT '提现说明',
  processed_by INT COMMENT '处理人ID',
  processed_by_name VARCHAR(255) COMMENT '处理人姓名',
  processed_at TIMESTAMP NULL COMMENT '处理时间',
  reject_reason TEXT COMMENT '拒绝原因',
  withdrawal_id VARCHAR(50) UNIQUE COMMENT '提现单号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_customer_service_id (customer_service_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服提现记录 - 只使用客服ID';

-- 客服每日收入汇总 (只使用customer_service_id)
DROP TABLE IF EXISTS customer_service_daily_earnings;
CREATE TABLE customer_service_daily_earnings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_service_id INT NOT NULL COMMENT '客服ID - 只使用客服ID',
  date DATE NOT NULL,
  work_hours DECIMAL(5,2) DEFAULT 0.00 COMMENT '工作时长',
  hourly_rate DECIMAL(10,2) NOT NULL COMMENT '时薪',
  base_earnings DECIMAL(15,2) DEFAULT 0.00 COMMENT '基础收入',
  commission_earnings DECIMAL(15,2) DEFAULT 0.00 COMMENT '提成收入',
  bonus_earnings DECIMAL(15,2) DEFAULT 0.00 COMMENT '奖金收入',
  total_earnings DECIMAL(15,2) NOT NULL COMMENT '总收入',
  clock_in_time TIMESTAMP NULL COMMENT '上班时间',
  clock_out_time TIMESTAMP NULL COMMENT '下班时间',
  attendance_record_id INT COMMENT '关联的打卡记录ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_customer_service_date (customer_service_id, date),
  INDEX idx_date (date),
  INDEX idx_customer_service_id (customer_service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服每日收入汇总 - 只使用客服ID';

-- 简化的打卡记录表 (只使用customer_service_id)
DROP TABLE IF EXISTS attendance_records_new;
CREATE TABLE attendance_records_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_service_id INT NOT NULL COMMENT '客服ID - 只使用客服ID',
  customer_service_name VARCHAR(255) NOT NULL COMMENT '客服姓名',
  date DATE NOT NULL COMMENT '日期',
  clock_in_time TIMESTAMP NULL COMMENT '上班时间',
  clock_out_time TIMESTAMP NULL COMMENT '下班时间',
  work_hours DECIMAL(5,2) DEFAULT 0.00 COMMENT '工作时长',
  status ENUM('not_clocked', 'clocked_in', 'clocked_out') DEFAULT 'not_clocked' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_customer_service_date (customer_service_id, date),
  INDEX idx_customer_service_id (customer_service_id),
  INDEX idx_date (date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服打卡记录 - 只使用客服ID';

-- 添加外键约束 (在数据迁移完成后添加)
-- ALTER TABLE customer_service_balance_logs_new ADD FOREIGN KEY (customer_service_id) REFERENCES customer_services_unified(id) ON DELETE CASCADE;
-- ALTER TABLE customer_service_withdrawals_new ADD FOREIGN KEY (customer_service_id) REFERENCES customer_services_unified(id) ON DELETE CASCADE;
-- ALTER TABLE customer_service_daily_earnings ADD FOREIGN KEY (customer_service_id) REFERENCES customer_services_unified(id) ON DELETE CASCADE;
-- ALTER TABLE attendance_records_new ADD FOREIGN KEY (customer_service_id) REFERENCES customer_services_unified(id) ON DELETE CASCADE;
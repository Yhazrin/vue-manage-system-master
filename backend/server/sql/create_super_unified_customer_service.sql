-- 超级统一客服表 - 将所有客服相关信息整合到一个表中
-- 包含：基本信息、权限、薪资、余额、工作统计、打卡状态、收益记录等

USE author_center;

-- 删除所有旧的客服相关表
DROP TABLE IF EXISTS customer_service_balance_logs_new;
DROP TABLE IF EXISTS customer_service_withdrawals_new;
DROP TABLE IF EXISTS customer_service_daily_earnings;
DROP TABLE IF EXISTS attendance_records_new;
DROP TABLE IF EXISTS customer_services_unified;
DROP TABLE IF EXISTS customer_services;
DROP TABLE IF EXISTS attendance_records;

-- 创建超级统一客服表
CREATE TABLE customer_services_super_unified (
  -- ==================== 基本信息 ====================
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '客服ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  plain_passwd VARCHAR(50) COMMENT '明文密码(用于显示)',
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  phone VARCHAR(20) COMMENT '手机号',
  email VARCHAR(100) COMMENT '邮箱',
  avatar VARCHAR(255) COMMENT '头像URL',
  
  -- ==================== 状态信息 ====================
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '账户状态',
  is_online BOOLEAN DEFAULT FALSE COMMENT '是否在线',
  last_login_time TIMESTAMP NULL COMMENT '最后登录时间',
  last_login_ip VARCHAR(45) COMMENT '最后登录IP',
  
  -- ==================== 权限信息 ====================
  can_view_orders BOOLEAN DEFAULT TRUE COMMENT '查看订单权限',
  can_edit_orders BOOLEAN DEFAULT FALSE COMMENT '编辑订单权限',
  can_view_players BOOLEAN DEFAULT TRUE COMMENT '查看玩家权限',
  can_edit_players BOOLEAN DEFAULT FALSE COMMENT '编辑玩家权限',
  can_view_games BOOLEAN DEFAULT TRUE COMMENT '查看游戏权限',
  can_manage_gifts BOOLEAN DEFAULT FALSE COMMENT '管理礼品权限',
  can_view_statistics BOOLEAN DEFAULT TRUE COMMENT '查看统计权限',
  can_withdraw BOOLEAN DEFAULT TRUE COMMENT '提现权限',
  
  -- ==================== 薪资配置 ====================
  hourly_rate DECIMAL(10,2) DEFAULT 20.00 COMMENT '时薪',
  base_salary DECIMAL(10,2) DEFAULT 0.00 COMMENT '基本工资',
  commission_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '提成比例(%)',
  performance_bonus DECIMAL(10,2) DEFAULT 0.00 COMMENT '绩效奖金',
  
  -- ==================== 余额信息 ====================
  available_balance DECIMAL(15,2) DEFAULT 0.00 COMMENT '可用余额',
  frozen_balance DECIMAL(15,2) DEFAULT 0.00 COMMENT '冻结余额',
  total_earnings DECIMAL(15,2) DEFAULT 0.00 COMMENT '历史总收益',
  total_withdrawals DECIMAL(15,2) DEFAULT 0.00 COMMENT '历史总提现',
  pending_withdrawals DECIMAL(15,2) DEFAULT 0.00 COMMENT '待处理提现金额',
  
  -- ==================== 工作统计 ====================
  total_work_hours DECIMAL(10,2) DEFAULT 0.00 COMMENT '历史总工作时长',
  total_work_days INT DEFAULT 0 COMMENT '历史总工作天数',
  current_month_hours DECIMAL(10,2) DEFAULT 0.00 COMMENT '本月工作时长',
  current_month_earnings DECIMAL(15,2) DEFAULT 0.00 COMMENT '本月收益',
  current_month_days INT DEFAULT 0 COMMENT '本月工作天数',
  
  -- ==================== 今日打卡状态 ====================
  today_status ENUM('not_clocked', 'clocked_in', 'clocked_out') DEFAULT 'not_clocked' COMMENT '今日打卡状态',
  today_clock_in_time TIMESTAMP NULL COMMENT '今日上班时间',
  today_clock_out_time TIMESTAMP NULL COMMENT '今日下班时间',
  today_work_hours DECIMAL(5,2) DEFAULT 0.00 COMMENT '今日工作时长',
  today_base_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '今日基础收益',
  today_commission_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '今日提成收益',
  today_bonus_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '今日奖金收益',
  today_total_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '今日总收益',
  
  -- ==================== 昨日数据 ====================
  yesterday_work_hours DECIMAL(5,2) DEFAULT 0.00 COMMENT '昨日工作时长',
  yesterday_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '昨日收益',
  
  -- ==================== 本周数据 ====================
  week_work_hours DECIMAL(10,2) DEFAULT 0.00 COMMENT '本周工作时长',
  week_earnings DECIMAL(15,2) DEFAULT 0.00 COMMENT '本周收益',
  week_work_days INT DEFAULT 0 COMMENT '本周工作天数',
  
  -- ==================== 提现信息 ====================
  last_withdrawal_time TIMESTAMP NULL COMMENT '最后提现时间',
  last_withdrawal_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '最后提现金额',
  withdrawal_count INT DEFAULT 0 COMMENT '提现次数',
  alipay_account VARCHAR(255) COMMENT '默认支付宝账号',
  
  -- ==================== 绩效数据 ====================
  monthly_target_hours DECIMAL(10,2) DEFAULT 160.00 COMMENT '月度目标工作时长',
  monthly_target_earnings DECIMAL(15,2) DEFAULT 3200.00 COMMENT '月度目标收益',
  performance_score DECIMAL(5,2) DEFAULT 0.00 COMMENT '绩效评分',
  attendance_rate DECIMAL(5,2) DEFAULT 100.00 COMMENT '出勤率',
  
  -- ==================== 系统字段 ====================
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  created_by INT COMMENT '创建者ID',
  last_sync_time TIMESTAMP NULL COMMENT '最后数据同步时间',
  
  -- ==================== 索引 ====================
  INDEX idx_username (username),
  INDEX idx_status (status),
  INDEX idx_is_online (is_online),
  INDEX idx_today_status (today_status),
  INDEX idx_phone (phone),
  INDEX idx_created_at (created_at),
  INDEX idx_last_login (last_login_time),
  INDEX idx_available_balance (available_balance),
  INDEX idx_total_earnings (total_earnings)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='超级统一客服表 - 包含所有客服相关信息的单一表';

-- 创建简化的历史记录表（仅用于审计和详细查询）
CREATE TABLE customer_service_history_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_service_id INT NOT NULL COMMENT '客服ID',
  action_type ENUM('clock_in', 'clock_out', 'earning', 'withdrawal', 'balance_change', 'status_change') NOT NULL COMMENT '操作类型',
  action_date DATE NOT NULL COMMENT '操作日期',
  action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  
  -- 打卡相关
  clock_in_time TIMESTAMP NULL COMMENT '上班时间',
  clock_out_time TIMESTAMP NULL COMMENT '下班时间',
  work_hours DECIMAL(5,2) DEFAULT 0.00 COMMENT '工作时长',
  
  -- 收益相关
  hourly_rate DECIMAL(10,2) DEFAULT 0.00 COMMENT '时薪',
  base_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '基础收益',
  commission_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '提成收益',
  bonus_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '奖金收益',
  total_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT '总收益',
  
  -- 余额变动
  balance_before DECIMAL(15,2) DEFAULT 0.00 COMMENT '变动前余额',
  balance_after DECIMAL(15,2) DEFAULT 0.00 COMMENT '变动后余额',
  amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '变动金额',
  
  -- 提现相关
  withdrawal_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '提现金额',
  withdrawal_status VARCHAR(20) COMMENT '提现状态',
  alipay_account VARCHAR(255) COMMENT '支付宝账号',
  
  -- 其他信息
  description TEXT COMMENT '操作描述',
  reference_id INT COMMENT '关联记录ID',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  
  INDEX idx_customer_service_id (customer_service_id),
  INDEX idx_action_type (action_type),
  INDEX idx_action_date (action_date),
  INDEX idx_action_time (action_time),
  
  FOREIGN KEY (customer_service_id) REFERENCES customer_services_super_unified(id) ON DELETE CASCADE
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='客服历史操作日志表 - 用于审计和详细查询';

-- 创建数据迁移和同步的存储过程
DELIMITER //

-- 客服打卡上班
CREATE PROCEDURE ClockIn(
  IN p_customer_service_id INT,
  IN p_clock_in_time TIMESTAMP
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- 更新客服表的今日状态
  UPDATE customer_services_super_unified 
  SET 
    today_status = 'clocked_in',
    today_clock_in_time = p_clock_in_time,
    today_clock_out_time = NULL,
    today_work_hours = 0.00,
    today_total_earnings = 0.00,
    is_online = TRUE,
    updated_at = NOW()
  WHERE id = p_customer_service_id;
  
  -- 记录历史日志
  INSERT INTO customer_service_history_logs (
    customer_service_id, action_type, action_date, action_time,
    clock_in_time, description
  ) VALUES (
    p_customer_service_id, 'clock_in', CURDATE(), p_clock_in_time,
    p_clock_in_time, '客服上班打卡'
  );
  
  COMMIT;
END //

-- 客服打卡下班
CREATE PROCEDURE ClockOut(
  IN p_customer_service_id INT,
  IN p_clock_out_time TIMESTAMP
)
BEGIN
  DECLARE v_clock_in_time TIMESTAMP;
  DECLARE v_work_hours DECIMAL(5,2);
  DECLARE v_hourly_rate DECIMAL(10,2);
  DECLARE v_base_earnings DECIMAL(10,2);
  DECLARE v_total_earnings DECIMAL(10,2);
  DECLARE v_current_balance DECIMAL(15,2);
  DECLARE v_total_earnings_history DECIMAL(15,2);
  DECLARE v_month_earnings DECIMAL(15,2);
  DECLARE v_month_hours DECIMAL(10,2);
  
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- 获取当前客服信息
  SELECT 
    today_clock_in_time, hourly_rate, available_balance, 
    total_earnings, current_month_earnings, current_month_hours
  INTO 
    v_clock_in_time, v_hourly_rate, v_current_balance,
    v_total_earnings_history, v_month_earnings, v_month_hours
  FROM customer_services_super_unified 
  WHERE id = p_customer_service_id;
  
  -- 计算工作时长（小时）
  SET v_work_hours = TIMESTAMPDIFF(MINUTE, v_clock_in_time, p_clock_out_time) / 60.0;
  
  -- 计算收益
  SET v_base_earnings = v_work_hours * v_hourly_rate;
  SET v_total_earnings = v_base_earnings; -- 可以后续添加提成和奖金计算
  
  -- 更新客服表
  UPDATE customer_services_super_unified 
  SET 
    today_status = 'clocked_out',
    today_clock_out_time = p_clock_out_time,
    today_work_hours = v_work_hours,
    today_base_earnings = v_base_earnings,
    today_total_earnings = v_total_earnings,
    
    -- 更新累计数据
    available_balance = available_balance + v_total_earnings,
    total_earnings = total_earnings + v_total_earnings,
    current_month_earnings = current_month_earnings + v_total_earnings,
    current_month_hours = current_month_hours + v_work_hours,
    total_work_hours = total_work_hours + v_work_hours,
    
    -- 如果是新的一天，增加工作天数
    total_work_days = total_work_days + 1,
    current_month_days = current_month_days + 1,
    
    is_online = FALSE,
    last_sync_time = NOW(),
    updated_at = NOW()
  WHERE id = p_customer_service_id;
  
  -- 记录历史日志
  INSERT INTO customer_service_history_logs (
    customer_service_id, action_type, action_date, action_time,
    clock_in_time, clock_out_time, work_hours, hourly_rate,
    base_earnings, total_earnings, 
    balance_before, balance_after, amount,
    description
  ) VALUES (
    p_customer_service_id, 'clock_out', CURDATE(), p_clock_out_time,
    v_clock_in_time, p_clock_out_time, v_work_hours, v_hourly_rate,
    v_base_earnings, v_total_earnings,
    v_current_balance, v_current_balance + v_total_earnings, v_total_earnings,
    CONCAT('客服下班打卡，工作', v_work_hours, '小时，获得收益¥', v_total_earnings)
  );
  
  COMMIT;
END //

-- 客服提现
CREATE PROCEDURE ProcessWithdrawal(
  IN p_customer_service_id INT,
  IN p_amount DECIMAL(15,2),
  IN p_alipay_account VARCHAR(255),
  IN p_description TEXT
)
BEGIN
  DECLARE v_available_balance DECIMAL(15,2);
  DECLARE v_withdrawal_id VARCHAR(50);
  
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- 检查余额
  SELECT available_balance INTO v_available_balance
  FROM customer_services_super_unified 
  WHERE id = p_customer_service_id;
  
  IF v_available_balance < p_amount THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '余额不足';
  END IF;
  
  -- 生成提现单号
  SET v_withdrawal_id = CONCAT('WD', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(p_customer_service_id, 4, '0'), LPAD(FLOOR(RAND() * 10000), 4, '0'));
  
  -- 更新客服余额
  UPDATE customer_services_super_unified 
  SET 
    available_balance = available_balance - p_amount,
    frozen_balance = frozen_balance + p_amount,
    pending_withdrawals = pending_withdrawals + p_amount,
    total_withdrawals = total_withdrawals + p_amount,
    last_withdrawal_time = NOW(),
    last_withdrawal_amount = p_amount,
    withdrawal_count = withdrawal_count + 1,
    updated_at = NOW()
  WHERE id = p_customer_service_id;
  
  -- 记录历史日志
  INSERT INTO customer_service_history_logs (
    customer_service_id, action_type, action_date, action_time,
    withdrawal_amount, withdrawal_status, alipay_account,
    balance_before, balance_after, amount,
    description, reference_id
  ) VALUES (
    p_customer_service_id, 'withdrawal', CURDATE(), NOW(),
    p_amount, 'pending', p_alipay_account,
    v_available_balance, v_available_balance - p_amount, -p_amount,
    COALESCE(p_description, CONCAT('提现申请：¥', p_amount)), NULL
  );
  
  COMMIT;
  
  SELECT v_withdrawal_id as withdrawal_id;
END //

DELIMITER ;

-- 插入示例数据
INSERT INTO customer_services_super_unified (
  username, password, plain_passwd, name, phone, email,
  hourly_rate, monthly_target_hours, monthly_target_earnings
) VALUES 
('客服12313', '$2b$10$example_hash', '123456', '客服小张', '13501111111', 'cs12313@example.com', 20.00, 160.00, 3200.00),
('客服12314', '$2b$10$example_hash', '123456', '客服小李', '13501111112', 'cs12314@example.com', 22.00, 160.00, 3520.00),
('客服12315', '$2b$10$example_hash', '123456', '客服小王', '13501111113', 'cs12315@example.com', 25.00, 160.00, 4000.00);

-- 显示创建结果
SELECT 'Super Unified Customer Service Table Created Successfully!' as message;
SELECT COUNT(*) as customer_count FROM customer_services_super_unified;
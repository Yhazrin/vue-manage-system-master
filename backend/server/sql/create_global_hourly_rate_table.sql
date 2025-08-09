-- 创建全局时薪设置表
CREATE TABLE IF NOT EXISTS global_hourly_rate_settings (
  id int(11) NOT NULL AUTO_INCREMENT,
  hourly_rate decimal(10,2) NOT NULL COMMENT '全局时薪（元/小时）',
  updated_by varchar(100) NOT NULL COMMENT '更新者用户名',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全局时薪设置表';

-- 插入默认的全局时薪设置（20元/小时）
INSERT INTO global_hourly_rate_settings (hourly_rate, updated_by) 
VALUES (20.00, 'system');
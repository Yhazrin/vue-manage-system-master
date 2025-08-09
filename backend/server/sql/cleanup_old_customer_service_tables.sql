-- 清理旧的客服相关表，防止误用
-- 只保留统一的客服表系统

USE author_center;

-- 显示当前客服相关表
SELECT 'Current customer service related tables:' as info;
SELECT TABLE_NAME, TABLE_ROWS, ROUND(DATA_LENGTH/1024, 2) as 'Size_KB'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'author_center' 
AND (TABLE_NAME LIKE '%customer_service%' OR TABLE_NAME LIKE '%attendance%')
ORDER BY TABLE_NAME;

-- 删除旧的客服表（非unified版本）
SELECT 'Dropping old customer service tables...' as info;

-- 删除旧的客服主表
DROP TABLE IF EXISTS customer_services;

-- 删除旧的权限表
DROP TABLE IF EXISTS customer_service_permissions;

-- 删除旧的薪资表
DROP TABLE IF EXISTS customer_service_salaries;

-- 删除旧的余额日志表
DROP TABLE IF EXISTS customer_service_balance_logs;

-- 删除旧的提现记录表
DROP TABLE IF EXISTS customer_service_withdrawals;

-- 删除旧的打卡记录表
DROP TABLE IF EXISTS attendance_records;

-- 删除其他可能的旧表
DROP TABLE IF EXISTS customer_service_stats;
DROP TABLE IF EXISTS customer_service_work_logs;

-- 显示删除后的表列表
SELECT 'Remaining customer service related tables:' as info;
SELECT TABLE_NAME, TABLE_ROWS, ROUND(DATA_LENGTH/1024, 2) as 'Size_KB'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'author_center' 
AND (TABLE_NAME LIKE '%customer_service%' OR TABLE_NAME LIKE '%attendance%')
ORDER BY TABLE_NAME;

-- 确认统一表存在
SELECT 'Verifying unified tables exist:' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'author_center' AND TABLE_NAME = 'customer_services_unified') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as customer_services_unified,
  CASE 
    WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'author_center' AND TABLE_NAME = 'customer_service_balance_logs_new') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as balance_logs_new,
  CASE 
    WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'author_center' AND TABLE_NAME = 'customer_service_withdrawals_new') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as withdrawals_new,
  CASE 
    WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'author_center' AND TABLE_NAME = 'attendance_records_new') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as attendance_new;

SELECT 'Cleanup completed!' as info;
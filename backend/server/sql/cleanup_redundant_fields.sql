-- 清理客服表中的多余字段
-- 只删除确实存在的字段

USE author_center;

-- 先查看当前表结构
SELECT 'Cleaning redundant fields...' as info;

-- 1. 删除可以通过计算得出的重复统计字段

-- 删除历史总工作时长（可通过历史记录计算）
ALTER TABLE customer_services_super_unified DROP COLUMN total_work_hours;
SELECT 'Dropped total_work_hours field' as status;

-- 删除历史总工作天数（可通过历史记录计算）
ALTER TABLE customer_services_super_unified DROP COLUMN total_work_days;
SELECT 'Dropped total_work_days field' as status;

-- 删除本月工作时长（可通过历史记录计算）
ALTER TABLE customer_services_super_unified DROP COLUMN current_month_hours;
SELECT 'Dropped current_month_hours field' as status;

-- 删除本月工作天数（可通过历史记录计算）
ALTER TABLE customer_services_super_unified DROP COLUMN current_month_days;
SELECT 'Dropped current_month_days field' as status;

-- 2. 删除其他可能多余的字段

-- 删除最后同步时间（超级统一表不需要同步）
ALTER TABLE customer_services_super_unified DROP COLUMN last_sync_time;
SELECT 'Dropped last_sync_time field' as status;

-- 删除昨日数据字段（可以通过历史记录查询）
ALTER TABLE customer_services_super_unified DROP COLUMN yesterday_work_hours;
SELECT 'Dropped yesterday_work_hours field' as status;

ALTER TABLE customer_services_super_unified DROP COLUMN yesterday_earnings;
SELECT 'Dropped yesterday_earnings field' as status;

-- 删除本周数据字段（可以通过历史记录计算）
ALTER TABLE customer_services_super_unified DROP COLUMN week_work_hours;
SELECT 'Dropped week_work_hours field' as status;

ALTER TABLE customer_services_super_unified DROP COLUMN week_earnings;
SELECT 'Dropped week_earnings field' as status;

ALTER TABLE customer_services_super_unified DROP COLUMN week_work_days;
SELECT 'Dropped week_work_days field' as status;

-- 3. 显示清理后的表结构
SELECT 'Table structure after cleanup:' as info;
DESCRIBE customer_services_super_unified;

SELECT 'Customer service table cleanup completed!' as final_status;
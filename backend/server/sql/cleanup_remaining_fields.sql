-- 清理剩余的多余字段
USE author_center;

-- 删除剩余的昨日和本周统计字段
ALTER TABLE customer_services_super_unified DROP COLUMN yesterday_work_hours;
SELECT 'Dropped yesterday_work_hours field' as status;

ALTER TABLE customer_services_super_unified DROP COLUMN yesterday_earnings;
SELECT 'Dropped yesterday_earnings field' as status;

ALTER TABLE customer_services_super_unified DROP COLUMN week_work_hours;
SELECT 'Dropped week_work_hours field' as status;

ALTER TABLE customer_services_super_unified DROP COLUMN week_earnings;
SELECT 'Dropped week_earnings field' as status;

ALTER TABLE customer_services_super_unified DROP COLUMN week_work_days;
SELECT 'Dropped week_work_days field' as status;

-- 显示最终的表结构
SELECT 'Final table structure:' as info;
SHOW COLUMNS FROM customer_services_super_unified;

SELECT 'Cleanup completed successfully!' as final_status;
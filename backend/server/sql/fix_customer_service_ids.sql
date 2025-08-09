-- 修复客服ID问题：将客服相关表从使用admin_id改为使用customer_service_id

-- 1. 修改attendance_records表，添加customer_service_id字段
ALTER TABLE attendance_records 
ADD COLUMN customer_service_id INT NULL AFTER admin_id,
ADD INDEX idx_customer_service_id (customer_service_id);

-- 2. 修改customer_service_salaries表，添加customer_service_id字段
ALTER TABLE customer_service_salaries 
ADD COLUMN customer_service_id INT NULL AFTER admin_id,
ADD INDEX idx_customer_service_id (customer_service_id);

-- 3. 修改customer_service_earnings表，添加customer_service_id字段
ALTER TABLE customer_service_earnings 
ADD COLUMN customer_service_id INT NULL AFTER admin_id,
ADD INDEX idx_customer_service_id (customer_service_id);

-- 4. 修改customer_service_withdrawals表，添加customer_service_id字段
ALTER TABLE customer_service_withdrawals 
ADD COLUMN customer_service_id INT NULL AFTER admin_id,
ADD INDEX idx_customer_service_id (customer_service_id);

-- 5. 数据迁移：将现有的客服数据从admin_id迁移到customer_service_id

-- 5.1 迁移attendance_records中的客服数据
UPDATE attendance_records ar
JOIN customer_services cs ON ar.admin_id = cs.id
SET ar.customer_service_id = cs.id;

-- 5.2 迁移customer_service_salaries中的客服数据
UPDATE customer_service_salaries css
JOIN customer_services cs ON css.admin_id = cs.id
SET css.customer_service_id = cs.id;

-- 5.3 迁移customer_service_earnings中的客服数据
UPDATE customer_service_earnings cse
JOIN customer_services cs ON cse.admin_id = cs.id
SET cse.customer_service_id = cs.id;

-- 5.4 迁移customer_service_withdrawals中的客服数据
UPDATE customer_service_withdrawals csw
JOIN customer_services cs ON csw.admin_id = cs.id
SET csw.customer_service_id = cs.id;

-- 6. 清理错误数据：删除那些admin_id指向managers表但不是客服的记录

-- 6.1 删除attendance_records中错误的管理员数据
DELETE ar FROM attendance_records ar
JOIN managers m ON ar.admin_id = m.id
LEFT JOIN customer_services cs ON ar.admin_id = cs.id
WHERE cs.id IS NULL;

-- 6.2 删除customer_service_salaries中错误的管理员数据
DELETE css FROM customer_service_salaries css
JOIN managers m ON css.admin_id = m.id
LEFT JOIN customer_services cs ON css.admin_id = cs.id
WHERE cs.id IS NULL;

-- 6.3 删除customer_service_earnings中错误的管理员数据
DELETE cse FROM customer_service_earnings cse
JOIN managers m ON cse.admin_id = m.id
LEFT JOIN customer_services cs ON cse.admin_id = cs.id
WHERE cs.id IS NULL;

-- 6.4 删除customer_service_withdrawals中错误的管理员数据
DELETE csw FROM customer_service_withdrawals csw
JOIN managers m ON csw.admin_id = m.id
LEFT JOIN customer_services cs ON csw.admin_id = cs.id
WHERE cs.id IS NULL;

-- 7. 删除孤立数据：删除那些admin_id既不在managers表也不在customer_services表中的记录

-- 7.1 删除attendance_records中的孤立数据
DELETE ar FROM attendance_records ar
LEFT JOIN managers m ON ar.admin_id = m.id
LEFT JOIN customer_services cs ON ar.admin_id = cs.id
WHERE m.id IS NULL AND cs.id IS NULL;

-- 7.2 删除customer_service_salaries中的孤立数据
DELETE css FROM customer_service_salaries css
LEFT JOIN managers m ON css.admin_id = m.id
LEFT JOIN customer_services cs ON css.admin_id = cs.id
WHERE m.id IS NULL AND cs.id IS NULL;

-- 7.3 删除customer_service_earnings中的孤立数据
DELETE cse FROM customer_service_earnings cse
LEFT JOIN managers m ON cse.admin_id = m.id
LEFT JOIN customer_services cs ON cse.admin_id = cs.id
WHERE m.id IS NULL AND cs.id IS NULL;

-- 7.4 删除customer_service_withdrawals中的孤立数据
DELETE csw FROM customer_service_withdrawals csw
LEFT JOIN managers m ON csw.admin_id = m.id
LEFT JOIN customer_services cs ON csw.admin_id = cs.id
WHERE m.id IS NULL AND cs.id IS NULL;

-- 8. 验证数据迁移结果
SELECT 'attendance_records迁移结果' as table_name, 
       COUNT(*) as total_records,
       COUNT(customer_service_id) as migrated_records
FROM attendance_records
UNION ALL
SELECT 'customer_service_salaries迁移结果' as table_name,
       COUNT(*) as total_records,
       COUNT(customer_service_id) as migrated_records
FROM customer_service_salaries
UNION ALL
SELECT 'customer_service_earnings迁移结果' as table_name,
       COUNT(*) as total_records,
       COUNT(customer_service_id) as migrated_records
FROM customer_service_earnings
UNION ALL
SELECT 'customer_service_withdrawals迁移结果' as table_name,
       COUNT(*) as total_records,
       COUNT(customer_service_id) as migrated_records
FROM customer_service_withdrawals;
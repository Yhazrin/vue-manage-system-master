-- 删除所有表中的nickname字段
USE author_center;

-- 删除超级统一客服表中的nickname字段
ALTER TABLE customer_services_super_unified DROP COLUMN IF EXISTS nickname;

-- 删除统一客服表中的nickname字段（如果存在）
ALTER TABLE customer_services_unified DROP COLUMN IF EXISTS nickname;

-- 删除旧客服表中的nickname字段（如果存在）
ALTER TABLE customer_services DROP COLUMN IF EXISTS nickname;

-- 显示修改后的表结构
DESCRIBE customer_services_super_unified;
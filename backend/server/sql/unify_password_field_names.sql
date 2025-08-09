-- 统一密码字段命名：将客服表的 plain_password 改为 plain_passwd
-- 这样所有角色（管理员、用户、陪玩、客服）都使用相同的字段名

-- 1. 为客服表添加新的 plain_passwd 字段
ALTER TABLE customer_services_super_unified 
ADD COLUMN plain_passwd VARCHAR(50) COMMENT '明文密码(用于显示)' AFTER password;

-- 2. 将 plain_password 的数据复制到 plain_passwd
UPDATE customer_services_super_unified 
SET plain_passwd = plain_password 
WHERE plain_password IS NOT NULL;

-- 3. 删除旧的 plain_password 字段
ALTER TABLE customer_services_super_unified 
DROP COLUMN plain_password;

-- 验证修改结果
SELECT 'customer_services_super_unified表字段统一完成' as status;
DESCRIBE customer_services_super_unified;
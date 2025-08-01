-- 修复管理员权限设置
UPDATE managers SET authority = 1 WHERE phone_num = '13900000001';

-- 验证更新结果
SELECT id, name, phone_num, authority, status FROM managers WHERE phone_num = '13900000001';